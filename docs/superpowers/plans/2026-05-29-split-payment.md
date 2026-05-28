# Split Payment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a logged-in organizer collect the Mosim concierge fee for an itinerary via a shareable PayPal payment link that any number of people (no login required) can pay down until the balance reaches $0.

**Architecture:** One `payment_groups` row per itinerary tracks `total_amount` / `amount_paid`; a random `share_token` powers a universal `/pay?g=<token>` page used by everyone. The anonymous payer flow goes through service-role serverless functions (`/api/payment-group`, `/api/paypal-order`) — the browser never touches the protected tables. PayPal capture is recorded atomically via a Postgres `record_payment` function.

**Tech Stack:** Static HTML + Vercel ESM serverless functions + Supabase (Postgres + RLS + service-role client, same pattern as `api/lead.js`) + PayPal REST API (via `fetch`, no SDK dependency) + PayPal JS Buttons on the client. Tests: Node's built-in `node:test` for pure logic; PayPal sandbox + Playwright for integration.

**Testing reality:** This repo has no test framework. Do NOT add Jest/Vitest. Pure functions get real `node:test` tests (Task 2). Integration-heavy tasks (DB, PayPal, pages) are verified with the exact curl/SQL/Playwright steps written into each task — these are the verification, not afterthoughts.

