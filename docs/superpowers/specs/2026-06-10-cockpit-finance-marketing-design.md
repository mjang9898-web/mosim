# Cockpit: Finance tab (accounting dashboard) + Marketing placeholder

**Date:** 2026-06-10 · **Status:** Approved (design)

## Scope
- **Marketing tab** — placeholder only this iteration ("coming soon", pending a
  parallel marketing-tool deep research). No API. Features/visuals decided later.
- **Finance tab** — the real work: a finance/accounting dashboard for the
  finance/accounting agent team. Standard accounting concepts (revenue, revenue
  sources, payment methods card/cash/PayPal, fees), built **method-agnostic** so
  that when PayPal/credit-card/other payment methods are turned on later, they
  light up automatically. Currently the only data is the Supabase `payments` /
  `payment_groups` (sandbox/mock until live PayPal keys post-incorporation).

## Constraints
- Vercel Hobby 12-function cap → add `?action=finance` to `api/admin/trips.js`
  (no new files). See [[reference-vercel-function-cap]]. Admin-gated. Zero cost.

## Data (verified)
- `payment_groups`: per-itinerary invoice — `total_amount, amount_paid, currency,
  status(open|paid), share_token, paid_at`. Outstanding = total − paid.
- `payments`: per-transaction ledger — `payer_name, payer_email, amount,
  paypal_order_id, paypal_capture_id, status(completed|refunded), created_at`.
  Method is implicit: capture/order id starting `MOCK-` = test/mock, else paypal.
  Card/cash do not exist yet — show as zero categories (future-proof).
- Processing **fees are NOT captured** anywhere → Fees shows "—" + a note; will
  populate when a provider's transaction/fee reporting is wired (live keys).

## Backend — `GET /api/admin/trips?action=finance`
`{ finance: {
  currency: 'USD',
  summary: { invoiced, collected, outstanding, refunded, net },   // collected=sum completed amount; outstanding=sum group(total-paid); refunded=sum refunded; net=collected-refunded-fees(0 now)
  byMethod: [ {method, label, count, gross} ... ] ,               // always include PayPal, Credit card, Cash, Other (+ mock/test) so the chart-of-accounts is always visible; zeros when off
  fees: { total: null, note },                                    // not captured yet
  transactions: [ {id, created_at, payer_name, payer_email, amount, method, status, capture_id, itinerary_id} ],  // newest, limit 200
  receivables: [ {itinerary_id, customer, total, paid, outstanding, status, share_token} ]  // open groups, customer from profiles/auth
} }`
Best-effort/resilient (each section try/caught). Reuse the service-role `admin`
client + `getAdminUser` gate already in trips.js.

## Frontend — cockpit.html
- Tab order: **Overview · Finance · Marketing · Members · Trips · Leads · Admins.**
- **Finance view**: top-line cards (Collected/Outstanding/Refunded/Net), a
  by-method table (PayPal/Card/Cash/Other w/ count+gross, USD), a Fees line
  ("—", note), the transactions ledger table, and a receivables table (open
  invoices w/ pay link). A small banner noting sandbox/test until live keys.
  USD formatting via a usd() helper. Reuse esc()/fmtDate. Graceful empty states
  (data is mostly zero today).
- **Marketing view**: a simple centered placeholder card — "Marketing — coming
  soon" + one line ("dashboards & tools land after the marketing research").

## Verify
- Function count stays 12; build passes; unauth → 403 on `?action=finance`.
- Live admin-session check (founder via Chrome MCP) for the Finance dashboard
  rendering + empty states. No false PASS on authed paths.
