# Split Payment (분할 결제) — Design Spec

**Date:** 2026-05-29
**Status:** Approved for planning
**Author:** Founder + Claude (brainstorming)

## Problem

mosim is a K-Wellness concierge lead-gen funnel. We want to collect the **concierge
service fee** from US customers. A Korean corporation (한국 법인) cannot open Stripe
directly, so the payment rail for the MVP is **PayPal (Korea business account)**.

Actual trip costs (flights, hotels, medical procedures) are paid by the customer
**directly to vendors** — mosim never holds or routes those funds. mosim collects only
its own service fee, which removes deposit/escrow/regulatory exposure.

Real-world scenario driving the design: two senior couples (4 people) travel together.
One person (the organizer) plans the trip. Total concierge fee = $1,200 × 4 = $4,800.
The organizer pays for their own couple ($2,400) and forwards a link so the friend
couple pays the remaining $2,400. This requires **split payment** — a website feature,
not a payment-processor feature.

## Decisions (locked during brainstorming)

| # | Decision | Choice |
|---|----------|--------|
| 1 | Split mechanism | **Balance-sharing** — one shared link covers the remaining balance; anyone with the link pays it down (full or partial) until balance = $0 |
| 2 | Does the link payer need an account? | **No login required.** Link uses an unguessable random token; payer enters name/email at checkout |
| 3 | MVP payment provider | **PayPal only** (Korea business account). Domestic PG (TossPayments/KG Inicis) is a documented Phase-2 add-on on the same data model |
| 4 | How the total fee is set | **Hybrid** — default formula `$1,200 × group_size`, overridable per itinerary |
| 5 | When the override happens | **Immediate self-serve.** Group/link goes live automatically at the default amount; mosim adjusts the amount in Supabase **before** any payment is made. No admin-approval gate in MVP |

## Architecture

Static HTML + Vercel serverless `/api/*` + Supabase + PayPal JS SDK. Follows existing
repo patterns (`api/lead.js`, `api/save-itinerary.js` use Supabase service-role key
server-side; anon never touches protected tables directly).

### Core concept

Each itinerary that is being paid for gets one **payment group**. A single universal
page `/pay?g=<token>` handles all payments — the organizer and every friend use the
**same page**. The page shows the trip summary, the total, the amount already paid, the
remaining balance, an amount field (default = remaining balance), a PayPal button, and a
"copy share link" button.

### Flow

```
[result.html] itinerary saved (organizer, logged in)
   → "Pay concierge fee" CTA
   → POST /api/payment-group (create, idempotent) — server computes $1,200 × group_size
   → redirect to /pay?g=<token>
        ├─ organizer pays $2,400 via PayPal      → balance $2,400
        ├─ "Copy share link" → organizer sends link via KakaoTalk/email themselves
        └─ friend (no login) opens same link → pays remaining $2,400 → balance $0 → "Fully paid"
   [trip actuals billed by vendors directly to the customer — out of mosim scope]
```

Link delivery is **manual** in the MVP — the organizer copies the link and shares it.
No system-sent email (avoids adding email infrastructure for a senior audience).

## Data model (new Supabase tables)

### `payment_groups` — one per itinerary being paid

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid pk | `gen_random_uuid()` |
| `itinerary_id` | uuid fk → `itineraries.id` | owner tracked via the itinerary's `user_id` |
| `share_token` | text unique | unguessable random token used in `/pay?g=` |
| `total_amount` | numeric | default `1200 × group_size`; **editable in DB before payment** |
| `amount_paid` | numeric | default `0`; incremented on each capture |
| `currency` | text | `'USD'` |
| `status` | text | `'open'` \| `'paid'` (paid when `amount_paid >= total_amount`) |
| `created_at` | timestamptz | `now()` |
| `paid_at` | timestamptz | set when fully paid |

One payment group per itinerary (unique constraint on `itinerary_id`). Creation is
idempotent — re-clicking the CTA returns the existing group.

