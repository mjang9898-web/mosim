# Accounts & My Page — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Supabase Auth (Google + Email/Password), a 4-tab My Page (Itineraries / Status / Profile / Settings), and an itinerary save flow on the result page — without disrupting the existing anonymous funnel.

**Architecture:** Supabase JS client in the browser with Postgres RLS for data security. Three new serverless functions (`/api/config`, `/api/save-itinerary`, `/api/delete-account`) for operations that need the service role or controlled validation. Four new HTML pages (`signin`, `signup`, `reset-password`, `me`) plus four new `me-*.jsx` components compiled by the existing esbuild pipeline.

**Tech Stack:** Supabase Auth + Supabase JS (`@supabase/supabase-js` already in deps) · Postgres (Supabase) with RLS · Vanilla JS for nav/auth helpers · JSX (esbuild-compiled) for My Page sections · Vercel serverless for the three protected endpoints.

**Verification model:** This project has no test harness (no vitest, no playwright, no jest). CLAUDE.md doesn't require tests, and adding a test rig is out of scope. Each task ends with explicit **verification steps** — browser interaction, `curl` calls against `localhost:3000` (or production), and Supabase SQL Editor inspections — before commit. Visual verification with a real browser is required for any UI task.

**Prerequisites before Task 1:**
- Supabase project exists and `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` are set in Vercel Project Settings (already required by existing `/api/lead`).
- For local development: copy the same three values into `.env.local` (Vercel CLI reads this). Verify with `vercel env pull` if needed.
- Use the Vercel CLI for local development: `npm i -g vercel` then `vercel dev` (so `/api/*` functions work locally). Plain `python3 -m http.server` will not serve the api routes.

---

## Task 1: Supabase schema, RLS, and trigger

**Files:**
- Create: `supabase/schema.sql`

This task creates the SQL file and applies it via Supabase Studio. No browser-facing change yet.

- [ ] **Step 1: Create `supabase/schema.sql` with the full DDL**

Path: `/Users/robodash/Desktop/Mosim/mosim-site/supabase/schema.sql`

```sql
-- K-Wellness Concierge: accounts + My Page schema
-- Apply in Supabase Studio > SQL Editor

-- 1) profiles (1:1 with auth.users)
create table if not exists public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  name            text,
  phone           text,
  language        text default 'en',
  origin_country  text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- 2) itineraries (saved 7-day plans)
create table if not exists public.itineraries (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  created_at  timestamptz default now(),
  title       text,
  state       jsonb not null,
  schedule    jsonb not null,
  status      text default 'new'
);

create index if not exists itineraries_user_id_created_idx
  on public.itineraries(user_id, created_at desc);

-- 3) leads gets a user_id link
alter table public.leads
  add column if not exists user_id uuid references auth.users(id);

-- 4) RLS — profiles
alter table public.profiles enable row level security;
drop policy if exists "own profile r" on public.profiles;
drop policy if exists "own profile w" on public.profiles;
create policy "own profile r" on public.profiles
  for select using (auth.uid() = id);
create policy "own profile w" on public.profiles
  for update using (auth.uid() = id);

-- 5) RLS — itineraries
alter table public.itineraries enable row level security;
drop policy if exists "own itin r" on public.itineraries;
drop policy if exists "own itin i" on public.itineraries;
drop policy if exists "own itin u" on public.itineraries;
drop policy if exists "own itin d" on public.itineraries;
create policy "own itin r" on public.itineraries
  for select using (auth.uid() = user_id);
create policy "own itin i" on public.itineraries
  for insert with check (auth.uid() = user_id);
create policy "own itin u" on public.itineraries
  for update using (auth.uid() = user_id);
create policy "own itin d" on public.itineraries
  for delete using (auth.uid() = user_id);

-- 6) RLS — leads (anon insert preserved; authed users can read their own)
alter table public.leads enable row level security;
drop policy if exists "leads_insert_anon" on public.leads;
drop policy if exists "leads insert anon" on public.leads;
drop policy if exists "leads own read" on public.leads;
create policy "leads insert anon" on public.leads
  for insert to anon with check (true);
create policy "leads own read" on public.leads
  for select using (auth.uid() = user_id);

-- 7) Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name)
  values (new.id, new.raw_user_meta_data ->> 'name')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

- [ ] **Step 2: Apply the SQL in Supabase Studio**

1. Open Supabase Dashboard → your project → SQL Editor → New query
2. Paste the contents of `supabase/schema.sql`
3. Click **Run**
4. Confirm "Success. No rows returned"

- [ ] **Step 3: Verify schema in Studio**

Still in SQL Editor, run:

```sql
select table_name from information_schema.tables
  where table_schema='public' and table_name in ('profiles','itineraries','leads');
-- expect 3 rows

select column_name from information_schema.columns
  where table_schema='public' and table_name='leads' and column_name='user_id';
-- expect 1 row

select tgname from pg_trigger where tgname='on_auth_user_created';
-- expect 1 row
```

- [ ] **Step 4: Verify RLS is enabled**

```sql
select relname, relrowsecurity from pg_class
  where relname in ('profiles','itineraries','leads');
-- all three should show relrowsecurity = true
```

- [ ] **Step 5: Commit**

```bash
git add supabase/schema.sql
git commit -m "feat(db): schema for profiles, itineraries, and leads.user_id"
```

---

## Task 2: Configure Google OAuth in Supabase Dashboard

This is configuration only — no code changes — but it has to happen before signup can work. Document the steps in the repo so they're reproducible.

**Files:**
- Create: `supabase/SETUP.md`

- [ ] **Step 1: Create `supabase/SETUP.md` with reproducible instructions**

Path: `/Users/robodash/Desktop/Mosim/mosim-site/supabase/SETUP.md`

```markdown
# Supabase Setup — Auth Providers & Redirect URLs

One-time configuration after running `schema.sql`. Do this in the Supabase Dashboard.

## A) Google OAuth

1. Go to https://console.cloud.google.com/ and create (or pick) a project.
2. APIs & Services → OAuth consent screen → External → fill in app name, support email, developer contact. Save.
3. APIs & Services → Credentials → Create credentials → OAuth client ID.
   - Application type: Web application
   - Authorized JavaScript origins:
     - https://<your-production-domain>
     - http://localhost:3000
   - Authorized redirect URIs:
     - https://<your-supabase-project-ref>.supabase.co/auth/v1/callback
4. Copy the **Client ID** and **Client Secret**.
5. In Supabase Dashboard → Authentication → Providers → Google: enable, paste Client ID + Secret. Save.

## B) URL Configuration

Supabase Dashboard → Authentication → URL Configuration:

- **Site URL**: `https://<your-production-domain>`
- **Redirect URLs** (add each on its own line):
  - `https://<your-production-domain>/me.html`
  - `https://<your-production-domain>/signin.html`
  - `https://<your-production-domain>/signup.html`
  - `https://<your-production-domain>/reset-password.html`
  - `https://<your-production-domain>/result.html`
  - `http://localhost:3000/me.html`
  - `http://localhost:3000/signin.html`
  - `http://localhost:3000/signup.html`
  - `http://localhost:3000/reset-password.html`
  - `http://localhost:3000/result.html`

## C) Email Templates (optional polish)

Authentication → Email Templates → edit "Confirm signup" and "Reset password" to use a K-Wellness tone. Keep the `{{ .ConfirmationURL }}` token.

## D) Verify

In Supabase Dashboard → Authentication → Providers, Google should show "Enabled". URL Configuration should list at least the two domains above.
```

- [ ] **Step 2: Perform the dashboard configuration**

Follow the steps in `supabase/SETUP.md` against the actual Supabase project. Replace `<your-production-domain>` and `<your-supabase-project-ref>` with real values.

- [ ] **Step 3: Verify Google provider is enabled**

In Supabase Studio SQL Editor:

```sql
-- Sanity check — the auth.users table is reachable
select count(*) from auth.users;
```

This should not error. (Provider status itself can only be checked visually in the dashboard.)

- [ ] **Step 4: Commit**

```bash
git add supabase/SETUP.md
git commit -m "docs(supabase): setup guide for Google OAuth and redirect URLs"
```

---

## Task 3: `/api/config` endpoint

Expose `SUPABASE_URL` and `SUPABASE_ANON_KEY` to the browser without baking them into the build.

**Files:**
- Create: `api/config.js`

- [ ] **Step 1: Create `api/config.js`**

Path: `/Users/robodash/Desktop/Mosim/mosim-site/api/config.js`

```js
// Returns the public Supabase config needed by the browser.
// SUPABASE_ANON_KEY is safe to expose (RLS protects data).
// SUPABASE_SERVICE_ROLE_KEY is NEVER returned here.

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

export default function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return res.status(500).json({ error: 'Supabase env vars not set' });
  }
  res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=300');
  return res.status(200).json({
    supabaseUrl: SUPABASE_URL,
    supabaseAnonKey: SUPABASE_ANON_KEY
  });
}
```

- [ ] **Step 2: Run `vercel dev` and verify the endpoint**

```bash
# In one terminal
cd /Users/robodash/Desktop/Mosim/mosim-site
vercel dev
```

In another terminal:

```bash
curl -s http://localhost:3000/api/config | head -c 200
```

Expected: JSON containing `"supabaseUrl"` and `"supabaseAnonKey"`. The anon key should start with `eyJ` (JWT).

- [ ] **Step 3: Commit**

```bash
git add api/config.js
git commit -m "feat(api): config endpoint exposing public Supabase keys"
```

---

## Task 4: `js/auth.js` — Supabase client + helpers

**Files:**
- Create: `js/auth.js`

`js/auth.js` is plain JS (no JSX), loaded from a `<script type="module">` tag. It uses the Supabase JS UMD distribution served by jsdelivr to avoid having to bundle it — keeps the static-site model intact.

- [ ] **Step 1: Create `js/auth.js`**

Path: `/Users/robodash/Desktop/Mosim/mosim-site/js/auth.js`

```js
// K-Wellness Concierge — Supabase auth client + helpers.
// Loaded as <script type="module" src="/js/auth.js"></script>
//
// Public API exposed on window.kwAuth:
//   init()                          → Promise<SupabaseClient>
//   getUser()                       → Promise<User | null>
//   getProfile()                    → Promise<Profile | null>
//   signInWithGoogle(returnTo)      → never resolves (redirects)
//   signInWithEmail(email, pw)      → Promise<{ user, error }>
//   signUpWithEmail(email, pw, name, returnTo) → Promise<{ user, error }>
//   resetPassword(email, returnTo)  → Promise<{ error }>
//   updatePassword(newPassword)     → Promise<{ error }>
//   signOut()                       → Promise<void>
//   onChange(cb)                    → unsubscribe()
//
// All functions are safe to call before init() — they await it internally.

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.0/+esm';