**Prerequisites the human must provide before Task 4+:**
- A PayPal **sandbox** business account + a sandbox personal (buyer) account (https://developer.paypal.com → Sandbox → Accounts).
- Sandbox REST app credentials → `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`.
- These added to `.env.local` for `vercel dev` and to Vercel Project env vars.

---

## File Structure

**New files**
- `db/2026-05-29-split-payment.sql` — tables, RLS, `record_payment()` function (applied via Supabase SQL Editor)
- `api/_lib/amount.js` — pure amount validation (testable, no I/O)
- `api/_lib/paypal.js` — PayPal REST helper (OAuth token, create order, capture order)
- `api/payment-group.js` — create-or-get group (owner-auth) + get-by-token (anon)
- `api/paypal-order.js` — create PayPal order + capture & record
- `pay.html` — universal payment + share page
- `js/pay.js` — pay page logic
- `test/amount.test.mjs` — tests for `api/_lib/amount.js`

**Modified files**
- `PRD.md` — define the payment step + `pay.html` (CLAUDE.md gate — Task 0)
- `api/config.js` — also expose `paypalClientId` + `paypalEnv`
- `result.html` — replace `onBookNow()` placeholder with create-group → redirect to `/pay`
- `js/me-itineraries.jsx` — show payment status on itinerary cards
- `package.json` — add `"test": "node --test"` script
- `CLAUDE.md` — update data-flow + deploy checklist (Task 9)

---

## Task 0: PRD gate — define the payment step

CLAUDE.md forbids adding a new page outside the funnel without updating PRD first. `pay.html` is a new page, so this is the first deliverable.

**Files:**
- Modify: `PRD.md`

- [ ] **Step 1: Add a "Concierge fee payment" section to PRD.md**

Add a new section describing: (a) the funnel ends at `result.html`; (b) a logged-in user saves an itinerary then pays the concierge fee (`$1,200 × group size`, overridable); (c) `pay.html` is a shareable, login-free page where multiple people pay down a shared balance via PayPal; (d) trip actuals are paid by the customer directly to vendors and are out of scope. Reference the design spec:

```markdown
## Concierge fee payment (split payment)

After the funnel produces an itinerary on `result.html`, a logged-in user can pay the
Mosim **concierge fee** (`$1,200 × group size`, adjustable per trip). Payment uses a
shareable, **login-free** page `/pay?g=<token>` backed by a per-itinerary *payment group*
that tracks total / paid / balance. Anyone with the link can pay part or all of the
remaining balance via **PayPal** until the balance is $0 (e.g. an organizer pays for one
couple and forwards the link to the other). Trip actuals (flights, hotels, procedures)
are paid by the customer **directly to vendors** and are out of Mosim's payment scope.

Design spec: `docs/superpowers/specs/2026-05-29-split-payment-design.md`
```

- [ ] **Step 2: Commit**

```bash
git add PRD.md
git commit -m "docs: PRD — add concierge fee split-payment step"
```

---

## Task 1: Database schema + record_payment function

**Files:**
- Create: `db/2026-05-29-split-payment.sql`

- [ ] **Step 1: Write the migration SQL**

Create `db/2026-05-29-split-payment.sql`:

```sql
-- Split payment: payment_groups + payments + record_payment()

create table if not exists public.payment_groups (
  id            uuid primary key default gen_random_uuid(),
  itinerary_id  uuid not null unique references public.itineraries(id) on delete cascade,
  share_token   text not null unique,
  total_amount  numeric(10,2) not null check (total_amount >= 0),
  amount_paid   numeric(10,2) not null default 0 check (amount_paid >= 0),
  currency      text not null default 'USD',
  status        text not null default 'open',   -- 'open' | 'paid'
  created_at    timestamptz not null default now(),
  paid_at       timestamptz
);

create table if not exists public.payments (
  id                uuid primary key default gen_random_uuid(),
  payment_group_id  uuid not null references public.payment_groups(id) on delete cascade,
  payer_name        text,
  payer_email       text,
  amount            numeric(10,2) not null check (amount > 0),
  paypal_order_id   text,
  paypal_capture_id text,
  status            text not null default 'completed',  -- 'completed' | 'refunded'
  created_at        timestamptz not null default now()
);

create index if not exists payments_group_idx on public.payments(payment_group_id);

-- RLS: anon has NO access. The anon /pay flow goes through service-role functions.
alter table public.payment_groups enable row level security;
alter table public.payments enable row level security;

-- Owner (the itinerary's user) may READ their own group, for My Page.
drop policy if exists "pg_select_owner" on public.payment_groups;
create policy "pg_select_owner" on public.payment_groups
  for select to authenticated
  using (exists (
    select 1 from public.itineraries i
    where i.id = payment_groups.itinerary_id and i.user_id = auth.uid()
  ));
-- No client insert/update/delete policies: only the service role (bypasses RLS) writes.
-- payments has no policies at all → only the service role can touch it.

-- Atomic capture recording: lock the group, insert payment, bump amount_paid,
-- flip to 'paid' (+ mark itinerary booked) when the balance reaches zero.
create or replace function public.record_payment(
  p_token       text,
  p_amount      numeric,
  p_payer_name  text,
  p_payer_email text,
  p_order_id    text,
  p_capture_id  text
) returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  g         public.payment_groups%rowtype;
  new_paid  numeric;
  new_status text;
begin
  select * into g from public.payment_groups where share_token = p_token for update;
  if not found then
    raise exception 'payment group not found';
  end if;

  insert into public.payments(
    payment_group_id, payer_name, payer_email, amount, paypal_order_id, paypal_capture_id, status
  ) values (g.id, p_payer_name, p_payer_email, p_amount, p_order_id, p_capture_id, 'completed');

  new_paid := g.amount_paid + p_amount;
  new_status := case when new_paid >= g.total_amount then 'paid' else 'open' end;

  update public.payment_groups
     set amount_paid = new_paid,
         status      = new_status,
         paid_at     = case when new_status = 'paid' and paid_at is null then now() else paid_at end
   where id = g.id;

  if new_status = 'paid' then
    update public.itineraries set status = 'booked' where id = g.itinerary_id;
  end if;

  return json_build_object(
    'paid', new_paid, 'total', g.total_amount,
    'balance', g.total_amount - new_paid, 'status', new_status
  );
end;
$$;
```

- [ ] **Step 2: Apply it in Supabase**

Open the Supabase project → SQL Editor → paste the file contents → Run. (Or apply via the Management API per `memory/reference_supabase.md`.)
Expected: "Success. No rows returned."

- [ ] **Step 3: Verify the schema**

In the SQL Editor run:

```sql
select table_name from information_schema.tables
where table_schema='public' and table_name in ('payment_groups','payments');
select proname from pg_proc where proname = 'record_payment';
```
Expected: both tables listed, `record_payment` listed.

- [ ] **Step 4: Verify RLS blocks anon**

In the SQL Editor (which runs as a privileged role, so test via the REST API instead) run this from a terminal using the **anon** key:

```bash
curl -s "$SUPABASE_URL/rest/v1/payment_groups?select=*" \
  -H "apikey: $SUPABASE_ANON_KEY" -H "Authorization: Bearer $SUPABASE_ANON_KEY"
```
Expected: `[]` (RLS hides all rows from anon) — not an array of data.

- [ ] **Step 5: Commit**

```bash
git add db/2026-05-29-split-payment.sql
git commit -m "feat(db): payment_groups + payments tables, record_payment fn, RLS"
```

---

## Task 2: Pure amount validation (TDD)

**Files:**
- Create: `api/_lib/amount.js`
- Test: `test/amount.test.mjs`
- Modify: `package.json`

- [ ] **Step 1: Add the test script to package.json**

In `package.json` `"scripts"`, add:

```json
    "test": "node --test"
```

- [ ] **Step 2: Write the failing test**

Create `test/amount.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeAmount } from '../api/_lib/amount.js';

test('accepts a valid amount within balance', () => {
  assert.deepEqual(normalizeAmount('2400', 4800), { ok: true, amount: 2400 });
});

test('rounds to cents', () => {
  assert.deepEqual(normalizeAmount(10.005, 4800), { ok: true, amount: 10.01 });
});

test('rejects non-numeric', () => {
  assert.equal(normalizeAmount('abc', 4800).ok, false);
});

test('rejects below $1 minimum', () => {
  assert.equal(normalizeAmount(0.5, 4800).ok, false);
});

test('rejects amount over the remaining balance', () => {
  const r = normalizeAmount(5000, 4800);
  assert.equal(r.ok, false);
  assert.match(r.error, /balance/i);
});

test('accepts paying the exact remaining balance', () => {
  assert.deepEqual(normalizeAmount(4800, 4800), { ok: true, amount: 4800 });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npm test`
Expected: FAIL — `Cannot find module '../api/_lib/amount.js'`.

- [ ] **Step 4: Write the implementation**

Create `api/_lib/amount.js`:

```js
// Pure validation for a single payment amount against a remaining balance.
// No I/O — unit tested in test/amount.test.mjs.

export function normalizeAmount(input, balance) {
  const amt = Number(input);
  if (!Number.isFinite(amt)) return { ok: false, error: 'Amount must be a number' };
  const rounded = Math.round(amt * 100) / 100;
  if (rounded < 1) return { ok: false, error: 'Minimum payment is $1' };
  if (rounded > balance) return { ok: false, error: 'Amount exceeds remaining balance' };
  return { ok: true, amount: rounded };
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npm test`
Expected: PASS — all 6 tests pass.

- [ ] **Step 6: Commit**

```bash
git add api/_lib/amount.js test/amount.test.mjs package.json
git commit -m "feat(api): pure payment-amount validation with tests"
```

---

## Task 3: payment-group endpoint (create-or-get + get-by-token)

**Files:**
- Create: `api/payment-group.js`

- [ ] **Step 1: Write the endpoint**

Create `api/payment-group.js`:

```js
// POST  /api/payment-group   (Bearer token + { itinerary_id })  → create-or-get; owner only
// GET   /api/payment-group?token=<t>                            → public summary by token
import { createClient } from '@supabase/supabase-js';
import crypto from 'node:crypto';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const FEE_PER_PERSON = 1200;

const supa = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false }
    })
  : null;

function groupSize(state) {
  const t = state?.trip || {};
  const n = (parseInt(t.adults, 10) || 0) + (parseInt(t.children, 10) || 0);
  return n > 0 ? n : 1;
}

export default async function handler(req, res) {
  if (!supa) return res.status(500).json({ error: 'Server not configured' });

  if (req.method === 'GET') {
    const token = (req.query.token || '').toString();
    if (!token) return res.status(400).json({ error: 'token required' });
    const { data: g } = await supa
      .from('payment_groups')
      .select('total_amount, amount_paid, currency, status, itinerary_id')
      .eq('share_token', token)
      .single();
    if (!g) return res.status(404).json({ error: 'Payment link not found' });
    const { data: itin } = await supa
      .from('itineraries').select('title, state').eq('id', g.itinerary_id).single();
    return res.status(200).json({
      title: itin?.title || 'Mosim concierge',
      people: groupSize(itin?.state),
      total: Number(g.total_amount),
      paid: Number(g.amount_paid),
      balance: Number(g.total_amount) - Number(g.amount_paid),
      currency: g.currency,
      status: g.status
    });
  }

  if (req.method === 'POST') {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Missing bearer token' });
    const { data: { user }, error: userErr } = await supa.auth.getUser(token);
    if (userErr || !user) return res.status(401).json({ error: 'Invalid token' });

    const { itinerary_id } = req.body || {};
    if (!itinerary_id) return res.status(400).json({ error: 'itinerary_id required' });

    const { data: itin } = await supa
      .from('itineraries').select('id, user_id, state').eq('id', itinerary_id).single();
    if (!itin || itin.user_id !== user.id) {
      return res.status(403).json({ error: 'Not your itinerary' });
    }

    // Idempotent: return the existing group if there is one.
    const { data: existing } = await supa
      .from('payment_groups').select('share_token').eq('itinerary_id', itinerary_id).single();
    if (existing) return res.status(200).json({ token: existing.share_token });

    const shareToken = crypto.randomBytes(24).toString('hex');
    const total = FEE_PER_PERSON * groupSize(itin.state);
    const { data, error } = await supa
      .from('payment_groups')
      .insert({ itinerary_id, share_token: shareToken, total_amount: total })
      .select('share_token').single();
    if (error) {
      console.error('[payment-group] insert failed', error);
      return res.status(500).json({ error: 'Failed to create payment group' });
    }
    return res.status(200).json({ token: data.share_token });
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'Method not allowed' });
}
```

- [ ] **Step 2: Run vercel dev**

Run: `vercel dev` (or `npx vercel dev`) with `.env.local` containing `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`.
Expected: dev server on `http://localhost:3000`.

- [ ] **Step 3: Verify create (owner) returns a token**

Get a real bearer token (sign in on the running site, then in the browser console: `(await window.kwAuth.init()).auth.getSession().then(s=>console.log(s.data.session.access_token))`) and an itinerary id you own, then:

```bash
curl -s -X POST http://localhost:3000/api/payment-group \
  -H "content-type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{"itinerary_id":"<your-itin-id>"}'
```
Expected: `{"token":"<64-hex-chars>"}`. Run it twice — the **same** token both times (idempotent).

- [ ] **Step 4: Verify get-by-token summary**

```bash
curl -s "http://localhost:3000/api/payment-group?token=<token-from-step-3>"
```
Expected: JSON with `total`, `paid:0`, `balance` equal to `1200 × group size`, `status:"open"`.

- [ ] **Step 5: Verify a non-owner is rejected**

Repeat Step 3 with a bearer token for a different user.
Expected: HTTP 403 `{"error":"Not your itinerary"}`.

- [ ] **Step 6: Commit**

```bash
git add api/payment-group.js
git commit -m "feat(api): payment-group create-or-get and public summary"
```

---

## Task 4: Expose PayPal client config

**Files:**
- Modify: `api/config.js`

- [ ] **Step 1: Add PayPal fields to the config response**

In `api/config.js`, replace the response block (lines ~16-20) so it also returns the PayPal client id and environment (both are public — the secret is never sent):

```js
  const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID || '';
  const PAYPAL_ENV = process.env.PAYPAL_ENV || 'sandbox';
  res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=300');
  return res.status(200).json({
    supabaseUrl: SUPABASE_URL,
    supabaseAnonKey: SUPABASE_ANON_KEY,
    paypalClientId: PAYPAL_CLIENT_ID,
    paypalEnv: PAYPAL_ENV
  });
```

- [ ] **Step 2: Verify**

With `PAYPAL_CLIENT_ID` set in `.env.local`, run `vercel dev` and:

```bash
curl -s http://localhost:3000/api/config
```
Expected: JSON includes `paypalClientId` (your sandbox client id) and `paypalEnv:"sandbox"`.

- [ ] **Step 3: Commit**

```bash
git add api/config.js
git commit -m "feat(api): expose paypalClientId + paypalEnv via /api/config"
```

---

## Task 5: PayPal order endpoint (create + capture & record)

**Files:**
- Create: `api/_lib/paypal.js`
- Create: `api/paypal-order.js`

- [ ] **Step 1: Write the PayPal REST helper**

Create `api/_lib/paypal.js`:

```js
// Minimal PayPal REST client (no SDK). Server-side only — uses the secret.
const BASE = (process.env.PAYPAL_ENV || 'sandbox') === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

async function accessToken() {
  const id = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;
  const basic = Buffer.from(`${id}:${secret}`).toString('base64');
  const r = await fetch(`${BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: { Authorization: `Basic ${basic}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials'
  });
  if (!r.ok) throw new Error(`paypal token ${r.status}`);
  return (await r.json()).access_token;
}

export async function createOrder(amount, currency = 'USD') {
  const tok = await accessToken();
  const r = await fetch(`${BASE}/v2/checkout/orders`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [{ amount: { currency_code: currency, value: amount.toFixed(2) } }]
    })
  });
  if (!r.ok) throw new Error(`paypal create ${r.status}`);
  return (await r.json()).id;
}

export async function captureOrder(orderId) {
  const tok = await accessToken();
  const r = await fetch(`${BASE}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' }
  });
  const data = await r.json();
  if (!r.ok || data.status !== 'COMPLETED') {
    throw new Error(`paypal capture ${r.status} ${data.status || ''}`);
  }
  const pu = data.purchase_units?.[0];
  const cap = pu?.payments?.captures?.[0];
  const payer = data.payer || {};
  return {
    captureId: cap?.id || null,
    amount: Number(cap?.amount?.value || 0),
    payerName: [payer.name?.given_name, payer.name?.surname].filter(Boolean).join(' ') || null,
    payerEmail: payer.email_address || null
  };
}
```

- [ ] **Step 2: Write the order endpoint**

Create `api/paypal-order.js`:

```js
// POST /api/paypal-order
//   { action:'create',  token, amount }                  → { orderID }
//   { action:'capture', token, orderID }                 → { ok, paid, total, balance, status }
import { createClient } from '@supabase/supabase-js';
import { normalizeAmount } from './_lib/amount.js';
import { createOrder, captureOrder } from './_lib/paypal.js';