### `payments` — one row per completed PayPal transaction

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid pk | |
| `payment_group_id` | uuid fk → `payment_groups.id` | |
| `payer_name` | text | captured at checkout / from PayPal |
| `payer_email` | text | captured at checkout / from PayPal |
| `amount` | numeric | this transaction's amount |
| `paypal_order_id` | text | PayPal reconciliation |
| `paypal_capture_id` | text | PayPal reconciliation |
| `status` | text | `'completed'` \| `'refunded'` |
| `created_at` | timestamptz | `now()` |

### Row-Level Security

- Both tables: **no anon access.** RLS denies the `anon` role.
- The anonymous `/pay` page reads the group summary and records payments **only through
  serverless functions** that use the service-role key (which bypasses RLS) and look up
  the group by `share_token`. Same trust pattern as `save-itinerary.js`.
- The organizer reads their own itinerary's payment status on My Page; expose a minimal
  read path scoped to itineraries they own (via an authenticated serverless call or an
  owner-scoped RLS policy on `payment_groups` keyed through `itinerary_id`'s owner).

## Files

**New**
- `pay.html` + `js/pay.js` — universal payment + share page (summary, balance, amount
  field, PayPal button, copy-link button)
- `api/payment-group.js` — create (idempotent, owner-authenticated) + get-by-token (anon)
- `api/paypal-order.js` — create PayPal order (amount validated ≤ remaining balance) +
  capture order, then record a `payments` row and increment `payment_groups.amount_paid`;
  flip group to `paid` + set itinerary status when balance hits 0
- DB migration SQL — the two tables above + RLS policies

**Modified**
- `result.html` — replace the existing `// CTA handlers — payment integration goes here`
  placeholder with the "Pay concierge fee" CTA → create group → navigate to `/pay`
- My Page itineraries card — show payment status (unpaid / `$X of $Y` / paid)
- `PRD.md` — define the payment step + `pay.html` page (required by CLAUDE.md before
  adding a new page)
- `CLAUDE.md` — update data-flow section to include the payment group
- `vercel.json` / env — add `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_ENV`

> **CLAUDE.md gate:** `pay.html` is a new page outside the currently-defined funnel.
> Per project rules, **PRD.md must define the payment step first** — this is the first
> deliverable in the implementation plan.

## Rules & edge cases (MVP scope)

- **Overpayment prevention:** the server caps each order at the current remaining
  balance and rejects an amount greater than the balance.
- **Concurrent payment race:** balance is validated at order-creation time. Two payers
  paying at the exact same moment could in theory overshoot; for a 2-couple group this is
  negligible and is documented as a known limitation, not handled in MVP.
- **Refunds:** out of MVP scope — handled manually via the PayPal dashboard. `amount_paid`
  is **not** auto-decremented on a manual refund (operational note for the founder).
- **Link expiry:** none in MVP; the group locks automatically when fully paid. The
  founder can deactivate a link by editing the row in Supabase.
- **Currency:** USD only.
- **Minimum payment:** sensible minimum (e.g. ≥ $1); the amount field defaults to the
  full remaining balance.

## Out of scope (explicitly deferred)

- Domestic PG (TossPayments / KG Inicis) — Phase 2, same data model
- US entity + Stripe — only if/when global scale justifies the entity overhead
- Automated refund handling and `amount_paid` reconciliation
- System-sent payment-request emails / reminders
- Admin approval gate for per-trip pricing (Decision #5 deferred the (B) variant)

## Success criteria

1. Organizer on `result.html` can create a payment group and reach `/pay?g=<token>`.
2. Organizer pays a partial amount via PayPal; balance decreases correctly.
3. A second person opens the same link **without logging in** and pays the remaining
   balance; group flips to `paid` and the itinerary reflects paid status.
4. Overpayment beyond the remaining balance is rejected by the server.
5. Each payment records payer name/email and PayPal order/capture IDs for reconciliation.
6. My Page shows the itinerary's payment status to the organizer.
