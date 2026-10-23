-- Gungjeon Unlimited — 010: Pencil Booking (call-ahead / soft reservation)
-- Run after 009. Idempotent where practical; safe to re-run.
--
-- Lifecycle (enforced by trigger below, not just by app code):
--   PENDING   -> CONFIRMED | REJECTED | CANCELLED
--   CONFIRMED -> SEATED    | CANCELLED | EXPIRED_NO_SHOW
--   REJECTED / CANCELLED / SEATED / EXPIRED_NO_SHOW are terminal.
--
-- ACCESS MODEL (read this before changing the policies)
--   * Guests have NO direct table access. There is no anon policy at all.
--     Guest writes/reads go through server actions that use the service-role key
--     (create_pencil_booking RPC, cancel-by-token lookups).
--   * Why not "public SELECT/UPDATE where cancel_token matches"? An RLS policy cannot see the
--     token a client is asking for; it can only look at the row. Any policy permissive enough to
--     work would let anyone holding the public anon key list EVERY booking, including every guest's
--     name, email, phone and cancel_token. Token checks therefore live in server code.
--   * Staff/admin (authenticated) get full access via the same is_staff_or_admin() helper
--     used everywhere else (002_rls.sql).

-- ---------------------------------------------------------------------------
-- Table
-- ---------------------------------------------------------------------------
create table if not exists public.pencil_bookings (
  id                uuid primary key default gen_random_uuid(),
  guest_name        varchar(100) not null,
  guest_email       varchar(150) not null,
  guest_phone       varchar(20)  not null,
  party_size        integer      not null,
  booking_date      date         not null,          -- restaurant-local calendar date (Asia/Manila)
  booking_time      time         not null,          -- restaurant-local wall-clock time
  status            varchar(30)  not null default 'PENDING',
  assigned_table_id uuid references public.tables (id) on delete set null, -- null until seated
  cancel_token      uuid         not null default gen_random_uuid(),
  special_requests  text,
  staff_notes       text,                           -- internal only; never emailed to the guest
  handled_by        uuid references public.profiles (id) on delete set null, -- staff who confirmed/rejected
  seated_at         timestamptz,
  created_at        timestamptz  not null default now(),
  updated_at        timestamptz  not null default now(),
  constraint pencil_bookings_cancel_token_key unique (cancel_token),
  constraint pencil_bookings_party_size_check check (party_size > 0 and party_size <= 20),
  constraint pencil_bookings_status_check check (
    status in ('PENDING', 'CONFIRMED', 'REJECTED', 'CANCELLED', 'SEATED', 'EXPIRED_NO_SHOW')
  ),
  constraint pencil_bookings_special_requests_check check (char_length(special_requests) <= 500),
  constraint pencil_bookings_staff_notes_check check (char_length(staff_notes) <= 1000)
  -- Deliberately NO "SEATED requires assigned_table_id" check: deleting a table would
  -- ON DELETE SET NULL the column and then fail that check. seat_pencil_booking() enforces it instead.
);

-- ---------------------------------------------------------------------------
-- Indexes
-- (cancel_token is already indexed by its UNIQUE constraint above.)
-- ---------------------------------------------------------------------------
create index if not exists pencil_bookings_date_status_idx
  on public.pencil_bookings (booking_date, status);

-- Serves the slot-capacity sum and the no-show sweep: only live bookings.
create index if not exists pencil_bookings_live_slot_idx
  on public.pencil_bookings (booking_date, booking_time)
  where status in ('PENDING', 'CONFIRMED');

-- Per-guest active-booking limit lookup.
create index if not exists pencil_bookings_email_live_idx
  on public.pencil_bookings (lower(guest_email))
  where status in ('PENDING', 'CONFIRMED');

-- ON DELETE SET NULL on tables(id) scans this column.
create index if not exists pencil_bookings_table_idx
  on public.pencil_bookings (assigned_table_id)
  where assigned_table_id is not null;

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------
drop trigger if exists pencil_bookings_set_updated_at on public.pencil_bookings;
create trigger pencil_bookings_set_updated_at
  before update on public.pencil_bookings
  for each row execute function public.set_updated_at();

