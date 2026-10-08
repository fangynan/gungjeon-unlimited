-- Gungjeon Unlimited — 004: inventory activity log + live updates
-- Run after 003_inventory_received_date.sql.
-- Already applied to the live database (safe to run again).

-- 1. The log table
create table if not exists public.inventory_logs (
  id               uuid primary key default gen_random_uuid(),
  batch_id         uuid references public.inventory_batches (id) on delete set null,
  ingredient_name  text not null,
  batch_number     text not null,
  unit             text not null,
  change_type      text not null,
  quantity_changed numeric not null,
  user_id          uuid references public.profiles (id) on delete set null,
  user_name        text,
  created_at       timestamptz not null default now(),
  constraint inventory_logs_type_check check (change_type in ('added', 'used', 'adjusted'))
);

create index if not exists inventory_logs_created_at_idx
  on public.inventory_logs (created_at desc);

-- 2. Only admin and staff may read it. Nobody can write to it directly (only the trigger below).
alter table public.inventory_logs enable row level security;

drop policy if exists inventory_logs_select_staff_or_admin on public.inventory_logs;
create policy inventory_logs_select_staff_or_admin on public.inventory_logs
  for select to authenticated using (public.is_staff_or_admin());

-- 3. The trigger: writes a log row whenever a batch is added or its quantity changes
create or replace function public.log_inventory_change()
returns trigger
language plpgsql
security definer set search_path = public as $$
declare
  v_name   text;
  v_unit   text;
  v_user   text;
  v_type   text;
  v_change numeric;
begin
  select name, unit into v_name, v_unit
  from public.ingredients where id = new.ingredient_id;

  select coalesce(nullif(full_name, ''), email) into v_user
  from public.profiles where id = auth.uid();

  if tg_op = 'INSERT' then
    v_type := 'added';
    v_change := new.quantity;
  else
    v_type := coalesce(nullif(current_setting('app.change_type', true), ''), 'adjusted');
    v_change := new.quantity - old.quantity;
  end if;

  insert into public.inventory_logs
    (batch_id, ingredient_name, batch_number, unit, change_type, quantity_changed, user_id, user_name)
  values
    (new.id, coalesce(v_name, '?'), new.batch_number, coalesce(v_unit, ''), v_type, v_change, auth.uid(), v_user);

  return new;
end $$;

drop trigger if exists inventory_batches_log_insert on public.inventory_batches;
create trigger inventory_batches_log_insert
  after insert on public.inventory_batches
  for each row execute function public.log_inventory_change();

drop trigger if exists inventory_batches_log_update on public.inventory_batches;
create trigger inventory_batches_log_update
  after update of quantity on public.inventory_batches
  for each row when (old.quantity is distinct from new.quantity)
  execute function public.log_inventory_change();

-- 4. Deduct function replaced so its changes are marked as "used"
create or replace function public.deduct_inventory_batch(p_batch_id uuid, p_amount numeric)
returns setof public.inventory_batches
language plpgsql as $$
begin
  perform set_config('app.change_type', 'used', true);
  return query
  with u as (
    update public.inventory_batches
    set quantity = quantity - p_amount,
        status   = case when quantity - p_amount = 0 then 'depleted' else status end
    where id = p_batch_id
      and status = 'active'
      and expiration_date >= public.restaurant_today()
      and quantity >= p_amount
    returning *
  )
  select * from u;
end $$;

revoke execute on function public.deduct_inventory_batch(uuid, numeric) from public, anon;
grant  execute on function public.deduct_inventory_batch(uuid, numeric) to authenticated;

-- 5. Live updates (Realtime) for the inventory tables
do $$
declare t text;
begin
  foreach t in array array['inventory_batches', 'ingredients', 'inventory_logs'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;