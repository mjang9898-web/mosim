# Admin cockpit → dashboard (exit nav + Overview + Members)

**Date:** 2026-06-10 · **Status:** Approved (design)

## Goal
Make the cockpit a usable, comprehensive admin console: (A) add a way OUT of
cockpit (it currently traps you — no nav), (B) an Overview dashboard of key
metrics, (C) a Members list of all signups with signup date/time.

## Constraints
- Vercel Hobby **12-function cap** — add ZERO new function files. New endpoints
  are `?action=` branches inside `api/admin/trips.js` (the admin hub). See
  [[reference-vercel-function-cap]].
- Zero-cost; all within existing Supabase/Vercel free tiers.
- Admin-gated by `getAdminUser` (already on trips.js). Service-role client.

## A. Exit / nav (cockpit.html)
Add a top header bar: brand "Mosim cockpit" + actions: **View site** (→ `/`),
**My Page** (→ `/me.html`), **Sign out** (clear the Supabase session via kwAuth/
client.auth.signOut, then → `/`). Fixes the no-way-out trap.

## B. `GET /api/admin/trips?action=overview`
Returns `{ overview: {
  members: { total, newThisWeek },          // listUsers count + created_at within 7d
  leads:   { total, byStatus:{new,contacted,quoted,booked,lost} },
  trips:   { total, byStage:{new,reserved,reviewing,quoted,booked,archived} },
  revenue: { invoiced, paid, outstanding }, // sum payment_groups total/paid
  recent:  { signups:[{email,created_at}...5], leads:[{name,email,created_at,status}...5] }
} }`. Serverless handler may use `new Date()` for the 7-day window.

## C. `GET /api/admin/trips?action=members`
Returns `{ members:[ { id, email, name, phone, provider, created_at,
last_sign_in_at, trips } ] }` — join auth listUsers (id/email/created_at/
last_sign_in_at/provider from identities|app_metadata) + profiles (name,phone)
+ itineraries count per user_id. Newest signups first. limit ~1000 (listUsers page).

## Frontend (cockpit.html)
- Tab order: **Overview · Members · Trips · Leads · Admins**; Overview is the
  default first paint.
- Overview view: metric cards (Members / Leads / Trips-by-stage / Revenue) +
  a small "recent signups" and "recent leads" list. Warm-Trust-consistent with
  cockpit's existing inline style.
- Members view: table (Name · Email · Provider · Signed up [date+time] · Last
  sign in · Trips). Reuse esc()/fmtDate.
- Header nav (section A) above the tabs.

## Verify
- Function count stays **12**. Build passes.
- Unauth → 403 on the new actions.
- Admin-gated UI (cards populate, members table) needs a live admin session —
  founder verifies; visual-qa checks structure + unauth + shapes. No false PASS.
