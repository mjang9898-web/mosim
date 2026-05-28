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