const supa = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

async function loadGroup(token) {
  const { data } = await supa
    .from('payment_groups')
    .select('total_amount, amount_paid, currency, status')
    .eq('share_token', token).single();
  return data;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { action, token, amount, orderID } = req.body || {};
  if (!token) return res.status(400).json({ error: 'token required' });

  const g = await loadGroup(token);
  if (!g) return res.status(404).json({ error: 'Payment link not found' });
  const balance = Number(g.total_amount) - Number(g.amount_paid);

  try {
    if (action === 'create') {
      if (balance <= 0) return res.status(409).json({ error: 'Already fully paid' });
      const v = normalizeAmount(amount, balance);
      if (!v.ok) return res.status(400).json({ error: v.error });
      const orderId = await createOrder(v.amount, g.currency);
      return res.status(200).json({ orderID: orderId });
    }

    if (action === 'capture') {
      if (!orderID) return res.status(400).json({ error: 'orderID required' });
      const cap = await captureOrder(orderID);              // money moves here
      // Record atomically; use the amount PayPal actually captured.
      const { data, error } = await supa.rpc('record_payment', {
        p_token: token,
        p_amount: cap.amount,
        p_payer_name: cap.payerName,
        p_payer_email: cap.payerEmail,
        p_order_id: orderID,
        p_capture_id: cap.captureId
      });
      if (error) {
        // Money captured but not recorded — log loudly for manual reconciliation.
        console.error('[paypal-order] record_payment failed AFTER capture', orderID, cap.captureId, error);
        return res.status(500).json({ error: 'Payment captured but not recorded — contact support' });
      }
      return res.status(200).json({ ok: true, ...data });
    }

    return res.status(400).json({ error: 'Unknown action' });
  } catch (e) {
    console.error('[paypal-order]', action, e);
    return res.status(502).json({ error: 'PayPal error' });
  }
}
```

- [ ] **Step 3: Verify create-order against the PayPal sandbox**

With `PAYPAL_CLIENT_ID`/`PAYPAL_CLIENT_SECRET`/`PAYPAL_ENV=sandbox` in `.env.local`, using a token from a group created in Task 3:

```bash
curl -s -X POST http://localhost:3000/api/paypal-order \
  -H "content-type: application/json" \
  -d '{"action":"create","token":"<token>","amount":2400}'
