-- Milestone 1 — itinerary deliverable: additive columns on public.itineraries
-- + one seeded PUBLISHED test row (share_token='preview-test').
-- Idempotent + non-destructive. Existing `schedule` (AI draft) untouched.
-- Apply via Supabase Management API (POST /v1/projects/<ref>/database/query)
-- or paste in Studio > SQL Editor.

-- 1) Additive columns -------------------------------------------------------
alter table public.itineraries
  add column if not exists final        jsonb,        -- final deliverable { flights, hotel, contacts, days }
  add column if not exists depart_date  date,         -- real departure date (Day N date mapping)
  add column if not exists share_token  text,         -- public link token (set on publish)
  add column if not exists published_at timestamptz;  -- null = unpublished, value = customer-accessible

-- unique on share_token (guarded; can't use inline `unique` with add-if-not-exists)
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'itineraries_share_token_key'
  ) then
    alter table public.itineraries
      add constraint itineraries_share_token_key unique (share_token);
  end if;
end $$;

-- 2) Seed ONE published test row ------------------------------------------
-- FK: itineraries.user_id is NOT NULL references auth.users(id), so the seed
-- MUST bind to a real auth user. We pick the earliest existing user (an admin
-- test account) via subquery rather than hardcoding a uuid. Service role bypasses
-- RLS for this insert. Re-running updates the existing 'preview-test' row in place.
insert into public.itineraries (user_id, title, state, schedule, status, final, depart_date, share_token, published_at)
select
  (select id from auth.users order by created_at asc limit 1),
  'Robert & Linda Anderson in Korea',
  jsonb_build_object(
    'trip', jsonb_build_object('travelers', 2),
    'care', jsonb_build_object('summary', 'Health screening & orthopedic care')
  ),
  '{}'::jsonb,                 -- schedule (AI draft) — empty for the seed
  'booked',
  jsonb_build_object(
    'flights', jsonb_build_object(
      'outbound', jsonb_build_object(
        'airline','Korean Air','number','KE 018','date','2026-09-14',
        'dep_time','11:50 AM','dep_airport','LAX','dep_terminal','TBIT',
        'arr_time','5:20 PM','arr_airport','ICN','arr_terminal','Terminal 2','arr_offset','+1 day'
      ),
      'inbound', jsonb_build_object(
        'airline','Korean Air','number','KE 017','date','2026-09-20',
        'dep_time','9:00 PM','dep_airport','ICN','dep_terminal','Terminal 2',
        'arr_time','4:20 PM','arr_airport','LAX','arr_terminal','TBIT','arr_offset','same day'
      )
    ),
    'hotel', jsonb_build_object(
      'name','Four Seasons Hotel Seoul',
      'address','97 Saemunan-ro, Jongno-gu',
      'phone','+82 2-6388-5000',
      'checkin','2026-09-14','checkout','2026-09-20',
      'confirmation','FS-2026-88123'
    ),
    'contacts', jsonb_build_array(
      jsonb_build_object('role','Your Mosim concierge · 24 hours · call anytime','who','Michael Jang','tel','+82 10-1234-5678','primary',true),
      jsonb_build_object('role','Emergency (Korea)','who','Ambulance & Fire','tel','119','primary',false),
      jsonb_build_object('role','Hospital','who','Severance Intl','tel','+82 2-2228-5800','primary',false),
      jsonb_build_object('role','U.S. Embassy Seoul','who','Citizen Services','tel','+82 2-397-4114','primary',false)
    ),
    'days', jsonb_build_array(
      jsonb_build_object('day',1,'date','2026-09-14','title','Arrival & Welcome','items', jsonb_build_array(
        jsonb_build_object('time','5:20 PM','label','Arrival at Incheon — private vehicle & your Mosim host greet you at the gate'),
        jsonb_build_object('time','7:00 PM','label','Four Seasons check-in & welcome tea'),
        jsonb_build_object('time','8:00 PM','label','Light dinner in-suite — rest after the flight')
      )),
      jsonb_build_object('day',2,'date','2026-09-15','title','Health Screening','items', jsonb_build_array(
        jsonb_build_object('time','8:30 AM','label','Severance Health Promotion Center — comprehensive screening (your host accompanies you)'),
        jsonb_build_object('time','1:00 PM','label','Lunch — gentle hanjeongsik near the hospital'),
        jsonb_build_object('time','3:00 PM','label','Rest at hotel · evening free')
      )),
      jsonb_build_object('day',3,'date','2026-09-16','title','Orthopedic Consultation','items', jsonb_build_array(
        jsonb_build_object('time','9:30 AM','label','One-on-one consultation with lead orthopedic physician — knee assessment'),
        jsonb_build_object('time','2:00 PM','label','Gyeongbokgung Palace — gentle guided walk'),
        jsonb_build_object('time','6:30 PM','label','Dinner — royal-court hanjeongsik')
      )),
      jsonb_build_object('day',4,'date','2026-09-17','title','Restoration','items', jsonb_build_array(
        jsonb_build_object('time','10:00 AM','label','Premium spa & recovery treatment'),
        jsonb_build_object('time','3:00 PM','label','Bukchon Hanok Village stroll at an easy pace'),
        jsonb_build_object('time','7:00 PM','label','In-room dining — restorative menu')
      )),
      jsonb_build_object('day',5,'date','2026-09-18','title','Care Review & Culture','items', jsonb_build_array(
        jsonb_build_object('time','10:00 AM','label','Follow-up — results review & aftercare plan'),
        jsonb_build_object('time','2:00 PM','label','Private tea ceremony with a master'),
        jsonb_build_object('time','7:00 PM','label','Hanwoo omakase dinner')
      )),
      jsonb_build_object('day',6,'date','2026-09-19','title','Open Day','items', jsonb_build_array(
        jsonb_build_object('time','Morning','label','Free time — hotel lounge or a quiet Seoul stroll'),
        jsonb_build_object('time','2:00 PM','label','National Museum of Korea — at your pace'),
        jsonb_build_object('time','7:00 PM','label','Farewell dinner — Michelin-starred Korean fine dining')
      )),
      jsonb_build_object('day',7,'date','2026-09-20','title','Departure','items', jsonb_build_array(
        jsonb_build_object('time','11:00 AM','label','Closing consultation — aftercare documents & medications handoff'),
        jsonb_build_object('time','12:00 PM','label','Hotel checkout'),
        jsonb_build_object('time','6:00 PM','label','Private send-off to Incheon Airport for your 9:00 PM flight')
      ))
    )
  ),
  date '2026-09-14',
  'preview-test',
  now()
on conflict (share_token) do update set
  title        = excluded.title,
  state        = excluded.state,
  final        = excluded.final,
  depart_date  = excluded.depart_date,
  published_at = excluded.published_at,
  status       = excluded.status;

-- 3) Confirm columns exist --------------------------------------------------
select column_name, data_type
from information_schema.columns
where table_schema = 'public' and table_name = 'itineraries'
  and column_name in ('final','depart_date','share_token','published_at')
order by column_name;
