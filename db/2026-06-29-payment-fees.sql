-- C4 accounting (first step): capture the PG (PayPal) processing fee and the
-- payment method on each payment row, so cockpit Finance can show
--   net = collected − refunded − fees   and   gross by method (card vs PayPal).
--
-- Idempotent + manual-apply. ALL columns are nullable / have safe defaults so the
-- existing payment + funnel flow keeps working whether or not this is applied.
-- The serverless capture path writes these columns BEST-EFFORT (it degrades
-- silently if they are still missing), so applying this is non-breaking either way.

alter table public.payments
  add column if not exists method      text;                 -- 'card' | 'paypal' | null (derive)
alter table public.payments
  add column if not exists fee_amount   numeric(10,2) not null default 0;  -- PG processing fee
alter table public.payments
  add column if not exists net_amount   numeric(10,2);        -- amount − fee (PayPal's net)

-- Backfill is unnecessary: fee_amount defaults to 0, method/net stay null and the
-- app falls back to id-prefix method derivation + treats missing fees as 0.