```
Expected: `{"orderID":"<paypal-order-id>"}`.

- [ ] **Step 4: Verify the over-balance guard**

```bash
curl -s -X POST http://localhost:3000/api/paypal-order \
  -H "content-type: application/json" \
  -d '{"action":"create","token":"<token>","amount":999999}'
```
Expected: HTTP 400 `{"error":"Amount exceeds remaining balance"}` (no PayPal order created).

> Full capture is verified end-to-end with the PayPal Buttons in Task 6 (capture needs a buyer approval that the buttons provide). Do not hand-capture here.

- [ ] **Step 5: Commit**

```bash
git add api/_lib/paypal.js api/paypal-order.js
git commit -m "feat(api): PayPal create-order + capture-and-record endpoint"
```

---

## Task 6: The /pay page

**Files:**
- Create: `pay.html`
- Create: `js/pay.js`

- [ ] **Step 1: Write pay.html**

Create `pay.html` (mirror the existing pages' head/brand; magenta `#B21464`, body ≥19px per design.md):

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Pay concierge fee — Mosim</title>
  <style>
    body { font-family: system-ui, sans-serif; font-size: 19px; color: #1a1a1a; margin: 0; background: #faf7f8; }
    .wrap { max-width: 560px; margin: 40px auto; background: #fff; border: 1px solid #e2e2e2; border-radius: 14px; padding: 28px; }
    h1 { font-size: 24px; margin: 0 0 4px; }
    .muted { color: #6b6b6b; }
    .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f0f0f0; }
    .balance { font-size: 28px; font-weight: 700; color: #B21464; }
    label { display: block; margin: 18px 0 6px; font-weight: 600; }
    input[type=number] { width: 100%; font-size: 20px; padding: 12px; border: 1px solid #ccc; border-radius: 10px; box-sizing: border-box; }
    #msg { min-height: 1.3em; margin: 12px 0; }
    .share { margin-top: 20px; padding-top: 16px; border-top: 1px solid #f0f0f0; }
    button.copy { font-size: 17px; padding: 10px 16px; border: 1px solid #B21464; color: #B21464; background: #fff; border-radius: 10px; cursor: pointer; }
    .paid { color: #0a6; font-size: 22px; font-weight: 700; }
  </style>
</head>
<body>
  <div class="wrap">
    <h1>Mosim concierge fee</h1>
    <div class="muted" id="trip">Loading…</div>
    <div id="summary" style="display:none">
      <div class="row"><span>Total</span><span id="total"></span></div>
      <div class="row"><span>Paid so far</span><span id="paid"></span></div>
      <div class="row"><span>Remaining balance</span><span class="balance" id="balance"></span></div>

      <div id="payArea">
        <label for="amount">Amount to pay (USD)</label>
        <input type="number" id="amount" min="1" step="0.01" />
        <div id="msg"></div>
        <div id="paypal-buttons"></div>
      </div>
      <div id="paidArea" style="display:none" class="paid">Fully paid ✓ — thank you!</div>

      <div class="share">
        <div class="muted">Sharing the cost? Send this link to the others paying:</div>
        <button class="copy" id="copyBtn" type="button">Copy payment link</button>
      </div>
    </div>
    <div id="error" style="display:none; color:#a00"></div>
  </div>
  <script src="/js/pay.js"></script>
</body>
</html>
```

- [ ] **Step 2: Write js/pay.js**

Create `js/pay.js`:

```js
// Universal payment + share page. No login required.
(function () {
  const token = new URLSearchParams(location.search).get('g');
  const $ = (id) => document.getElementById(id);
  const fmt = (n) => '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  function showError(text) {
    $('error').textContent = text;
    $('error').style.display = 'block';
    $('summary').style.display = 'none';
    $('trip').style.display = 'none';
  }

  async function loadSummary() {
    const r = await fetch('/api/payment-group?token=' + encodeURIComponent(token));
    if (!r.ok) throw new Error('not found');
    return r.json();
  }

  function render(s) {
    $('trip').textContent = s.title + ' · ' + s.people + (s.people === 1 ? ' person' : ' people');
    $('total').textContent = fmt(s.total);
    $('paid').textContent = fmt(s.paid);
    $('balance').textContent = fmt(s.balance);
    $('summary').style.display = 'block';
    const amt = $('amount');
    amt.value = s.balance.toFixed(2);
    amt.max = s.balance.toFixed(2);
    if (s.balance <= 0 || s.status === 'paid') {
      $('payArea').style.display = 'none';
      $('paidArea').style.display = 'block';
    }
  }

  function loadPayPalSdk(clientId) {
    return new Promise((resolve, reject) => {
      const sc = document.createElement('script');
      sc.src = 'https://www.paypal.com/sdk/js?client-id=' + encodeURIComponent(clientId) + '&currency=USD';
      sc.onload = resolve; sc.onerror = reject;
      document.head.appendChild(sc);
    });
  }

  function mountButtons() {
    window.paypal.Buttons({
      createOrder: async () => {
        $('msg').textContent = '';
        const r = await fetch('/api/paypal-order', {
          method: 'POST', headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ action: 'create', token, amount: $('amount').value })
        });
        const b = await r.json();
        if (!r.ok) { $('msg').style.color = '#a00'; $('msg').textContent = b.error || 'Could not start payment'; throw new Error(b.error); }
        return b.orderID;
      },
      onApprove: async (data) => {
        const r = await fetch('/api/paypal-order', {
          method: 'POST', headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ action: 'capture', token, orderID: data.orderID })
        });
        const b = await r.json();
        if (!r.ok) { $('msg').style.color = '#a00'; $('msg').textContent = b.error || 'Payment failed'; return; }
        render({ title: $('trip').textContent.split(' · ')[0], people: 1, total: b.total, paid: b.paid, balance: b.balance, status: b.status });
        $('msg').style.color = '#0a6';
        $('msg').textContent = b.status === 'paid' ? 'Fully paid ✓ Thank you!' : 'Payment received ✓';
      },
      onError: () => { $('msg').style.color = '#a00'; $('msg').textContent = 'PayPal error — please try again.'; }
    }).render('#paypal-buttons');
  }

  $('copyBtn') && $('copyBtn').addEventListener('click', () => {
    navigator.clipboard.writeText(location.href).then(() => {
      $('copyBtn').textContent = 'Link copied ✓';
      setTimeout(() => { $('copyBtn').textContent = 'Copy payment link'; }, 2000);
    });
  });

  (async function init() {
    if (!token) return showError('Invalid payment link.');
    try {
      const [summary, cfg] = await Promise.all([loadSummary(), fetch('/api/config').then(r => r.json())]);
      render(summary);
      if (summary.balance > 0 && summary.status !== 'paid') {
        await loadPayPalSdk(cfg.paypalClientId);
        mountButtons();
      }
    } catch (e) {
      showError('This payment link is invalid or has expired.');
    }
  })();
})();
```

- [ ] **Step 3: End-to-end sandbox payment**

Run `vercel dev`. Open `http://localhost:3000/pay?g=<token>` (token from Task 3). Enter `2400`, click the PayPal button, log in with your **sandbox buyer** account, approve.
Expected: message "Payment received ✓"; balance updates to `$2,400.00`. Reload the page → balance still `$2,400.00` (persisted). Pay the remaining `2400` → "Fully paid ✓"; the pay area hides.

- [ ] **Step 4: Verify the DB recorded it**

In Supabase SQL Editor:

```sql
select amount_paid, status, paid_at from public.payment_groups where share_token = '<token>';
select amount, payer_email, paypal_capture_id from public.payments order by created_at desc limit 2;
```
Expected: `amount_paid = 4800`, `status='paid'`, `paid_at` set; two payment rows.

- [ ] **Step 5: Playwright screenshot of the paid state**

Drive Playwright to `/pay?g=<token>` (a fully-paid group) and screenshot.
Expected: "Fully paid ✓" visible, no amount input, balance `$0.00`. (Per `memory/feedback_visual_verify.md`, always visually verify UI.)

- [ ] **Step 6: Commit**

```bash
git add pay.html js/pay.js
git commit -m "feat: /pay split-payment page with PayPal buttons + share link"
```

---

## Task 7: Wire result.html to create a group and go to /pay

**Files:**
- Modify: `result.html` (replace `onBookNow()` at lines ~643-667; extend the `setupSave()` IIFE ~719-795)

- [ ] **Step 1: Replace the onBookNow placeholder**

In `result.html`, replace the comment block + `onBookNow()` (lines ~643-667) with a function that needs a saved itinerary id, creates the group, and redirects:

```js
/* ─── Concierge fee payment ─────────────────────────────────────
 * Requires a saved itinerary (see setupSave). Creates a payment
 * group for it and sends the user to the shareable /pay page.
 * ───────────────────────────────────────────────────────────── */
async function goToPayment(itineraryId) {
  const supa = await window.kwAuth.init();
  const { data: { session } } = await supa.auth.getSession();
  if (!session) { window.location.href = '/signup.html?next=result&save=1'; return; }
  const r = await fetch('/api/payment-group', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'Authorization': 'Bearer ' + session.access_token },
    body: JSON.stringify({ itinerary_id: itineraryId })
  });
  const b = await r.json();
  if (!r.ok) { alert(b.error || 'Could not start payment'); return; }
  window.location.href = '/pay?g=' + encodeURIComponent(b.token);
}
function onBookNow(){
  alert('Please save your itinerary first, then use “Pay concierge fee”.');
}
function onModifyPlan(){
  window.location.href = 'step1.html';
}
```

- [ ] **Step 2: Reveal a "Pay concierge fee" button after save**

In the `setupSave()` IIFE, after a successful `doSave()` (the success branch around line 773-775 where it sets `Saved ✓`), capture the returned id and reveal a pay button. Change the success branch to:

```js
    msg.style.color = '#0a6';
    msg.innerHTML = `Saved ✓ &nbsp; <a href="/me.html?tab=itineraries" style="color:#B21464;">View in My Page</a>`;
    btn.textContent = 'Pay concierge fee →';
    btn.disabled = false;
    btn.replaceWith(btn.cloneNode(true)); // drop old listeners
    const payBtn = document.getElementById('kw-save-btn');
    payBtn.addEventListener('click', () => goToPayment(body.id));
```

> `body.id` is the itinerary id returned by `/api/save-itinerary` (it returns `{ ok, id }`).

- [ ] **Step 3: In viewer mode, let the owner pay directly**

In the saved-itinerary viewer IIFE (`loadSavedItinerary`, ~680-717), after confirming the itinerary loads, append a pay button for the owner. At the end of that function add:

```js
  // Owner can pay the concierge fee from the viewer.
  const u = await window.kwAuth.getUser();
  if (u) {
    const bar = document.createElement('div');
    bar.style = 'max-width:760px;margin:16px auto;text-align:center';
    bar.innerHTML = '<button id="kw-pay-btn" style="padding:14px 22px;background:#B21464;color:#fff;border:0;border-radius:10px;font-size:19px;font-weight:600;cursor:pointer">Pay concierge fee →</button>';
    document.querySelector('#kw-itin-banner')?.after(bar);
    document.getElementById('kw-pay-btn').addEventListener('click', () => goToPayment(itinId));
  }
```

- [ ] **Step 4: Verify the funnel → save → pay flow**

Run `vercel dev`. Complete the funnel to `result.html` while logged in → click Save → button becomes "Pay concierge fee →" → click → lands on `/pay?g=...` with the correct total. Then open `/result.html?itin=<id>` as the owner → "Pay concierge fee →" appears → click → same pay page.
Expected: both paths reach `/pay` for the same itinerary with one shared token (idempotent group).

- [ ] **Step 5: Playwright screenshot**

Screenshot `result.html` after save showing the "Pay concierge fee →" button.
Expected: magenta button visible, no console errors.

- [ ] **Step 6: Commit**

```bash
git add result.html
git commit -m "feat(result): create payment group and route to /pay after save"
```

---

## Task 8: Show payment status on My Page

**Files:**
- Modify: `js/me-itineraries.jsx` (rebuild to `js/me-itineraries.js` via `npm run build`)

- [ ] **Step 1: Fetch payment groups alongside itineraries**

In `js/me-itineraries.jsx`, in the load effect (around lines 38-44 where it selects from `itineraries`), after loading the itineraries, fetch their payment groups (owner RLS allows this read) and index them by `itinerary_id`:

```jsx
      const { data: pgs } = await supa
        .from('payment_groups')
        .select('itinerary_id, total_amount, amount_paid, status');
      const payByItin = {};
      (pgs || []).forEach(p => { payByItin[p.itinerary_id] = p; });
      // store payByItin in state alongside rows (add a useState for it)
```

Add a `const [pay, setPay] = React.useState({});` near the existing state and `setPay(payByItin);` after the fetch.

- [ ] **Step 2: Render a payment badge per card**

Where each itinerary row renders (near the `StatusBadge`, ~line 81), add a payment indicator:

```jsx
            {pay[r.id] && (
              <span style={{ marginLeft: 8, fontSize: 15, color: pay[r.id].status === 'paid' ? '#0a6' : '#B21464' }}>
                {pay[r.id].status === 'paid'
                  ? 'Paid ✓'
                  : `$${Number(pay[r.id].amount_paid).toLocaleString()} of $${Number(pay[r.id].total_amount).toLocaleString()} paid`}
              </span>
            )}
```

- [ ] **Step 3: Rebuild the JSX**

Run: `npm run build`
Expected: `js/me-itineraries.js` regenerated, no esbuild errors.

- [ ] **Step 4: Verify on My Page**

Run `vercel dev`, sign in, open `/me.html?tab=itineraries`.
Expected: an itinerary with a partial payment shows `$2,400 of $4,800 paid`; a fully paid one shows `Paid ✓`; one with no group shows nothing extra.

- [ ] **Step 5: Playwright screenshot**

Screenshot `/me.html?tab=itineraries` showing the payment badges.
Expected: badges render with correct colors, no console errors.

- [ ] **Step 6: Commit**

```bash
git add js/me-itineraries.jsx js/me-itineraries.js
git commit -m "feat(me): show concierge-fee payment status on itinerary cards"
```

---

## Task 9: Docs — CLAUDE.md data flow + deploy checklist

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Update the data-flow section**

In `CLAUDE.md`, add a line under the data-flow / save-itinerary description noting the payment group:

```markdown
로그인 사용자는 저장된 일정에 대해 컨시어지 수수료를 결제할 수 있다. `/api/payment-group`이
일정당 `payment_groups` 행(총액 = $1,200 × 인원수, 조정 가능)을 만들고, `/pay?g=<token>`는
로그인 없이 누구나 잔액을 분할 결제할 수 있는 공유 페이지다. 결제는 PayPal(한국 법인 계정),
캡처는 `record_payment()`로 기록된다. 실비는 고객이 vendor에 직접 결제 — Mosim 미관여.
```

- [ ] **Step 2: Add PayPal env vars to the deploy checklist**

In the §3.2 environment-variables block and the §6 checklist, add:

```
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...        # 서버 함수 전용
PAYPAL_ENV=sandbox              # 운영 시 live
```

And a checklist line: `- [ ] PayPal 환경변수 3개 설정 + 운영 전 PAYPAL_ENV=live 전환`.

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: CLAUDE.md — split-payment data flow + PayPal env vars"
```

---

## Self-Review

**Spec coverage:**
- Balance-sharing split → Tasks 1 (schema), 5 (record_payment), 6 (pay page) ✓
- No-login link payer → Task 6 `/pay` (anon) + Task 1 RLS via service-role ✓
- PayPal only MVP → Tasks 4, 5, 6 ✓
- Hybrid pricing (`$1,200 × group_size`, DB-overridable) → Task 3 (`FEE_PER_PERSON × groupSize`); override = edit `total_amount` row in Supabase before payment (documented) ✓
- Immediate self-serve → Task 7 (group goes live on save, no admin gate) ✓
- Data model (payment_groups, payments) → Task 1 ✓
- RLS / service-role access → Task 1 + endpoints use service-role client ✓
- Overpayment prevention → Task 2 (normalizeAmount) + Task 5 create guard ✓
- Concurrency note → known limitation; `record_payment` uses `FOR UPDATE` which actually serializes captures (better than spec required) ✓
- Refunds out of scope → not implemented; manual via PayPal, documented in Task 9 ✓
- My Page status → Task 8 ✓
- PRD/CLAUDE.md gates → Tasks 0 and 9 ✓
- Success criteria 1-6 → covered by Task 3/6/7 verification steps ✓

**Placeholder scan:** No TBD/TODO; every code step has complete code; commands have expected output. ✓

**Type/name consistency:** `share_token`/`token`, `total_amount`/`amount_paid`, `normalizeAmount(input, balance) → {ok, amount, error}`, `record_payment(p_token,...)` RPC name, `goToPayment(itineraryId)`, `/api/payment-group`, `/api/paypal-order` actions `create`/`capture` — consistent across tasks. `/api/save-itinerary` returns `{ ok, id }` (verified in `api/save-itinerary.js`), used as `body.id` in Task 7. ✓
