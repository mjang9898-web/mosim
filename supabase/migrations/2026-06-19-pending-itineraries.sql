-- Pending itineraries — anonymous funnel-result stash so a plan survives the
-- email-confirmation signup gap (signup opens result.html in a NEW tab/browser
-- whose sessionStorage is empty → the funnel input + AI plan are otherwise lost).
--
-- Flow: result.html (anon) → POST /api/stash-itinerary → row keyed by an
-- unguessable claim_token (carried in the signup ?claim=<token> URL) → after
-- the user confirms email & lands authenticated → POST /api/claim-itinerary
-- (Bearer JWT) moves the row into public.itineraries under their user_id.
--
-- Idempotent + non-destructive. Apply via Supabase Management API
-- (POST /v1/projects/<ref>/database/query) or paste in Studio > SQL Editor.

-- 1) Table -----------------------------------------------------------------
-- itineraries.user_id is NOT NULL references auth.users(id), so an anon visitor
-- cannot pre-insert there. This staging table has NO user binding and is reached
-- ONLY through the service-role endpoints (RLS enabled, zero client policies).
create table if not exists public.pending_itineraries (
  claim_token uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  state       jsonb not null,                                   -- funnel state (care.note stripped before insert)
  schedule    jsonb not null,                                   -- AI 7-day plan
  title       text,
  expires_at  timestamptz not null default (now() + interval '7 days')
);

-- Lets a cleanup job / claim path filter expired rows cheaply.
create index if not exists pending_itineraries_expires_idx
  on public.pending_itineraries(expires_at);

-- 2) RLS — enabled, but DELIBERATELY no policies -----------------------------
-- With RLS enabled and zero policies, anon/authenticated have NO access at all.
-- Every read/write goes through the service role (api/stash-itinerary.js,
-- api/claim-itinerary.js), which bypasses RLS. This is intentional, not a TODO.
alter table public.pending_itineraries enable row level security;

-- (No `create policy` statements on purpose. Do not add client policies.)

-- 3) Confirm ----------------------------------------------------------------
select column_name, data_type
from information_schema.columns
where table_schema = 'public' and table_name = 'pending_itineraries'
order by ordinal_position;
