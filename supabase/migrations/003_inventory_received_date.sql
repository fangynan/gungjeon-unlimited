-- Gungjeon Unlimited — 003: date received on inventory batches
-- Run after 001_schema.sql and 002_rls.sql.
-- Already applied to the live database (safe to run again).

alter table public.inventory_batches add column if not exists received_date date;

update public.inventory_batches
set received_date = (created_at at time zone 'Asia/Manila')::date
where received_date is null;

alter table public.inventory_batches alter column received_date set not null;
alter table public.inventory_batches
  alter column received_date set default (timezone('Asia/Manila', now()))::date;