let clientPromise = null;

function init() {
  if (clientPromise) return clientPromise;
  clientPromise = (async () => {
    const r = await fetch('/api/config');
    if (!r.ok) throw new Error('Failed to load /api/config');
    const { supabaseUrl, supabaseAnonKey } = await r.json();
    return createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce'
      }
    });
  })();
  return clientPromise;
}

async function getUser() {
  const supa = await init();
  const { data } = await supa.auth.getUser();
  return data?.user || null;
}

async function getProfile() {
  const supa = await init();
  const user = await getUser();
  if (!user) return null;
  const { data, error } = await supa.from('profiles').select('*').eq('id', user.id).single();
  if (error && error.code !== 'PGRST116') console.warn('[auth] getProfile', error);
  return data || null;
}

async function signInWithGoogle(returnTo) {
  const supa = await init();
  const redirectTo = absoluteUrl(returnTo || '/me.html');
  const { error } = await supa.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo }
  });
  if (error) return { error };
  // signInWithOAuth redirects the browser; nothing below this runs.
  return {};
}

async function signInWithEmail(email, password) {
  const supa = await init();
  const { data, error } = await supa.auth.signInWithPassword({ email, password });
  return { user: data?.user || null, error };
}

async function signUpWithEmail(email, password, name, returnTo) {
  const supa = await init();
  const emailRedirectTo = absoluteUrl(returnTo || '/me.html');
  const { data, error } = await supa.auth.signUp({
    email,
    password,
    options: { data: { name }, emailRedirectTo }
  });
  return { user: data?.user || null, error };
}

async function resetPassword(email, returnTo) {
  const supa = await init();
  const redirectTo = absoluteUrl(returnTo || '/reset-password.html');
  const { error } = await supa.auth.resetPasswordForEmail(email, { redirectTo });
  return { error };
}

async function updatePassword(newPassword) {
  const supa = await init();
  const { error } = await supa.auth.updateUser({ password: newPassword });
  return { error };
}

async function signOut() {
  const supa = await init();
  await supa.auth.signOut();
}

async function onChange(cb) {
  const supa = await init();
  const { data } = supa.auth.onAuthStateChange((event, session) => cb(event, session));
  return () => data.subscription.unsubscribe();
}

function absoluteUrl(pathOrUrl) {
  if (!pathOrUrl) return window.location.origin + '/me.html';
  if (/^https?:/.test(pathOrUrl)) return pathOrUrl;
  return window.location.origin + (pathOrUrl.startsWith('/') ? pathOrUrl : '/' + pathOrUrl);
}

window.kwAuth = {
  init, getUser, getProfile,
  signInWithGoogle, signInWithEmail, signUpWithEmail,
  resetPassword, updatePassword, signOut, onChange
};
```

- [ ] **Step 2: Verify it loads without error**

Create a temporary test snippet in the browser console after starting `vercel dev`:

```bash
vercel dev   # in repo root
```

Open `http://localhost:3000/` in a browser. In DevTools console:

```js
const s = document.createElement('script');
s.type = 'module';
s.src = '/js/auth.js';
document.head.appendChild(s);
// Wait 2 seconds, then:
setTimeout(async () => {
  const u = await window.kwAuth.getUser();
  console.log('user:', u);   // should print null (no session yet)
}, 2000);
```

Expected: `user: null`, no errors in console. (If the `+esm` import fails, check Network tab.)

- [ ] **Step 3: Commit**

```bash
git add js/auth.js
git commit -m "feat(auth): Supabase client wrapper and helper API"
```

---

## Task 5: `js/nav-auth.js` + add to all existing pages

Inject a "Sign in" / "My Page" link into every page's nav based on auth state.

**Files:**
- Create: `js/nav-auth.js`
- Modify: `index.html`, `step1.html`, `step2.html`, `step3.html`, `step4.html`, `result.html`

- [ ] **Step 1: Create `js/nav-auth.js`**

Path: `/Users/robodash/Desktop/Mosim/mosim-site/js/nav-auth.js`

```js
// K-Wellness Concierge — nav auth indicator.
// Drop a <div id="kw-nav-auth"></div> into any page's nav and load this.
// Renders "Sign in" when logged out, "My Page" + email when logged in.
// Listens to onAuthStateChange so it updates instantly on login/logout.
//
// Depends on /js/auth.js being loaded with type="module" before this script.

(function () {
  const SLOT_ID = 'kw-nav-auth';
  let started = false;

  function render(user) {
    const slot = document.getElementById(SLOT_ID);
    if (!slot) return;
    if (user) {
      const label = user.user_metadata?.name || user.email || 'My Page';
      slot.innerHTML = `<a href="/me.html" class="kw-nav-auth-link" aria-label="My Page">My Page</a>`;
    } else {
      slot.innerHTML = `<a href="/signin.html" class="kw-nav-auth-link" aria-label="Sign in">Sign in</a>`;
    }
  }

  async function start() {
    if (started) return;
    started = true;
    // Wait for kwAuth (auth.js is type=module so may load slightly after this script).
    let tries = 0;
    while (!window.kwAuth && tries < 50) {
      await new Promise(r => setTimeout(r, 50));
      tries++;
    }
    if (!window.kwAuth) {
      console.warn('[nav-auth] kwAuth not available');
      return;
    }
    const user = await window.kwAuth.getUser();
    render(user);
    window.kwAuth.onChange((_event, session) => render(session?.user || null));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
```

- [ ] **Step 2: Add nav slot + scripts to `index.html`**

Find the existing nav `.right` div around line 1366 in `index.html`:

```html
    <div class="right">
      <a href="step1.html" class="cta sm">Plan Korea</a>
    </div>
```

Replace with:

```html
    <div class="right">
      <div id="kw-nav-auth"></div>
      <a href="step1.html" class="cta sm">Plan Korea</a>
    </div>
```

Then in `index.html`, find the closing `</body>` and insert these two scripts just before it (above any other end-of-body scripts is fine):

```html
<script type="module" src="/js/auth.js"></script>
<script src="/js/nav-auth.js" defer></script>
```

- [ ] **Step 3: Add styling for the nav auth link**

Find the existing nav-related CSS in `index.html` (search for `nav.top`). Inside its CSS block, add:

```css
#kw-nav-auth { display: inline-flex; align-items: center; margin-right: 12px; }
#kw-nav-auth .kw-nav-auth-link {
  font: inherit;
  font-size: 15px;
  color: var(--ink-2);
  text-decoration: none;
  padding: 6px 10px;
  border-radius: 6px;
}
#kw-nav-auth .kw-nav-auth-link:hover { background: var(--bg-2); color: var(--ink-1); }
```