-- The state machine lives in the database so no code path (staff UI, server action,
-- SQL editor, future cron) can skip a step. Same-status updates (e.g. editing notes, or the
-- FK's SET NULL when a table is deleted) pass straight through.
create or replace function public.guard_pencil_booking_update()
returns trigger
language plpgsql as $$
begin
  if new.id is distinct from old.id
     or new.cancel_token is distinct from old.cancel_token
     or new.created_at is distinct from old.created_at then
    raise exception 'id, cancel_token and created_at are immutable.' using errcode = '42501';
  end if;

  if new.status is not distinct from old.status then
    return new;
  end if;

  if not (
       (old.status = 'PENDING'   and new.status in ('CONFIRMED', 'REJECTED', 'CANCELLED'))
    or (old.status = 'CONFIRMED' and new.status in ('SEATED', 'CANCELLED', 'EXPIRED_NO_SHOW'))
  ) then
    raise exception 'invalid_transition: % -> %', old.status, new.status using errcode = 'PB001';
  end if;

  return new;
end $$;

drop trigger if exists pencil_bookings_guard_update on public.pencil_bookings;
create trigger pencil_bookings_guard_update
  before update on public.pencil_bookings
  for each row execute function public.guard_pencil_booking_update();

-- ---------------------------------------------------------------------------
-- Row Level Security: staff/admin only
-- ---------------------------------------------------------------------------
alter table public.pencil_bookings enable row level security;

-- Belt and braces on top of "no anon policy": anon cannot even attempt the statement.
revoke all on public.pencil_bookings from anon;

drop policy if exists pencil_bookings_select_staff_or_admin on public.pencil_bookings;
drop policy if exists pencil_bookings_insert_staff_or_admin on public.pencil_bookings;
drop policy if exists pencil_bookings_update_staff_or_admin on public.pencil_bookings;
drop policy if exists pencil_bookings_delete_staff_or_admin on public.pencil_bookings;

create policy pencil_bookings_select_staff_or_admin on public.pencil_bookings
  for select to authenticated using (public.is_staff_or_admin());
create policy pencil_bookings_insert_staff_or_admin on public.pencil_bookings
  for insert to authenticated with check (public.is_staff_or_admin());
create policy pencil_bookings_update_staff_or_admin on public.pencil_bookings
  for update to authenticated using (public.is_staff_or_admin()) with check (public.is_staff_or_admin());
create policy pencil_bookings_delete_staff_or_admin on public.pencil_bookings
  for delete to authenticated using (public.is_staff_or_admin());

-- ---------------------------------------------------------------------------
-- RPC: create_pencil_booking — service role only.
-- Capacity is checked and the row inserted under one advisory lock per slot, so two guests
-- submitting at the same instant cannot both squeeze into the last seats (a plain
-- "select sum, then insert" from the app would race).
-- p_max_slot_pax is supplied by trusted server code; callers other than service_role cannot run this.
-- Errors (SQLSTATE -> meaning): PB002 guest_limit_reached, PB003 slot_full.
-- ---------------------------------------------------------------------------
create or replace function public.create_pencil_booking(
  p_guest_name        text,
  p_guest_email       text,
  p_guest_phone       text,
  p_party_size        integer,
  p_booking_date      date,
  p_booking_time      time,
  p_special_requests  text,
  p_max_slot_pax      integer,
  p_max_active_per_guest integer default 3
)
returns setof public.pencil_bookings
language plpgsql
security definer set search_path = public as $$
declare
  v_booked integer;
  v_active integer;
  v_row    public.pencil_bookings;
begin
  perform pg_advisory_xact_lock(
    hashtextextended(p_booking_date::text || ' ' || p_booking_time::text, 0)
  );

  -- Cheap abuse guard: one guest cannot hold an unlimited number of live future slots.
  select count(*) into v_active
  from public.pencil_bookings
  where lower(guest_email) = lower(p_guest_email)
    and status in ('PENDING', 'CONFIRMED')
    and (booking_date + booking_time) >= (now() at time zone 'Asia/Manila');
  if v_active >= p_max_active_per_guest then
    raise exception 'guest_limit_reached' using errcode = 'PB002';
  end if;

  select coalesce(sum(party_size), 0) into v_booked
  from public.pencil_bookings
  where booking_date = p_booking_date
    and booking_time = p_booking_time
    and status in ('PENDING', 'CONFIRMED');
  if v_booked + p_party_size > p_max_slot_pax then
    raise exception 'slot_full' using errcode = 'PB003';
  end if;

  insert into public.pencil_bookings
    (guest_name, guest_email, guest_phone, party_size, booking_date, booking_time, special_requests)
  values
    (p_guest_name, lower(p_guest_email), p_guest_phone, p_party_size, p_booking_date, p_booking_time,
     nullif(p_special_requests, ''))
  returning * into v_row;

  return next v_row;
  return;
end $$;

revoke execute on function public.create_pencil_booking(text, text, text, integer, date, time, text, integer, integer)
  from public, anon, authenticated;
grant  execute on function public.create_pencil_booking(text, text, text, integer, date, time, text, integer, integer)
  to service_role;

-- ---------------------------------------------------------------------------
-- RPC: seat_pencil_booking — staff/admin. Atomic: booking -> SEATED and table -> occupied
-- in one transaction. SECURITY INVOKER, so RLS and the tables guard trigger still apply.
-- Row locks on both rows stop two staff members seating two parties at one table (or one party twice).
-- Errors: PB004 booking_not_found, PB005 booking_not_confirmed, PB006 booking_not_today,
--         PB007 table_not_found, PB008 table_occupied.
-- Realtime: `tables` is already in the supabase_realtime publication (001), so the UPDATE below
-- reaches the admin tables page and the public /table-availability page automatically.
-- ---------------------------------------------------------------------------
create or replace function public.seat_pencil_booking(p_booking_id uuid, p_table_id uuid)
returns setof public.pencil_bookings
language plpgsql as $$
declare
  v_booking      public.pencil_bookings;
  v_table_status text;
  v_row          public.pencil_bookings;
begin
  if not public.is_staff_or_admin() then
    raise exception 'Only staff or admin can seat a booking.' using errcode = '42501';
  end if;

  select * into v_booking from public.pencil_bookings where id = p_booking_id for update;
  if not found then
    raise exception 'booking_not_found' using errcode = 'PB004';
  end if;
  if v_booking.status <> 'CONFIRMED' then
    raise exception 'booking_not_confirmed' using errcode = 'PB005';
  end if;
  if v_booking.booking_date <> public.restaurant_today() then
    raise exception 'booking_not_today' using errcode = 'PB006';
  end if;

  select status into v_table_status from public.tables where id = p_table_id for update;
  if not found then
    raise exception 'table_not_found' using errcode = 'PB007';
  end if;
  if v_table_status <> 'available' then
    raise exception 'table_occupied' using errcode = 'PB008';
  end if;

  update public.tables set status = 'occupied' where id = p_table_id;

  update public.pencil_bookings
  set status = 'SEATED', assigned_table_id = p_table_id, seated_at = now()
  where id = p_booking_id
  returning * into v_row;

  return next v_row;
  return;
end $$;

revoke execute on function public.seat_pencil_booking(uuid, uuid) from public, anon;
grant  execute on function public.seat_pencil_booking(uuid, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- RPC: expire_overdue_pencil_bookings — CONFIRMED bookings more than 15 minutes past their
-- time become EXPIRED_NO_SHOW. Compared as a full local timestamp (not just "today"), so a
-- missed sweep still catches yesterday's no-shows, and in Asia/Manila (the database clock is UTC;
-- CURRENT_DATE / CURRENT_TIME would be 8 hours off).
-- Note: a CONFIRMED guest who arrives late but before the next sweep can still be seated.
-- ---------------------------------------------------------------------------
create or replace function public.expire_overdue_pencil_bookings()
returns setof public.pencil_bookings
language sql as $$
  update public.pencil_bookings
  set status = 'EXPIRED_NO_SHOW'
  where status = 'CONFIRMED'
    and (booking_date + booking_time + interval '15 minutes') < (now() at time zone 'Asia/Manila')
  returning *
$$;

revoke execute on function public.expire_overdue_pencil_bookings() from public, anon;
grant  execute on function public.expire_overdue_pencil_bookings() to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Realtime: staff dashboard sees new / changed bookings live (honours RLS: staff only).
-- ---------------------------------------------------------------------------
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
       where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'pencil_bookings'
     )
  then
    alter publication supabase_realtime add table public.pencil_bookings;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Scheduler: sweep for no-shows every minute with pg_cron, entirely inside the database.
-- If pg_cron is not enabled on this project the migration still succeeds; enable it in
-- Dashboard -> Database -> Extensions and re-run this block, or call the
-- autoExpireOverdueBookings() server action from an external scheduler.
-- ---------------------------------------------------------------------------
do $$
begin
  create extension if not exists pg_cron with schema pg_catalog;
  perform cron.unschedule(jobid) from cron.job where jobname = 'expire-pencil-bookings';
  perform cron.schedule(
    'expire-pencil-bookings',
    '* * * * *',
    $job$select public.expire_overdue_pencil_bookings()$job$
  );
exception when others then
  raise notice 'pg_cron not scheduled (%): enable the extension and re-run this block.', sqlerrm;
end $$;
