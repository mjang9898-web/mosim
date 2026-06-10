# Admin activation — lead management + entry point + admin list

**Date:** 2026-06-10
**Status:** Approved (design)

## Goal
Two admin-console improvements on mosim-site:
1. **Lead management** — surface the `leads` table in the cockpit and let an admin triage it (status changes), instead of leads only living in the DB.
2. **Entry point + admin list** — give admins a way to reach the cockpit (it's currently URL-only) and see who the admins are.

## Context (verified)
- Admin gating: `api/_lib/admin.js` — `adminEmails()` (env `ADMIN_EMAILS`, comma-split, default `mjang9898@gmail.com`) + `getAdminUser(req, admin)` (Bearer token → service-role `getUser` → email in allowlist). Server-side enforced; every `api/admin/*` returns 403 otherwise.
- **Live `ADMIN_EMAILS` (project `mosim`) = `mjang9898@gmail.com,care@mosimkorea.com`** (2 admins).
- `leads` table: `id, created_at, name, email, origin_from, travel_when, interest, note, state(jsonb), status` (status text: `new|contacted|quoted|booked|lost`). RLS: anon insert + own-row select; **no admin read** → admin endpoints use the service-role client (like `api/admin/trips.js`).
- `cockpit.html` is a single-table IIFE (no tabs): `#filters` + `#dash`, `load()`/`render()`, `esc()` helper, status filter pills.
- Nav auth swap = inline IIFE targeting `#nav-auth`, reads `localStorage['sb-ktcwpowkyovyrlwajajm-auth-token']`. me.html uses `js/nav-auth.js` (`#kw-nav-auth`, `window.kwAuth`).
- No `whoami` endpoint exists; no client code knows admin-ness.
- **Flag (not in this build):** two Vercel projects share the repo — `mosim` (real prod, has env) and `mosim-site` (stale, missing `ADMIN_EMAILS`/secrets). Recommend deleting/retiring `mosim-site` to avoid a deploy landing there with an empty admin list. Founder action, not code.

## Decisions (approved)
- **Admin management = read-only list** (env-based add). Show current admins in the cockpit; adding/removing is done by editing `ADMIN_EMAILS` in Vercel + redeploy. No `admin_users` table, no schema change.
- **Entry point = My Page only** (`me.html`) — a single, login-gated place; do not edit the nav IIFE across every page.

## Build

### Backend — 3 new endpoints (mirror `api/admin/trips.js`: service-role client, `getAdminUser` → 403)
1. **`GET /api/admin/whoami`** → 200 `{ isAdmin:true, email:<user email>, admins: adminEmails() }` for an admin; 403 `{error:'Admins only'}` otherwise. (Returning the list is safe — only admins get 200.)
2. **`GET /api/admin/leads`** → `{ leads: [ {id, created_at, name, email, origin_from, travel_when, interest, note, status} ] }`, newest-first, `.limit(200)`. (Do NOT return `state` jsonb — keep payload lean; it can hold PII like care notes.)
3. **`POST /api/admin/lead-status`** body `{ id, status }`; validate `status` ∈ `['new','contacted','quoted','booked','lost']` (400 otherwise); update `leads.status`; return `{ ok:true }`.

### Frontend — cockpit.html
- Add a **top-level view switcher** above `#filters`: **Trips · Leads · Admins** (a small `currentView` toggle; all three repaint `#dash`, reusing `esc()`).
  - **Trips**: existing table/behavior unchanged.
  - **Leads**: `loadLeads()`/`renderLeads()` — table of name · email (mailto) · interest · when · origin · note · created date · a **status `<select>`** (new/contacted/quoted/booked/lost) → `POST /api/admin/lead-status`. Status filter pills optional (reuse pattern) but not required for v1.
  - **Admins**: a simple panel listing the current admins (from `GET /api/admin/whoami` `.admins`), with a one-line note "To add or remove an admin, edit `ADMIN_EMAILS` in Vercel and redeploy." (read-only).

### Frontend — me.html
- On load, if signed in, call `GET /api/admin/whoami` with the bearer token; **only on 200 (admin)**, reveal a "Cockpit" link/button (to `/cockpit.html`). Non-admins never see it and the call 403s silently. Place it tastefully within the My Page chrome (e.g. a small admin entry near the header or settings tab).

## Verification
- Code: build/lint clean; each endpoint 403s without a valid admin Bearer token (curl check on the unauth path).
- **Honest limitation:** fully verifying the admin-gated UI (cockpit Leads/Admins views, the me.html Cockpit link appearing) requires a **logged-in admin session** — Playwright can't easily mint one. visual-qa should verify: the public/unauth paths (403, link hidden for anon/non-admin), DOM structure, response-shape↔frontend usage match, and no console errors; and explicitly report what could NOT be verified without an admin session (the founder verifies those live, as before). No false PASS.

## Cost
None — plain serverless + static within existing Vercel/Supabase free tiers. Zero-cost phase preserved.