(If `--ink-2`, `--bg-2`, `--ink-1` aren't defined on this page, use literal colors matching the rest of the nav. Use the design.md palette as the source of truth.)

- [ ] **Step 4: Add nav slot + scripts to the funnel pages and result.html**

`result.html` has the same `<nav class="top">` / `<div class="right">` structure as `index.html` — apply steps 2-3 verbatim.

The four funnel pages (`step1.html`, `step2.html`, `step3.html`, `step4.html`) do NOT have a `<nav>` element. They use a `.kw-screen` JSX-rendered chrome. For these, place the auth slot as a fixed top-right anchor that sits over the page chrome. Add this just inside `<body>`:

```html
<div id="kw-nav-auth" style="position:fixed; top:16px; right:20px; z-index:1000;"></div>
<script type="module" src="/js/auth.js"></script>
<script src="/js/nav-auth.js" defer></script>
```

(The inline style overrides the `display:inline-flex` from the global CSS — that's fine; it's per-page positioning.)

Apply the same scripts on `result.html` too (in addition to the nav-slot from step 2).

- [ ] **Step 5: Visual verification across pages**

```bash
vercel dev
```

Open in browser sequentially:
- http://localhost:3000/
- http://localhost:3000/step1
- http://localhost:3000/step2
- http://localhost:3000/step3
- http://localhost:3000/step4
- http://localhost:3000/result

Each page should display "Sign in" in the top-right nav. Console must be clean of errors. Click "Sign in" — it should 404 for now (the page doesn't exist yet); that's expected.

- [ ] **Step 6: Commit**

```bash
git add js/nav-auth.js index.html step1.html step2.html step3.html step4.html result.html
git commit -m "feat(nav): Sign in / My Page indicator across all pages"
```

---

## Task 6: `/signup.html`

**Files:**
- Create: `signup.html`

- [ ] **Step 1: Create `signup.html`**

Path: `/Users/robodash/Desktop/Mosim/mosim-site/signup.html`

Use the existing landing page CSS conventions (the typography vars and font stack). Keep the page minimal — single centered card.

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Sign up — K-Wellness Concierge</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  :root {
    --ink-1:#1a1a1a; --ink-2:#444; --ink-3:#777; --bg-1:#fff; --bg-2:#f5f5f5;
    --magenta:#B21464; --border:#e2e2e2;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center;
    background: var(--bg-2); color: var(--ink-1);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    padding: 24px;
  }
  .card {
    background: var(--bg-1); border-radius: 14px; padding: 36px 32px;
    max-width: 420px; width: 100%; box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  }
  h1 { font-size: 26px; margin: 0 0 8px; }
  p.sub { font-size: 19px; color: var(--ink-2); margin: 0 0 28px; }
  .btn-google {
    display:flex; align-items:center; justify-content:center; gap:10px;
    width:100%; padding:14px 16px; font-size:19px; border:1px solid var(--border);
    border-radius:10px; background:#fff; cursor:pointer; margin-bottom:18px;
  }
  .btn-google:hover { background: var(--bg-2); }
  .divider { display:flex; align-items:center; gap:10px; margin: 18px 0; color: var(--ink-3); font-size: 15px;}
  .divider::before, .divider::after { content:''; flex:1; height:1px; background: var(--border); }
  label { display:block; font-size:15px; color: var(--ink-2); margin: 14px 0 6px; }
  input {
    width:100%; padding:12px 14px; font-size:19px; border:1px solid var(--border);
    border-radius:10px; font-family: inherit;
  }
  input:focus { outline: 2px solid var(--magenta); outline-offset: 0; border-color: var(--magenta); }
  .btn-primary {
    width:100%; padding:14px 16px; font-size:19px; margin-top:18px;
    background: var(--magenta); color: #fff; border:0; border-radius:10px;
    cursor:pointer; font-weight: 600;
  }
  .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
  .links { margin-top:18px; font-size:15px; color: var(--ink-2); text-align:center; }
  .links a { color: var(--magenta); text-decoration:none; }
  .err { color:#a00; font-size:15px; margin-top:12px; min-height: 1.2em; }
  .ok  { color:#0a6; font-size:15px; margin-top:12px; min-height: 1.2em; }
</style>
</head>
<body>
<div class="card">
  <h1>Create your account</h1>
  <p class="sub">Save your itinerary and track our concierge progress.</p>

  <button id="google-btn" class="btn-google" type="button">
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34 5.1 29.3 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21 21-9.4 21-21c0-1.2-.1-2.3-.4-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 16.1 18.9 13 24 13c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34 5.1 29.3 3 24 3 16.3 3 9.7 7.6 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 45c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.5-4.5 2.4-7.2 2.4-5.2 0-9.6-3.3-11.2-7.9l-6.5 5C9.4 40.6 16.2 45 24 45z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.2 5.6l6.2 5.2c-.4.4 6.8-4.9 6.8-14.8 0-1.2-.1-2.3-.4-3.5z"/>
    </svg>
    Continue with Google
  </button>

  <div class="divider">or</div>

  <form id="signup-form">
    <label for="name">Name</label>
    <input id="name" name="name" type="text" autocomplete="name" required>

    <label for="email">Email</label>
    <input id="email" name="email" type="email" autocomplete="email" required>

    <label for="password">Password (min 8 chars)</label>
    <input id="password" name="password" type="password" autocomplete="new-password" minlength="8" required>

    <button id="email-btn" class="btn-primary" type="submit">Create account</button>
    <div id="msg" class="err"></div>
  </form>

  <div class="links">
    Already have an account? <a href="/signin.html">Sign in</a>
  </div>
</div>

<script type="module" src="/js/auth.js"></script>
<script>
  // Pass-through query string so /signup.html?next=result&save=1 round-trips.
  function nextUrl() {
    const u = new URL(window.location.href);
    const next = u.searchParams.get('next');
    const save = u.searchParams.get('save');
    if (next === 'result') {
      return '/result.html' + (save ? '?save=1' : '');
    }
    return '/me.html';
  }

  async function ready() {
    let t = 0;
    while (!window.kwAuth && t < 100) { await new Promise(r => setTimeout(r, 50)); t++; }
  }

  document.getElementById('google-btn').addEventListener('click', async () => {
    await ready();
    const { error } = await window.kwAuth.signInWithGoogle(nextUrl());
    if (error) document.getElementById('msg').textContent = error.message;
  });

  document.getElementById('signup-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    await ready();
    const btn = document.getElementById('email-btn');
    const msg = document.getElementById('msg');
    btn.disabled = true;
    msg.textContent = '';
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const { error } = await window.kwAuth.signUpWithEmail(email, password, name, nextUrl());
    if (error) {
      msg.className = 'err';
      msg.textContent = error.message;
      btn.disabled = false;
      return;
    }
    msg.className = 'ok';
    msg.textContent = "Check your email to confirm your account, then you're in.";
  });
</script>
</body>
</html>
```

- [ ] **Step 2: Verify the page renders**

```bash
vercel dev
```

Visit http://localhost:3000/signup. The card should render with Google button + email form. No console errors.

- [ ] **Step 3: Verify Google flow starts**

Click "Continue with Google". The browser should redirect to `accounts.google.com`. (If this errors with "redirect_uri_mismatch", revisit Task 2 dashboard config.)

Back out of the Google page — don't complete the sign-in yet. We'll do a full test in Task 9 after My Page exists.

- [ ] **Step 4: Verify email signup creates a user (skip if you don't want to use a real email)**

If you have a throwaway email:
1. Fill the form, submit.
2. Open Supabase Studio → Authentication → Users — the new user should appear with `Last sign in: Waiting for verification`.
3. Open Supabase Studio → Table Editor → `profiles` — a row should exist for that user (trigger fired).

If you don't want to send a real email yet, you can verify the same in Task 9.

- [ ] **Step 5: Commit**

```bash
git add signup.html
git commit -m "feat(auth): signup page with Google + email/password"
```

---

## Task 7: `/signin.html`

**Files:**
- Create: `signin.html`

- [ ] **Step 1: Create `signin.html`**

Path: `/Users/robodash/Desktop/Mosim/mosim-site/signin.html`

Same visual structure as `signup.html`, different copy and a Forgot password link.

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Sign in — K-Wellness Concierge</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  :root {
    --ink-1:#1a1a1a; --ink-2:#444; --ink-3:#777; --bg-1:#fff; --bg-2:#f5f5f5;
    --magenta:#B21464; --border:#e2e2e2;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center;
    background: var(--bg-2); color: var(--ink-1);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    padding: 24px;
  }
  .card { background: var(--bg-1); border-radius: 14px; padding: 36px 32px; max-width: 420px; width: 100%; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
  h1 { font-size: 26px; margin: 0 0 8px; }
  p.sub { font-size: 19px; color: var(--ink-2); margin: 0 0 28px; }
  .btn-google { display:flex; align-items:center; justify-content:center; gap:10px; width:100%; padding:14px 16px; font-size:19px; border:1px solid var(--border); border-radius:10px; background:#fff; cursor:pointer; margin-bottom:18px; }
  .btn-google:hover { background: var(--bg-2); }
  .divider { display:flex; align-items:center; gap:10px; margin: 18px 0; color: var(--ink-3); font-size: 15px;}
  .divider::before, .divider::after { content:''; flex:1; height:1px; background: var(--border); }
  label { display:block; font-size:15px; color: var(--ink-2); margin: 14px 0 6px; }
  input { width:100%; padding:12px 14px; font-size:19px; border:1px solid var(--border); border-radius:10px; font-family: inherit; }
  input:focus { outline: 2px solid var(--magenta); outline-offset: 0; border-color: var(--magenta); }
  .btn-primary { width:100%; padding:14px 16px; font-size:19px; margin-top:18px; background: var(--magenta); color:#fff; border:0; border-radius:10px; cursor:pointer; font-weight:600; }
  .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
  .links { margin-top:18px; font-size:15px; color: var(--ink-2); text-align:center; }
  .links a { color: var(--magenta); text-decoration:none; }
  .forgot { display:block; text-align:right; font-size:15px; color: var(--magenta); text-decoration:none; margin-top: 6px; }
  .err { color:#a00; font-size:15px; margin-top:12px; min-height: 1.2em; }
</style>
</head>
<body>
<div class="card">
  <h1>Welcome back</h1>
  <p class="sub">Sign in to see your saved trips.</p>

  <button id="google-btn" class="btn-google" type="button">
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34 5.1 29.3 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21 21-9.4 21-21c0-1.2-.1-2.3-.4-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 16.1 18.9 13 24 13c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34 5.1 29.3 3 24 3 16.3 3 9.7 7.6 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 45c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.5-4.5 2.4-7.2 2.4-5.2 0-9.6-3.3-11.2-7.9l-6.5 5C9.4 40.6 16.2 45 24 45z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.2 5.6l6.2 5.2c-.4.4 6.8-4.9 6.8-14.8 0-1.2-.1-2.3-.4-3.5z"/>
    </svg>
    Continue with Google
  </button>

  <div class="divider">or</div>

  <form id="signin-form">
    <label for="email">Email</label>
    <input id="email" name="email" type="email" autocomplete="email" required>

    <label for="password">Password</label>
    <input id="password" name="password" type="password" autocomplete="current-password" required>
    <a href="#" id="forgot-link" class="forgot">Forgot password?</a>

    <button id="email-btn" class="btn-primary" type="submit">Sign in</button>
    <div id="msg" class="err"></div>
  </form>

  <div class="links">
    No account yet? <a href="/signup.html">Create one</a>
  </div>
</div>

<script type="module" src="/js/auth.js"></script>
<script>
  function nextUrl() {
    const u = new URL(window.location.href);
    const next = u.searchParams.get('next');
    const save = u.searchParams.get('save');
    if (next === 'result') return '/result.html' + (save ? '?save=1' : '');
    return '/me.html';
  }

  async function ready() {
    let t = 0;
    while (!window.kwAuth && t < 100) { await new Promise(r => setTimeout(r, 50)); t++; }
  }

  document.getElementById('google-btn').addEventListener('click', async () => {
    await ready();
    const { error } = await window.kwAuth.signInWithGoogle(nextUrl());
    if (error) document.getElementById('msg').textContent = error.message;
  });

  document.getElementById('signin-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    await ready();
    const btn = document.getElementById('email-btn');
    const msg = document.getElementById('msg');
    btn.disabled = true;
    msg.textContent = '';
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const { user, error } = await window.kwAuth.signInWithEmail(email, password);
    if (error) {
      msg.textContent = error.message;
      btn.disabled = false;
      return;
    }
    window.location.href = nextUrl();
  });

  document.getElementById('forgot-link').addEventListener('click', async (e) => {
    e.preventDefault();
    await ready();
    const email = document.getElementById('email').value.trim();
    if (!email) {
      document.getElementById('msg').textContent = 'Enter your email above first, then click Forgot password.';
      return;
    }
    const { error } = await window.kwAuth.resetPassword(email);
    document.getElementById('msg').textContent = error
      ? error.message
      : 'Reset link sent — check your email.';
  });
</script>
</body>
</html>
```

- [ ] **Step 2: Verify the page renders**

`vercel dev`, visit http://localhost:3000/signin. Card renders, no console errors.

- [ ] **Step 3: Verify nav reflects sign-in**

Open the home page in another tab. It should show "Sign in" in the nav. Don't complete sign-in yet — Task 9 will do the full round trip.

- [ ] **Step 4: Commit**

```bash
git add signin.html
git commit -m "feat(auth): signin page with Google + email/password + forgot link"
```

---

## Task 8: `/reset-password.html`

**Files:**
- Create: `reset-password.html`

- [ ] **Step 1: Create `reset-password.html`**

Path: `/Users/robodash/Desktop/Mosim/mosim-site/reset-password.html`

This page is reached via the link in the reset email. Supabase puts a recovery token in the URL hash; the SDK picks it up automatically when `detectSessionInUrl: true` (we set this in auth.js).

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Reset password — K-Wellness Concierge</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  :root {
    --ink-1:#1a1a1a; --ink-2:#444; --ink-3:#777; --bg-1:#fff; --bg-2:#f5f5f5;
    --magenta:#B21464; --border:#e2e2e2;
  }
  * { box-sizing: border-box; }
  body { margin:0; min-height:100vh; display:flex; align-items:center; justify-content:center; background: var(--bg-2); color: var(--ink-1); font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding:24px; }
  .card { background: var(--bg-1); border-radius:14px; padding:36px 32px; max-width:420px; width:100%; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
  h1 { font-size:26px; margin:0 0 8px; }
  p.sub { font-size:19px; color: var(--ink-2); margin: 0 0 24px; }
  label { display:block; font-size:15px; color: var(--ink-2); margin: 14px 0 6px; }
  input { width:100%; padding:12px 14px; font-size:19px; border:1px solid var(--border); border-radius:10px; font-family:inherit; }
  input:focus { outline:2px solid var(--magenta); outline-offset:0; border-color: var(--magenta); }
  .btn-primary { width:100%; padding:14px 16px; font-size:19px; margin-top:18px; background: var(--magenta); color:#fff; border:0; border-radius:10px; cursor:pointer; font-weight:600; }
  .btn-primary:disabled { opacity:.5; cursor:not-allowed; }
  .err { color:#a00; font-size:15px; margin-top:12px; min-height:1.2em; }
  .ok  { color:#0a6; font-size:15px; margin-top:12px; min-height:1.2em; }
</style>
</head>
<body>
<div class="card">
  <h1>Set a new password</h1>
  <p class="sub">Choose at least 8 characters.</p>
  <form id="reset-form">
    <label for="password">New password</label>
    <input id="password" name="password" type="password" autocomplete="new-password" minlength="8" required>
    <button id="btn" class="btn-primary" type="submit">Update password</button>
    <div id="msg" class="err"></div>
  </form>
</div>

<script type="module" src="/js/auth.js"></script>
<script>
  async function ready() {
    let t = 0;
    while (!window.kwAuth && t < 100) { await new Promise(r => setTimeout(r, 50)); t++; }
  }

  document.getElementById('reset-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    await ready();
    const btn = document.getElementById('btn');
    const msg = document.getElementById('msg');
    btn.disabled = true; msg.textContent = '';
    const password = document.getElementById('password').value;
    const { error } = await window.kwAuth.updatePassword(password);
    if (error) {
      msg.className = 'err';
      msg.textContent = error.message;
      btn.disabled = false;
      return;
    }
    msg.className = 'ok';
    msg.textContent = 'Password updated. Redirecting...';
    setTimeout(() => { window.location.href = '/me.html'; }, 1200);
  });
</script>
</body>
</html>
```

- [ ] **Step 2: Verify it renders**

`vercel dev`, visit http://localhost:3000/reset-password. Form renders. (Submitting without a recovery token will error with "Auth session missing" — that's expected.)

- [ ] **Step 3: Commit**

```bash
git add reset-password.html
git commit -m "feat(auth): password reset landing page"
```

---

## Task 9: `/me.html` skeleton + tab routing + end-to-end auth test

**Files:**
- Create: `me.html`

This task adds the My Page shell (no section content yet) and uses it for the first real end-to-end signup test.

- [ ] **Step 1: Create `me.html`**

Path: `/Users/robodash/Desktop/Mosim/mosim-site/me.html`

The structure: a header with greeting + sign-out, a tab bar (URL `?tab=itineraries|status|profile|settings`), and four placeholder `<section>` containers that each `me-*.jsx` will populate. The JSX scripts will be added in later tasks; for now the sections show "Coming up next" placeholders so the routing is testable.

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>My Page — K-Wellness Concierge</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  :root {
    --ink-1:#1a1a1a; --ink-2:#444; --ink-3:#777; --bg-1:#fff; --bg-2:#f5f5f5; --bg-3:#fafafa;
    --magenta:#B21464; --border:#e2e2e2;
  }
  * { box-sizing: border-box; }
  body {
    margin:0; min-height:100vh; background: var(--bg-3); color: var(--ink-1);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  }
  header.me-head {
    background:#fff; border-bottom: 1px solid var(--border);
    padding: 20px 28px; display:flex; align-items:center; justify-content: space-between;
  }
  header.me-head a.brand { font-weight:700; font-size:19px; color: var(--ink-1); text-decoration:none; }
  header.me-head .right { display:flex; align-items:center; gap:16px; }
  header.me-head .greeting { font-size:19px; color: var(--ink-2); }
  header.me-head button.signout {
    font: inherit; font-size:15px; padding:8px 14px;
    background:#fff; border:1px solid var(--border); border-radius:8px; cursor:pointer;
  }
  header.me-head button.signout:hover { background: var(--bg-2); }
  nav.tabs { background:#fff; border-bottom:1px solid var(--border); padding: 0 28px; display:flex; gap: 28px; }
  nav.tabs a {
    display:inline-block; padding: 14px 0; font-size:19px; color: var(--ink-2);
    text-decoration:none; border-bottom: 2px solid transparent;
  }
  nav.tabs a[aria-current="page"] { color: var(--ink-1); border-bottom-color: var(--magenta); }
  main { padding: 28px; max-width: 960px; margin: 0 auto; }
  main section { display:none; }
  main section.active { display:block; }
  .placeholder {
    padding: 40px; background:#fff; border:1px solid var(--border); border-radius:12px;
    color: var(--ink-3); text-align:center; font-size:19px;
  }
</style>
</head>
<body>
<header class="me-head">
  <a class="brand" href="/">K-Wellness</a>
  <div class="right">
    <span id="greeting" class="greeting"></span>
    <button id="signout" class="signout" type="button">Sign out</button>
  </div>
</header>

<nav class="tabs" id="tabs">
  <a href="?tab=itineraries" data-tab="itineraries">Itineraries</a>
  <a href="?tab=status"      data-tab="status">Status</a>
  <a href="?tab=profile"     data-tab="profile">Profile</a>
  <a href="?tab=settings"    data-tab="settings">Settings</a>
</nav>

<main>
  <section id="sec-itineraries"><div id="me-itineraries-root" class="placeholder">My itineraries — coming next.</div></section>
  <section id="sec-status"><div id="me-status-root" class="placeholder">Status timeline — coming next.</div></section>
  <section id="sec-profile"><div id="me-profile-root" class="placeholder">Profile editor — coming next.</div></section>
  <section id="sec-settings"><div id="me-settings-root" class="placeholder">Settings — coming next.</div></section>
</main>

<script type="module" src="/js/auth.js"></script>
<script>
  // Guard: redirect anonymous users to signin.
  (async function () {
    let t = 0;
    while (!window.kwAuth && t < 100) { await new Promise(r => setTimeout(r, 50)); t++; }
    const user = await window.kwAuth.getUser();
    if (!user) {
      window.location.replace('/signin.html?next=me');
      return;
    }
    document.getElementById('greeting').textContent = user.user_metadata?.name || user.email;
    document.getElementById('signout').addEventListener('click', async () => {
      await window.kwAuth.signOut();
      window.location.href = '/';
    });

    // Tab routing
    const params = new URLSearchParams(window.location.search);
    const tab = ['itineraries','status','profile','settings'].includes(params.get('tab'))
      ? params.get('tab') : 'itineraries';
    document.querySelectorAll('#tabs a').forEach(a => {
      if (a.dataset.tab === tab) a.setAttribute('aria-current', 'page');
    });
    document.getElementById('sec-' + tab).classList.add('active');
  })();
</script>
</body>
</html>
```

- [ ] **Step 2: Add a `next=me` branch to `signin.html` and `signup.html` nextUrl()**

In both `signin.html` and `signup.html`, update the `nextUrl()` function to handle `next=me`:

```js
function nextUrl() {
  const u = new URL(window.location.href);
  const next = u.searchParams.get('next');
  const save = u.searchParams.get('save');
  if (next === 'result') return '/result.html' + (save ? '?save=1' : '');
  if (next === 'me')     return '/me.html';
  return '/me.html';
}
```

- [ ] **Step 3: End-to-end Google sign-in test**

```bash
vercel dev
```

1. Open http://localhost:3000/me — should redirect to `/signin.html?next=me`.
2. On signin, click "Continue with Google" — Google flow → callback → lands on `/me.html`.
3. Verify the greeting shows your Google name or email, and the four tabs render with placeholders.
4. Click each tab — URL updates to `?tab=...`, the matching placeholder shows.
5. In Supabase Studio → Table Editor → `profiles`, your new row should exist with `name` populated from Google.

- [ ] **Step 4: End-to-end email signup test**

1. Sign out (button in `/me`).
2. Go to `/signup.html`, fill name + a throwaway email + password, submit.
3. Confirm "Check your email" message appears.
4. Open the confirmation email → click the link → should land on `/me.html` signed in.
5. Verify `auth.users` row exists with `email_confirmed_at` set, and `profiles` row exists with the name.

- [ ] **Step 5: Sign out test**

Click "Sign out" on `/me`. Should redirect to `/`. Open `/me` again → should redirect to `/signin.html?next=me`.

- [ ] **Step 6: Commit**

```bash
git add me.html signin.html signup.html
git commit -m "feat(me): My Page shell with tab routing and auth guard"
```

---

## Task 10: `me-itineraries.jsx` + result.html `?itin=<id>` viewer

**Files:**
- Create: `js/me-itineraries.jsx`
- Modify: `me.html`, `result.html`, `package.json`, `scripts/post-build.mjs`

- [ ] **Step 1: Add new JSX entry to esbuild config**

Update the build script in `package.json` to include `me-itineraries.jsx` (and the other three me-*.jsx files we'll add in later tasks, so we only edit `package.json` once):

```json
{
  "scripts": {
    "build": "esbuild js/step1-trip-shared.jsx js/step1-trip-v1.jsx js/step2-medical.jsx js/step3-culture.jsx js/step4-cuisine.jsx js/me-itineraries.jsx js/me-status.jsx js/me-profile.jsx js/me-settings.jsx --outdir=js --loader:.jsx=jsx --jsx=transform --minify --target=es2020 && node scripts/post-build.mjs",
    "dev":   "esbuild js/step1-trip-shared.jsx js/step1-trip-v1.jsx js/step2-medical.jsx js/step3-culture.jsx js/step4-cuisine.jsx js/me-itineraries.jsx js/me-status.jsx js/me-profile.jsx js/me-settings.jsx --outdir=js --loader:.jsx=jsx --jsx=transform --sourcemap --watch=forever"
  }
}
```

- [ ] **Step 2: Add the four `me-*.js` basenames to `scripts/post-build.mjs`**

In `scripts/post-build.mjs`, update `HASHED_BASENAMES`:

```js
const HASHED_BASENAMES = [
  'step1-trip-shared.js',
  'step1-trip-v1.js',
  'step2-medical.js',
  'step3-culture.js',
  'step4-cuisine.js',
  'me-itineraries.js',
  'me-status.js',
  'me-profile.js',
  'me-settings.js',
];
```

- [ ] **Step 3: Create stub files for the other three JSX (so esbuild doesn't fail in this task)**

Otherwise `npm run build` errors. Create empty placeholders that will be overwritten in tasks 11-13:

Path: `/Users/robodash/Desktop/Mosim/mosim-site/js/me-status.jsx`
```jsx
// stub — implemented in Task 11
```

Path: `/Users/robodash/Desktop/Mosim/mosim-site/js/me-profile.jsx`
```jsx
// stub — implemented in Task 12
```

Path: `/Users/robodash/Desktop/Mosim/mosim-site/js/me-settings.jsx`
```jsx
// stub — implemented in Task 13
```

- [ ] **Step 4: Create `js/me-itineraries.jsx`**

Path: `/Users/robodash/Desktop/Mosim/mosim-site/js/me-itineraries.jsx`

```jsx
// My Page > Itineraries — list cards, delete button, link to viewer.

const { useEffect, useState } = React;

function StatusBadge({ status }) {
  const colors = {
    new:        { bg:'#eef2ff', fg:'#3744a6' },
    reviewing:  { bg:'#fff4e5', fg:'#7a4a00' },
    quoted:     { bg:'#e9f7ef', fg:'#1b6e3d' },
    booked:     { bg:'#fde9f1', fg:'#7a0a3f' },
    archived:   { bg:'#eee', fg:'#666' }
  };
  const c = colors[status] || colors.new;
  return (
    <span style={{
      display:'inline-block', padding:'4px 10px', borderRadius:999,
      background:c.bg, color:c.fg, fontSize:13, fontWeight:600, textTransform:'capitalize'
    }}>{status}</span>
  );
}

function fmtDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });
}

function MeItineraries() {
  const [supa, setSupa] = useState(null);
  const [rows, setRows] = useState(null); // null = loading
  const [err, setErr]   = useState(null);

  useEffect(() => {
    (async () => {
      let t = 0;
      while (!window.kwAuth && t < 100) { await new Promise(r => setTimeout(r, 50)); t++; }
      const client = await window.kwAuth.init();
      setSupa(client);
      const { data, error } = await client
        .from('itineraries')
        .select('id, title, status, created_at')
        .order('created_at', { ascending: false });
      if (error) { setErr(error.message); return; }
      setRows(data || []);
    })();
  }, []);

  async function onDelete(id) {
    if (!confirm('Delete this itinerary? This can\'t be undone.')) return;
    const { error } = await supa.from('itineraries').delete().eq('id', id);
    if (error) { alert(error.message); return; }
    setRows(rows.filter(r => r.id !== id));
  }

  if (err)        return <div style={{padding:20, color:'#a00'}}>Could not load: {err}</div>;
  if (rows === null) return <div style={{padding:20, color:'#777'}}>Loading...</div>;

  if (rows.length === 0) {
    return (
      <div style={{padding:40, textAlign:'center', background:'#fff', border:'1px solid #e2e2e2', borderRadius:12}}>
        <p style={{fontSize:19, color:'#444', margin:'0 0 18px'}}>
          You haven't saved any itineraries yet.
        </p>
        <a href="/step1.html" style={{
          display:'inline-block', padding:'12px 22px', background:'#B21464', color:'#fff',
          borderRadius:10, textDecoration:'none', fontSize:19, fontWeight:600
        }}>Plan a trip</a>
      </div>
    );
  }

  return (
    <div>
      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px,1fr))', gap:16}}>
        {rows.map(r => (
          <div key={r.id} style={{
            background:'#fff', border:'1px solid #e2e2e2', borderRadius:12,
            padding:20, display:'flex', flexDirection:'column', gap:10
          }}>
            <div style={{fontSize:19, fontWeight:600, color:'#1a1a1a'}}>{r.title || 'Untitled trip'}</div>
            <StatusBadge status={r.status} />
            <div style={{fontSize:15, color:'#777'}}>Saved {fmtDate(r.created_at)}</div>
            <div style={{display:'flex', gap:10, marginTop:6}}>
              <a href={`/result.html?itin=${r.id}`} style={{
                flex:1, textAlign:'center', padding:'10px 14px', background:'#B21464',
                color:'#fff', borderRadius:8, textDecoration:'none', fontSize:15, fontWeight:600
              }}>View</a>
              <button onClick={() => onDelete(r.id)} style={{
                padding:'10px 12px', background:'#fff', border:'1px solid #e2e2e2',
                borderRadius:8, cursor:'pointer', fontSize:15, color:'#a00'
              }}>Delete</button>
            </div>
          </div>
        ))}
      </div>
      <div style={{marginTop:24, textAlign:'center'}}>
        <a href="/step1.html" style={{fontSize:19, color:'#B21464', textDecoration:'none'}}>+ Plan a new trip</a>
      </div>
    </div>
  );
}

const root = document.getElementById('me-itineraries-root');
if (root) {
  root.classList.remove('placeholder');
  ReactDOM.render(<MeItineraries />, root);
}
```

- [ ] **Step 5: Update `me.html` to load React + the compiled JSX**

In `me.html`, just before the existing `<script type="module" src="/js/auth.js"></script>` line, add the React CDN (use the same version other steps use — check `index.html` for the exact CDN URLs used elsewhere, then match those):

```html
<script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
<script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
```

Then after the existing tab-routing inline script (at the bottom), add:

```html
<script src="/js/me-itineraries.js" defer></script>
<script src="/js/me-status.js" defer></script>
<script src="/js/me-profile.js" defer></script>
<script src="/js/me-settings.js" defer></script>
```

(post-build will stamp `?v=<hash>` automatically.)

- [ ] **Step 6: Update `result.html` to support `?itin=<id>` viewer mode**

`result.html` currently renders a schedule from sessionStorage via `kwSchedule.generate(kwState.loadAll())`. Add a branch: if `?itin=<id>` is in the URL, fetch the saved itinerary instead and render `schedule.jsonb` directly.

Locate the existing `<script>` block in `result.html` that calls `kwSchedule.generate(...)` and replace the entry-point logic with:

```js
(async function () {
  const params = new URLSearchParams(window.location.search);
  const itinId = params.get('itin');

  if (itinId) {
    // Saved itinerary viewer
    let t = 0;
    while (!window.kwAuth && t < 100) { await new Promise(r => setTimeout(r, 50)); t++; }
    const supa = await window.kwAuth.init();
    const { data, error } = await supa
      .from('itineraries')
      .select('schedule, title')
      .eq('id', itinId)
      .single();
    if (error || !data) {
      document.body.innerHTML = '<div style="padding:40px;text-align:center;font-size:19px;color:#a00">Could not load this itinerary. It may have been deleted, or you may not have access.</div>';
      return;
    }
    if (data.title) document.title = data.title + ' — K-Wellness';
    window.kwSchedule.render(data.schedule);   // see step 7
    return;
  }

  // Fresh from funnel
  const state = window.kwState.loadAll();
  const schedule = window.kwSchedule.generate(state);
  window.kwSchedule.render(schedule);
})();
```

You'll need `result.html` to load `/js/auth.js` as well — add the module tag at the top of `<body>` (or wherever scripts are loaded).

- [ ] **Step 7: Add `window.kwSchedule.render(schedule)` to `js/schedule.js`**

Look in `js/schedule.js` for the existing rendering code. If `generate()` already returns and the rendering is inline in result.html, refactor so:
- `kwSchedule.generate(state)` returns a schedule object (probably already does).
- `kwSchedule.render(schedule)` accepts the same object and paints the DOM.

If rendering is currently coupled with generation, split it. (Read the file first; the exact split depends on what's there.) After the split, `result.html` calls `render(schedule)` in both branches.

If the current code is monolithic and hard to split cleanly, an acceptable shortcut: keep the existing `generate(state)` path for the fresh funnel, and in the `?itin=` branch reconstruct a minimal `state`-shaped object by passing `data.state` directly to `generate()`. Either approach works; pick whichever yields the smallest diff. Document the choice in the commit message.

- [ ] **Step 8: Build and run**

```bash
npm run build   # compiles all JSX including new me-*.jsx
vercel dev
```

- [ ] **Step 9: End-to-end verification**

1. Sign in (existing user from Task 9).
2. Open `/me?tab=itineraries`. With no rows yet you should see the "no itineraries — Plan a trip" empty state.
3. Insert a fake itinerary via Supabase SQL Editor:

```sql
insert into public.itineraries (user_id, title, state, schedule, status)
values (
  (select id from auth.users limit 1),  -- your user
  'Test trip — May 2026',
  '{"contact":{"email":"x@x"},"trip":{},"medical":{},"culture":{},"cuisine":{}}'::jsonb,
  '[{"day":1,"items":[{"time":"09:00","title":"Arrival"}]}]'::jsonb,
  'new'
);
```

4. Reload `/me?tab=itineraries`. The card should appear with title, "new" badge, "Saved <date>".
5. Click "View" → lands on `/result.html?itin=<id>`. Verify the schedule renders (even if minimal — the fake JSON above is sparse).
6. Click "Delete" on the card → confirm → card vanishes, list refetches empty state.
7. Try `/result.html?itin=<bogus-uuid>` → should show the "Could not load" message.

- [ ] **Step 10: Commit**

```bash
git add js/me-itineraries.jsx js/me-status.jsx js/me-profile.jsx js/me-settings.jsx \
        me.html result.html package.json scripts/post-build.mjs js/schedule.js .gitignore
git commit -m "feat(me): itineraries list + saved-itinerary viewer at /result?itin=<id>"
```

**Note**: the existing `.gitignore` already excludes the 5 `step*.js` build outputs. Add the 4 new `me-*.js` outputs to the same pattern so Vercel regenerates them on deploy. In `.gitignore`, append after the existing `/js/step4-cuisine.js` line:

```
/js/me-itineraries.js
/js/me-status.js
/js/me-profile.js
/js/me-settings.js
```

---

## Task 11: `me-status.jsx`

**Files:**
- Modify: `js/me-status.jsx` (replace stub)

- [ ] **Step 1: Replace the `me-status.jsx` stub**

Path: `/Users/robodash/Desktop/Mosim/mosim-site/js/me-status.jsx`

```jsx
// My Page > Status — timeline for the user's most recent itinerary.

const { useEffect, useState } = React;

const STAGES = ['new', 'reviewing', 'quoted', 'booked'];

function MeStatus() {
  const [supa, setSupa] = useState(null);
  const [latest, setLatest] = useState(undefined); // undefined = loading
  const [err, setErr] = useState(null);

  useEffect(() => {
    (async () => {
      let t = 0;
      while (!window.kwAuth && t < 100) { await new Promise(r => setTimeout(r, 50)); t++; }
      const client = await window.kwAuth.init();
      setSupa(client);
      const { data, error } = await client
        .from('itineraries')
        .select('id, title, status, created_at')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) { setErr(error.message); return; }
      setLatest(data);
    })();
  }, []);

  if (err)              return <div style={{padding:20, color:'#a00'}}>Could not load: {err}</div>;
  if (latest === undefined) return <div style={{padding:20, color:'#777'}}>Loading...</div>;
  if (latest === null) {
    return (
      <div style={{padding:40, textAlign:'center', background:'#fff', border:'1px solid #e2e2e2', borderRadius:12}}>
        <p style={{fontSize:19, color:'#444'}}>No itineraries yet. Plan one to see your concierge status here.</p>
      </div>
    );
  }

  const stageIdx = STAGES.indexOf(latest.status) >= 0 ? STAGES.indexOf(latest.status) : 0;
  const explainer = {
    new:        "We've received your itinerary. A specialist will review within 48 hours.",
    reviewing:  "Our concierge is hand-crafting your detailed plan now.",
    quoted:     "A quote is on its way to your email. Reply to lock in your booking.",
    booked:     "You're all set. We'll send pre-arrival details one week before your trip."
  }[latest.status] || '';

  return (
    <div style={{background:'#fff', border:'1px solid #e2e2e2', borderRadius:12, padding:28}}>
      <h2 style={{margin:'0 0 6px', fontSize:22}}>{latest.title || 'Your trip'}</h2>
      <p style={{margin:'0 0 24px', color:'#777', fontSize:15}}>
        Saved {new Date(latest.created_at).toLocaleDateString('en-US', {month:'short', day:'numeric', year:'numeric'})}
      </p>

      <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24}}>
        {STAGES.map((s, i) => (
          <React.Fragment key={s}>
            <div style={{display:'flex', flexDirection:'column', alignItems:'center', gap:8, minWidth:80}}>
              <div style={{
                width:32, height:32, borderRadius:'50%',
                background: i <= stageIdx ? '#B21464' : '#e2e2e2',
                color: i <= stageIdx ? '#fff' : '#777',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:15, fontWeight:700
              }}>{i + 1}</div>
              <div style={{fontSize:15, color: i <= stageIdx ? '#1a1a1a' : '#777', textTransform:'capitalize'}}>{s}</div>
            </div>
            {i < STAGES.length - 1 && (
              <div style={{flex:1, height:2, background: i < stageIdx ? '#B21464' : '#e2e2e2', margin:'0 8px'}} />
            )}
          </React.Fragment>
        ))}
      </div>

      <p style={{margin:0, fontSize:19, color:'#444'}}>{explainer}</p>
    </div>
  );
}

const root = document.getElementById('me-status-root');
if (root) {
  root.classList.remove('placeholder');
  ReactDOM.render(<MeStatus />, root);
}
```

- [ ] **Step 2: Build and verify**

```bash
npm run build
vercel dev
```

1. Open `/me?tab=status`. With the fake row from Task 10 (`status='new'`), you should see stage 1 of 4 highlighted with the "we've received your itinerary" message.
2. In Supabase SQL Editor:
   ```sql
   update public.itineraries set status='reviewing' where title='Test trip — May 2026';
   ```
3. Reload `/me?tab=status` — stage 2 should now be highlighted.
4. Repeat with `quoted` and `booked` to verify each stage.

- [ ] **Step 3: Commit**

```bash
git add js/me-status.jsx
git commit -m "feat(me): status timeline for latest itinerary"
```

---

## Task 12: `me-profile.jsx`

**Files:**
- Modify: `js/me-profile.jsx` (replace stub)

- [ ] **Step 1: Replace the `me-profile.jsx` stub**

Path: `/Users/robodash/Desktop/Mosim/mosim-site/js/me-profile.jsx`

```jsx
// My Page > Profile — editable form for profiles row.

const { useEffect, useState } = React;

function MeProfile() {
  const [supa, setSupa] = useState(null);
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({ name:'', phone:'', language:'en', origin_country:'' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [msg, setMsg]         = useState(null);

  useEffect(() => {
    (async () => {
      let t = 0;
      while (!window.kwAuth && t < 100) { await new Promise(r => setTimeout(r, 50)); t++; }
      const client = await window.kwAuth.init();
      setSupa(client);
      const u = await window.kwAuth.getUser();
      setUser(u);
      const { data } = await client.from('profiles').select('*').eq('id', u.id).single();
      if (data) {
        setForm({
          name: data.name || '',
          phone: data.phone || '',
          language: data.language || 'en',
          origin_country: data.origin_country || ''
        });
      }
      setLoading(false);
    })();
  }, []);

  async function onSave(e) {
    e.preventDefault();
    setSaving(true); setMsg(null);
    const { error } = await supa
      .from('profiles')
      .update({
        name: form.name || null,
        phone: form.phone || null,
        language: form.language,
        origin_country: form.origin_country || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);
    setSaving(false);
    setMsg(error ? { kind:'err', text: error.message } : { kind:'ok', text:'Saved.' });
  }

  if (loading) return <div style={{padding:20, color:'#777'}}>Loading...</div>;

  return (
    <form onSubmit={onSave} style={{background:'#fff', border:'1px solid #e2e2e2', borderRadius:12, padding:28, maxWidth:560}}>
      <div style={{display:'flex', flexDirection:'column', gap:18}}>
        <Field label="Email (read-only)">
          <input value={user.email} disabled style={inputStyleDisabled} />
        </Field>
        <Field label="Name">
          <input value={form.name} onChange={e => setForm({...form, name:e.target.value})} style={inputStyle} />
        </Field>
        <Field label="Phone">
          <input value={form.phone} onChange={e => setForm({...form, phone:e.target.value})} style={inputStyle} placeholder="+1 555 123 4567" />
        </Field>
        <Field label="Origin country">
          <input value={form.origin_country} onChange={e => setForm({...form, origin_country:e.target.value})} style={inputStyle} placeholder="US, JP, ..." />
        </Field>
        <Field label="Language">
          <select value={form.language} onChange={e => setForm({...form, language:e.target.value})} style={inputStyle}>
            <option value="en">English</option>
            <option value="ko">한국어</option>
          </select>
        </Field>
      </div>
      <button type="submit" disabled={saving} style={btnStyle}>{saving ? 'Saving...' : 'Save'}</button>
      {msg && <div style={{marginTop:12, color: msg.kind === 'err' ? '#a00' : '#0a6', fontSize:15}}>{msg.text}</div>}
    </form>
  );
}

function Field({label, children}) {
  return (
    <label style={{display:'flex', flexDirection:'column', gap:6}}>
      <span style={{fontSize:15, color:'#444'}}>{label}</span>
      {children}
    </label>
  );
}
const inputStyle = { padding:'12px 14px', fontSize:19, border:'1px solid #e2e2e2', borderRadius:10, fontFamily:'inherit' };
const inputStyleDisabled = { ...inputStyle, background:'#f5f5f5', color:'#777' };
const btnStyle = { marginTop:24, padding:'14px 22px', background:'#B21464', color:'#fff', border:0, borderRadius:10, fontSize:19, fontWeight:600, cursor:'pointer' };

const root = document.getElementById('me-profile-root');
if (root) {
  root.classList.remove('placeholder');
  ReactDOM.render(<MeProfile />, root);
}
```

- [ ] **Step 2: Build and verify**

```bash
npm run build
vercel dev
```

1. Open `/me?tab=profile`. Form should load with email pre-filled (read-only) and any existing values populated.
2. Edit name, set phone "+1 555 123 4567", country "US", language "English". Save. Toast says "Saved."
3. Reload page → values should persist.
4. In Supabase Studio → `profiles` table → confirm the row was updated.
5. Try saving as a different user via different browser → verify they can't see/edit this row (RLS test).

- [ ] **Step 3: Commit**

```bash
git add js/me-profile.jsx
git commit -m "feat(me): profile editor (name, phone, language, origin country)"
```

---

## Task 13: `me-settings.jsx` + `/api/delete-account`

**Files:**
- Modify: `js/me-settings.jsx` (replace stub)
- Create: `api/delete-account.js`

- [ ] **Step 1: Create `api/delete-account.js`**

Path: `/Users/robodash/Desktop/Mosim/mosim-site/api/delete-account.js`

```js
// Deletes the authenticated user's account.
// CASCADE on profiles/itineraries removes their rows automatically.
// leads.user_id is set NULL to keep historical lead records (anonymized).

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const admin = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false }
    })
  : null;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!admin) return res.status(500).json({ error: 'Server not configured' });

  // 1. Verify the caller is authenticated by checking their JWT against Supabase.
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing bearer token' });

  const { data: { user }, error: getErr } = await admin.auth.getUser(token);
  if (getErr || !user) return res.status(401).json({ error: 'Invalid token' });

  // 2. Anonymize their leads rows.
  const { error: leadsErr } = await admin
    .from('leads')
    .update({ user_id: null })
    .eq('user_id', user.id);
  if (leadsErr) {
    console.error('[delete-account] leads anon failed', leadsErr);
    return res.status(500).json({ error: 'Failed to anonymize leads' });
  }

  // 3. Delete the auth user (CASCADE removes profiles + itineraries).
  const { error: delErr } = await admin.auth.admin.deleteUser(user.id);
  if (delErr) {
    console.error('[delete-account] deleteUser failed', delErr);
    return res.status(500).json({ error: 'Failed to delete account' });
  }

  return res.status(200).json({ ok: true });
}
```

- [ ] **Step 2: Replace the `me-settings.jsx` stub**

Path: `/Users/robodash/Desktop/Mosim/mosim-site/js/me-settings.jsx`

```jsx
// My Page > Settings — notification toggle + delete account.

const { useEffect, useState } = React;

function MeSettings() {
  const [emailUpdates, setEmailUpdates] = useState(true);
  const [deleting, setDeleting] = useState(false);

  async function onDelete() {
    if (!confirm('Delete your account permanently? Your itineraries and profile will be removed. This cannot be undone.')) return;
    setDeleting(true);
    try {
      const supa = await window.kwAuth.init();
      const { data: { session } } = await supa.auth.getSession();
      if (!session) { alert('Not signed in.'); setDeleting(false); return; }
      const r = await fetch('/api/delete-account', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + session.access_token }
      });
      const body = await r.json();
      if (!r.ok) { alert(body.error || 'Failed to delete'); setDeleting(false); return; }
      await window.kwAuth.signOut();
      window.location.replace('/?deleted=1');
    } catch (e) {
      alert('Failed to delete: ' + e.message);
      setDeleting(false);
    }
  }

  return (
    <div style={{display:'flex', flexDirection:'column', gap:24, maxWidth:560}}>
      <section style={{background:'#fff', border:'1px solid #e2e2e2', borderRadius:12, padding:24}}>
        <h2 style={{margin:'0 0 8px', fontSize:22}}>Notifications</h2>
        <label style={{display:'flex', alignItems:'center', gap:10, fontSize:19, color:'#444', marginTop:12}}>
          <input
            type="checkbox"
            checked={emailUpdates}
            onChange={e => setEmailUpdates(e.target.checked)}
            style={{width:18, height:18}}
          />
          Email me when my itinerary status changes
        </label>
        <p style={{fontSize:13, color:'#999', margin:'8px 0 0'}}>
          (Coming soon — for now we'll always email you on major updates.)
        </p>
      </section>

      <section style={{background:'#fff', border:'1px solid #e2e2e2', borderRadius:12, padding:24}}>
        <h2 style={{margin:'0 0 8px', fontSize:22, color:'#a00'}}>Danger zone</h2>
        <p style={{fontSize:15, color:'#666', margin:'0 0 16px'}}>
          Deleting your account removes your profile and saved itineraries.
          Past lead inquiries are kept but anonymized.
        </p>
        <button
          onClick={onDelete}
          disabled={deleting}
          style={{
            padding:'12px 20px', background:'#fff', color:'#a00', border:'1px solid #a00',
            borderRadius:10, fontSize:19, cursor:'pointer'
          }}
        >
          {deleting ? 'Deleting...' : 'Delete my account'}
        </button>
      </section>
    </div>
  );
}

const root = document.getElementById('me-settings-root');
if (root) {
  root.classList.remove('placeholder');
  ReactDOM.render(<MeSettings />, root);
}
```

- [ ] **Step 3: Build and verify**

```bash
npm run build
vercel dev
```

1. Open `/me?tab=settings`. Two cards render: notifications toggle, danger zone.
2. Toggle notifications — purely visual, no backend yet (intentional, v2 work).
3. Create a throwaway user (email signup) and verify they have at least one itinerary in DB.
4. From that user's `/me?tab=settings`, click "Delete my account", confirm.
5. Should redirect to `/?deleted=1` (you can ignore the param for now or add a banner later).
6. In Supabase Studio: `auth.users` row gone, `profiles` row gone (CASCADE), `itineraries` rows gone (CASCADE), `leads` rows for that user have `user_id = null`.

- [ ] **Step 4: Commit**

```bash
git add js/me-settings.jsx api/delete-account.js
git commit -m "feat(me): settings tab with notifications toggle and delete account"
```

---

## Task 14: `/api/save-itinerary` + result.html Save CTA + auto-save flow

**Files:**
- Create: `api/save-itinerary.js`
- Modify: `result.html`

- [ ] **Step 1: Create `api/save-itinerary.js`**

Path: `/Users/robodash/Desktop/Mosim/mosim-site/api/save-itinerary.js`

```js
// Saves the current funnel result as an itineraries row.
// Validates: bearer token → user, payload → required fields.

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const admin = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false }
    })
  : null;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!admin) return res.status(500).json({ error: 'Server not configured' });

  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing bearer token' });

  const { data: { user }, error: userErr } = await admin.auth.getUser(token);
  if (userErr || !user) return res.status(401).json({ error: 'Invalid token' });

  const { state, schedule, title } = req.body || {};
  if (!state || !schedule) return res.status(400).json({ error: 'state and schedule are required' });

  const { data, error } = await admin
    .from('itineraries')
    .insert({
      user_id: user.id,
      title: (title || '').slice(0, 120) || null,
      state,
      schedule,
      status: 'new'
    })
    .select('id')
    .single();

  if (error) {
    console.error('[save-itinerary] insert failed', error);
    return res.status(500).json({ error: 'Failed to save itinerary' });
  }
  return res.status(200).json({ ok: true, id: data.id });
}
```

- [ ] **Step 2: Add the Save CTA + logic to `result.html`**

In `result.html`, find a sensible spot above the schedule (near the top of the page content) and add the CTA block:

```html
<section id="kw-save-cta" style="display:none; max-width:760px; margin:24px auto; background:#fff; border:1px solid #e2e2e2; border-radius:14px; padding:24px 28px; text-align:center;">
  <h2 style="margin:0 0 8px; font-size:22;">Save this itinerary</h2>
  <p style="margin:0 0 18px; color:#444; font-size:19;">Track concierge progress and pick it up later from My Page.</p>
  <button id="kw-save-btn" type="button" style="padding:14px 22px; background:#B21464; color:#fff; border:0; border-radius:10px; font-size:19px; font-weight:600; cursor:pointer;">
    Save to my account
  </button>
  <div id="kw-save-msg" style="margin-top:12px; font-size:15px; min-height:1.2em;"></div>
</section>
```

Then in the result.html `<script>` block (after the existing init), add:

```js
(async function setupSave() {
  const cta = document.getElementById('kw-save-cta');
  const btn = document.getElementById('kw-save-btn');
  const msg = document.getElementById('kw-save-msg');

  // Hide CTA in viewer mode (?itin= is set) — there's nothing to save.
  const params = new URLSearchParams(window.location.search);
  if (params.get('itin')) return;

  let t = 0;
  while (!window.kwAuth && t < 100) { await new Promise(r => setTimeout(r, 50)); t++; }
  const user = await window.kwAuth.getUser();

  function titleFromState(state) {
    const when = state?.trip?.when || '';
    const interest = (state?.medical && state.medical[0]) || (state?.culture && state.culture[0]) || 'Wellness';
    const cap = s => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
    return `${cap(interest)} trip — ${when || 'Korea'}`.slice(0, 120);
  }

  async function doSave() {
    btn.disabled = true; msg.style.color = ''; msg.textContent = 'Saving...';
    const state = window.kwState.loadAll();
    const schedule = window.kwSchedule.generate(state);
    const title = titleFromState(state);
    const supa = await window.kwAuth.init();
    const { data: { session } } = await supa.auth.getSession();
    const r = await fetch('/api/save-itinerary', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'Authorization': 'Bearer ' + session.access_token
      },
      body: JSON.stringify({ state, schedule, title })
    });
    const body = await r.json();
    if (!r.ok) {
      msg.style.color = '#a00';
      msg.textContent = body.error || 'Failed to save';
      btn.disabled = false;
      return;
    }
    msg.style.color = '#0a6';
    msg.innerHTML = `Saved ✓ &nbsp; <a href="/me.html?tab=itineraries" style="color:#B21464;">View in My Page</a>`;
    btn.style.display = 'none';
  }

  if (!user) {
    // Anon — change button to "Sign up to save"
    cta.style.display = 'block';
    btn.textContent = 'Sign up to save';
    btn.addEventListener('click', () => {
      window.location.href = '/signup.html?next=result&save=1';
    });
    return;
  }

  // Logged in
  cta.style.display = 'block';
  btn.addEventListener('click', doSave);

  // Auto-save trigger: user just came back from signup with ?save=1
  if (params.get('save') === '1') {
    await doSave();
  }
})();
```

- [ ] **Step 3: Build and verify (anonymous flow)**

```bash
npm run build
vercel dev
```

1. Sign out of your account.
2. Open `/step1` → `/step2` → `/step3` → `/step4` → fill enough state to reach `/result`.
3. CTA should show "Sign up to save". Click it → `/signup.html?next=result&save=1`.
4. Sign up with a throwaway email → confirm email → land back on `/result.html?save=1`.
5. Auto-save runs. Toast "Saved ✓ View in My Page".
6. Click View → `/me?tab=itineraries` → card present with auto-generated title.

- [ ] **Step 4: Build and verify (logged-in flow)**

1. Stay signed in. Go through funnel again to reach `/result`.
2. CTA shows "Save to my account". Click → "Saving..." → "Saved ✓".
3. Click View → second card appears in My Page (duplicates allowed per spec).

- [ ] **Step 5: Verify viewer mode hides the CTA**

1. From `/me?tab=itineraries` click View on any card → `/result.html?itin=<id>`.
2. The CTA card should NOT be visible (`#kw-save-cta` stays `display:none`).
3. The schedule should render from the saved `schedule` jsonb.

- [ ] **Step 6: Commit**

```bash
git add api/save-itinerary.js result.html
git commit -m "feat(result): save itinerary CTA with auto-save after signup"
```

---

## Task 15: `api/lead.js` user_id support + `index.html` contact form update

**Files:**
- Modify: `api/lead.js`, `index.html`

- [ ] **Step 1: Update `api/lead.js` to accept `user_id`**

Path: `/Users/robodash/Desktop/Mosim/mosim-site/api/lead.js`

Modify the existing handler to verify the bearer token (if present) and attach the user_id to the insert.

Find the `body` destructure line:

```js
const { name, email, from, when: travelWhen, interest, note, state } = body;
```

Replace the surrounding logic with:

```js
const { name, email, from, when: travelWhen, interest, note, state } = body;

if (!email || typeof email !== 'string') {
  return res.status(400).json({ error: 'Email is required' });
}
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  return res.status(400).json({ error: 'Invalid email format' });
}

// If a bearer token is present, attach the user_id to the lead.
let userId = null;
const auth = req.headers.authorization || '';
const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
if (token) {
  const { data: { user } } = await supa.auth.getUser(token);
  if (user) userId = user.id;
}

const { data, error } = await supa
  .from('leads')
  .insert({
    name: name || null,
    email: email.trim().toLowerCase(),
    origin_from: from || null,
    travel_when: travelWhen || null,
    interest: interest || null,
    note: note || null,
    state: state || null,
    user_id: userId
  })
  .select('id')
  .single();
```

- [ ] **Step 2: Update `kwSubmitContact()` in `index.html` to send bearer token**

In `index.html`, find the `async function kwSubmitContact(ev)` definition (around line 2154). Inside it, locate the `fetch('/api/lead', ...)` call. Modify it to include the bearer token if the user is logged in:

```js
async function kwSubmitContact(ev) {
  ev.preventDefault();
  // ... existing form-extraction code ...

  // NEW: collect bearer if logged in
  let authHeader = {};
  if (window.kwAuth) {
    try {
      const supa = await window.kwAuth.init();
      const { data: { session } } = await supa.auth.getSession();
      if (session) authHeader = { 'Authorization': 'Bearer ' + session.access_token };
    } catch (e) {
      // best-effort; proceed without auth
    }
  }

  const r = await fetch('/api/lead', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...authHeader },
    body: JSON.stringify({ name, email, from, when, interest, note, state })
  });
  // ... existing response handling ...
}
```

(Use the existing variable names from the function — don't rename anything else. The diff should be ~6 added lines.)

- [ ] **Step 3: Verify anonymous submission still works**

```bash
vercel dev
```

1. Sign out.
2. Fill the landing-page contact form, submit.
3. Supabase Studio → `leads` → new row exists with `user_id = null`.

- [ ] **Step 4: Verify logged-in submission links user_id**

1. Sign in.
2. Reload landing, fill contact form, submit.
3. New `leads` row has `user_id` set to your auth.users.id.

- [ ] **Step 5: Commit**

```bash
git add api/lead.js index.html
git commit -m "feat(lead): link contact-form submissions to user when signed in"
```

---

## Task 16: README + CLAUDE.md updates

**Files:**
- Modify: `README.md`, `CLAUDE.md`

- [ ] **Step 1: Update `README.md`**

Add a "Local development with Vercel" subsection and a "Supabase setup" subsection. Read the current README first to match its style; then append:

```markdown
## Local development with Vercel CLI

The `api/*` serverless functions only work under the Vercel dev server, not under plain `python3 -m http.server`.

```bash
npm i -g vercel
vercel link              # one-time, pick the existing project
vercel env pull          # pulls SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY into .env.local
npm run build            # one-time, also rerun after JSX edits unless you use `npm run dev`
vercel dev               # http://localhost:3000
```

## Supabase setup

See `supabase/SETUP.md` for the one-time configuration of Google OAuth and redirect URLs. The DDL lives in `supabase/schema.sql` and is applied via Supabase Studio's SQL Editor.
```

- [ ] **Step 2: Update `CLAUDE.md`**

In the "배포 체크리스트" section (around the bottom), update the pre-deploy checklist to include:

```markdown
배포 전:
- [ ] `.gitignore` 확인 — `.DS_Store`, `node_modules`, `.env*` 제외
- [ ] PRD/design.md/CLAUDE.md 최신 상태
- [ ] Vercel 환경변수 4개(SUPABASE_URL, ANON_KEY, SERVICE_ROLE_KEY, ANTHROPIC_API_KEY) 설정
- [ ] Supabase RLS 정책 적용 (anon insert만 + profiles/itineraries own row)
- [ ] Supabase Auth Providers — Google 활성 + Client ID/Secret 입력
- [ ] Supabase URL Configuration — Site URL + redirect URLs (signup/signin/me/reset-password/result) 등록
- [ ] 이미지 라이선스 placeholder 교체 (또는 임시 공지)
```

And in the "데이터 흐름" section, add a note that signed-in users save itineraries to `public.itineraries` and that My Page reads from it via Supabase JS (RLS-protected).

- [ ] **Step 3: Commit**

```bash
git add README.md CLAUDE.md
git commit -m "docs: README and CLAUDE.md updates for accounts + Vercel dev"
```

---

## Final smoke test (after all tasks)

Run the full flow on production preview or local `vercel dev`:

- [ ] Anonymous: landing → contact form → submit (no auth header) → `leads` row created with `user_id=null`
- [ ] Anonymous: funnel → result → "Sign up to save" → Google signup → auto-save → My Page shows new itinerary
- [ ] Signed in: funnel → result → "Save to my account" → My Page list updates
- [ ] My Page Itineraries: click View → `/result.html?itin=<id>` renders saved schedule
- [ ] My Page Status: timeline reflects DB status; change in Studio → reload reflects
- [ ] My Page Profile: edit + save → DB updated → reload retains values
- [ ] My Page Settings → Delete: user removed from auth.users, profile + itineraries gone, leads anonymized
- [ ] Email signup: throwaway email → confirmation flow → `/me`
- [ ] Forgot password: signin "Forgot?" → email arrives → click link → reset-password.html → new password works
- [ ] Sign in/Sign out: nav indicator updates across all 6 main pages
- [ ] RLS: open browser devtools and try `supabase.from('itineraries').select()` while signed in as user A — should only see user A's rows
- [ ] Lighthouse on `/me`: Performance/Accessibility > 90

---

## Notes for the implementer

- **Don't widen scope.** If you find an unrelated bug, file it; don't fix it inline.
- **No new dependencies** beyond `@supabase/supabase-js` (already in package.json). The Supabase JS we use comes from a CDN ESM URL inside `auth.js`.
- **Visual verification is required** for every UI task — open a browser, click the thing, screenshot if helpful. Do not assert "done" based on type-check or build success alone.
- **Frequent commits**: every task ends with a commit. If a task feels too big to commit at once, split it.
- **CSS variables**: pages other than `me.html` define their own palette in `index.html`'s `<style>`. The auth pages (signup, signin, reset-password) and `me.html` define their palette inline for now to stay self-contained. Don't refactor into a shared stylesheet unless it becomes painful.
- **JSX constraint**: no `import` in `.jsx` files. Components are global, React comes from a CDN script tag. Match the existing `step*.jsx` files.
- **Apple OAuth is explicitly out of scope** (spec §12). Don't add Apple buttons or coming-soon placeholders.
