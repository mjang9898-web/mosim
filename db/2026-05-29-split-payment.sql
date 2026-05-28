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

  if g.status = 'paid' then
    raise exception 'payment group already fully paid';
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

-- record_payment must only be callable by the service role (the serverless
-- /api/paypal-order capture step). Supabase grants EXECUTE on public-schema
-- functions to `public` by default, which would expose it to anon via REST RPC.
revoke execute on function public.record_payment(text, numeric, text, text, text, text) from public, anon, authenticated;
