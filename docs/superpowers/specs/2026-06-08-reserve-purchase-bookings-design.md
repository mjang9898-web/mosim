# Reserve → Purchase → Travel Bookings — design

Status: **approved by founder 2026-06-08.** Extends the funnel past the AI itinerary
into a real engagement + booking flow, while keeping Mosim's **concierge-fee-only**
money model (hospitals/hotels/flights paid by the customer directly to vendors).

## Goal

After a traveler gets their AI itinerary and saves it, let them **commit** to the trip
in a self-serve way that only pulls in human (concierge) time once they're serious —
addressing the labor-cost concern with the old "Let's talk to a human on every visit"
default.

## The journey (driven by `itineraries.status`)

```
Plan (AI) → Save (account)
  ① Reserve this trip   [free, intent]      status: new → reserved   (+ notify Mosim)
  ② Mosim confirms dates / hospital slots, reaches out
                                            status: reserved → reviewing → quoted (confirmed, ready to pay)
  ③ Purchase concierge fee   [existing /pay: split + share link]
                                            status: quoted → booked   (record_payment, existing)
  ④ Travel bookings unlocked (hotel + flight)
```

Human concierge time is spent only from ② onward (serious, reserved travelers) — never
for every anonymous visitor.

### Status model

Reuse the existing `STAGES = ['new','reviewing','quoted','booked']` and insert one:
**`['new','reserved','reviewing','quoted','booked']`**.

| status | meaning | customer-facing line |
|---|---|---|
| `new` | plan saved | "Your plan is saved." |
| `reserved` | customer reserved (free) | "Reserved — we're confirming your dates." |
| `reviewing` | Mosim confirming availability | "We're lining up your care and dates." |
| `quoted` | confirmed, ready to pay | "Confirmed — ready when you are." |
| `booked` | concierge fee paid | "Booked — let's get you to Korea." |

## Phase 1 — Reserve + status wiring (no new infra)

1. **Reserve action.** On My Page Overview, a `new`-status trip shows a **"Reserve this
   trip"** button. Clicking it → `POST /api/reserve` (bearer token, `{ itinerary_id }`,
   owner-checked) → sets `status='reserved'`; idempotent (only from `new`). Best-effort
   notify Mosim by email (reuse the dormant Resend `notifyByEmail` path; no-op until
   `RESEND_API_KEY`/`LEAD_NOTIFY_EMAIL` set).
2. **Status display.** Overview + Status tab render the new 5-stage stepper and the lines
   above. `reserved` shows a calm "we're confirming" panel (no payment button yet).
3. **Purchase.** When `status` is `quoted` (Mosim confirmed) — and, in the current test
   phase, also generally available — show the **"Purchase concierge fee"** action, which
   reuses the existing `setupPayment()` → `/api/payment-group` → `/pay` flow (split +
   share link). On full payment, `record_payment` already flips the itinerary to `booked`.
   (Live payments still gated on a real PayPal key — unchanged.)
4. **Mosim-side confirm.** Moving `reserved → reviewing → quoted` is a Mosim action. For
   Phase 1 this is done via the existing admin path (cockpit / DB) — no new customer UI.
   A minimal cockpit control is Phase 2.

No schema change required (status is free-text `text default 'new'`). No new external cost.

## Phase 2 — Travel bookings (hotel + flight)

Unlocked on the trip once `status = 'booked'` (concierge fee paid). A **"Travel
bookings"** area on that itinerary in My Page supports **both directions**:

- **ⓐ Mosim recommendations (links).** Mosim posts hotel/flight booking links + notes for
  that trip; the customer clicks to **book & pay the vendor directly** (Mosim never
  touches that money). Posted via a minimal cockpit per-trip control.
- **ⓑ Customer uploads.** The customer books on any site they like and **uploads the
  confirmation** (PDF/image) so Mosim has the full itinerary.

### Data model (Phase 2)

New table `public.bookings`:
`id uuid pk, itinerary_id uuid fk, kind text ('link'|'upload'), category text
('hotel'|'flight'|'other'), label text, url text null, file_path text null,
created_by text ('mosim'|'customer'), created_at timestamptz`.
RLS: customer can read rows for their own itineraries and insert `kind='upload'`;
Mosim (service role / cockpit) inserts `kind='link'`.

Uploads use a **private Supabase Storage bucket** (`bookings`, ~free tier), keyed by
`user_id/itinerary_id/...`, with RLS so only the owner + Mosim can read. New endpoints:
`/api/booking-upload` (signed-URL or proxied upload, owner-checked) and a cockpit
`/api/booking-link` (owner=Mosim posts a link).

## Cross-cutting

- **Privacy:** `care.note` is never persisted (already stripped on save/lead); no change.
- **Money model unchanged:** Mosim only ever charges the concierge fee; hotel/flight/
  medical are paid by the customer to vendors directly (ⓐ links / ⓑ self-booked).
- **Reuse:** purchase = the existing payment system; notifications = the dormant Resend
  path; auth = existing bearer-token pattern.

## Out of scope (for now)

Real PayPal live keys (separate, needs incorporation); automated availability checking
(Mosim confirms manually); a full vendor-integration/booking engine.
