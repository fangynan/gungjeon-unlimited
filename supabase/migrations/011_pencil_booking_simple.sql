-- 011_pencil_booking_simple.sql
-- Pencil Booking, simple version. Resets the over-built table from 010.
-- Rules: guests insert through a server action (service role). No anon access at all.
-- Staff and admin can read and update. Nobody can delete (no delete policy).
-- Times are restaurant-local (Asia/Manila). Never use CURRENT_DATE / CURRENT_TIME here.
-- "History" is computed in the app: status <> 'UPCOMING' OR booking time + 15 min has passed.
-- No cron job, no trigger for expiry.

-- 1) Stop the old scheduler (safe even if pg_cron is not enabled).
do $$
begin
  perform cron.unschedule(jobid) from cron.job where jobname = 'expire-pencil-bookings';
exception when others then
  raise notice 'No cron job to unschedule (%).', sqlerrm;
end $$;

-- 2) Drop the old table (takes its triggers, policies, indexes, realtime entry with it).
drop table if exists public.pencil_bookings cascade;

-- 3) Drop the old functions.
drop function if exists public.create_pencil_booking(text, text, text, integer, date, time, text, integer, integer);
drop function if exists public.seat_pencil_booking(uuid, uuid);
drop function if exists public.expire_overdue_pencil_bookings();
drop function if exists public.guard_pencil_booking_update();

-- 4) Lean table.
create table public.pencil_bookings (
  id               uuid primary key default gen_random_uuid(),
  guest_name       varchar(100) not null,
  guest_email      varchar(150) not null,
  guest_phone      varchar(20)  not null,
  party_size       integer      not null,
  booking_date     date         not null,   -- restaurant-local date (Asia/Manila)
  booking_time     time         not null,   -- restaurant-local wall-clock time
  status           varchar(20)  not null default 'UPCOMING',
  special_requests text,
  staff_notes      text,                    -- internal only
  handled_by       uuid references public.profiles (id) on delete set null,
  created_at       timestamptz  not null default now(),
  updated_at       timestamptz  not null default now(),
  constraint pencil_bookings_party_size_check check (party_size > 0 and party_size <= 20),
  constraint pencil_bookings_status_check check (status in ('UPCOMING', 'ARRIVED', 'CANCELLED')),
  constraint pencil_bookings_special_requests_check check (char_length(special_requests) <= 500),
  constraint pencil_bookings_staff_notes_check check (char_length(staff_notes) <= 1000)
);

create index pencil_bookings_date_time_idx
  on public.pencil_bookings (booking_date, booking_time);

-- 5) updated_at (set_updated_at() already exists from 001).
create trigger pencil_bookings_set_updated_at
  before update on public.pencil_bookings
  for each row execute function public.set_updated_at();

-- 6) Security.
alter table public.pencil_bookings enable row level security;

revoke all on public.pencil_bookings from anon;
revoke delete on public.pencil_bookings from authenticated;

create policy pencil_bookings_select_staff_or_admin on public.pencil_bookings
  for select to authenticated
  using (public.is_staff_or_admin());

create policy pencil_bookings_update_staff_or_admin on public.pencil_bookings
  for update to authenticated
  using (public.is_staff_or_admin())
  with check (public.is_staff_or_admin());

-- No insert policy: guest inserts use the service-role client in the server action.
-- No delete policy: bookings are never deleted.
