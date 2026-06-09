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
  status      text default 'new',
  flight_status text not null default 'none',   -- admin: none | pending | booked
  stay_status   text not null default 'none'    -- admin: none | pending | booked
);
-- (added 2026-06-08 for the cockpit Flight/Stay tracking; applied via dashboard)
alter table public.itineraries add column if not exists flight_status text not null default 'none';
alter table public.itineraries add column if not exists stay_status   text not null default 'none';

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

-- 8) bookings (Phase 2 travel bookings — hotel/flight) — added 2026-06-09, applied via dashboard.
-- One flexible container for: Mosim-posted links (kind='link'), customer uploads
-- (kind='upload'), and FUTURE external/automated booking refs (kind='ref' +
-- provider/external_ref/meta — the empty slots for a booking-site integration).
create table if not exists public.bookings (
  id           uuid primary key default gen_random_uuid(),
  itinerary_id uuid not null references public.itineraries(id) on delete cascade,
  category     text not null default 'other',   -- 'flight' | 'stay' | 'other'
  kind         text not null,                    -- 'link' | 'upload' | 'ref'
  label        text,
  url          text,                             -- booking/pay link (kind='link')
  file_path    text,                             -- storage path (kind='upload')
  provider     text,                             -- future integration: 'tripcom','duffel',...
  external_ref text,                             -- future: provider booking id / PNR
  meta         jsonb not null default '{}',
  status       text not null default 'pending',  -- 'pending' | 'booked' | 'cancelled'
  created_by   text not null default 'mosim',    -- 'mosim' | 'customer' | 'system'
  created_at   timestamptz not null default now()
);
create index if not exists bookings_itinerary_idx on public.bookings(itinerary_id);
alter table public.bookings enable row level security;
create policy "bookings own read" on public.bookings for select
  using (exists (select 1 from public.itineraries i where i.id = bookings.itinerary_id and i.user_id = auth.uid()));
create policy "bookings own upload" on public.bookings for insert
  with check (kind = 'upload' and created_by = 'customer'
    and exists (select 1 from public.itineraries i where i.id = bookings.itinerary_id and i.user_id = auth.uid()));
-- private storage bucket 'bookings' (customer confirmations); files keyed under <uid>/...
-- insert into storage.buckets (id, name, public) values ('bookings','bookings', false) on conflict (id) do nothing;
-- storage.objects policies: authenticated users may insert/select files under their own <uid> prefix.
