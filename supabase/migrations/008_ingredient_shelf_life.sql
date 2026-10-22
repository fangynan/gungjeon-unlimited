-- Gungjeon Unlimited — 008: automatic shelf life
--
-- Expiration dates are no longer typed in by hand. Each ingredient gets a standard shelf life
-- (in days), and every batch's expiration_date is calculated as:
--
--     expiration_date = received_date + ingredient.shelf_life_days
--
-- Run this AFTER 007, and BEFORE deploying the matching app changes.
-- Safe to run more than once.
--
-- Notes
--   * inventory_batches.expiration_date stays (NOT NULL). FEFO ordering, deduct/discard, the
--     expired-batch sweep and the dashboard all read it. It is now filled in by a trigger.
--   * Changing an ingredient's shelf life only affects batches added AFTER the change. Batches
--     that already exist keep the expiration date they have.
--   * Do not re-run the list_ingredients_with_stock() block of 001_schema.sql after this file:
--     its old column list cannot replace the new one.

-- ---------------------------------------------------------------------------
-- 1. Shelf life lives on the ingredient
-- ---------------------------------------------------------------------------
alter table public.ingredients
  add column if not exists shelf_life_days integer;

alter table public.ingredients drop constraint if exists ingredients_shelf_life_check;
alter table public.ingredients
  add constraint ingredients_shelf_life_check
  check (shelf_life_days is null or shelf_life_days between 1 and 3650);

comment on column public.ingredients.shelf_life_days is
  'Standard shelf life in days, counted from inventory_batches.received_date. NULL = not set yet; batches cannot be added until it is.';

-- ---------------------------------------------------------------------------
-- 2. Backfill: use what has already been entered by hand
--    (average of expiration_date - received_date over the ingredient's existing batches).
--    Ingredients with no batches stay NULL; an admin sets those in Inventory > Stock Levels.
-- ---------------------------------------------------------------------------
update public.ingredients i
set shelf_life_days = greatest(1, least(3650, s.days))
from (
  select ingredient_id,
         round(avg(expiration_date - received_date))::integer as days
  from public.inventory_batches
  group by ingredient_id
) s
where s.ingredient_id = i.id
  and i.shelf_life_days is null;

-- ---------------------------------------------------------------------------
-- 3. Trigger: the database, not the client, decides the expiration date
-- ---------------------------------------------------------------------------
create or replace function public.set_batch_expiration()
returns trigger
language plpgsql as $$
declare
  v_days integer;
begin
  select shelf_life_days into v_days
  from public.ingredients
  where id = new.ingredient_id;

  if tg_op = 'INSERT' then
    -- Whatever expiration_date the client sent is ignored.
    if v_days is null then
      raise exception 'Set a shelf life for this ingredient before adding batches.'
        using errcode = 'check_violation';
    end if;
    new.expiration_date := new.received_date + v_days;
  elsif v_days is not null then
    -- received_date was corrected: move the expiration date with it.
    new.expiration_date := new.received_date + v_days;
  end if;

  return new;
end $$;

drop trigger if exists inventory_batches_set_expiration_insert on public.inventory_batches;
create trigger inventory_batches_set_expiration_insert
  before insert on public.inventory_batches
  for each row execute function public.set_batch_expiration();

drop trigger if exists inventory_batches_set_expiration_update on public.inventory_batches;
create trigger inventory_batches_set_expiration_update
  before update of received_date on public.inventory_batches
  for each row
  when (old.received_date is distinct from new.received_date)
  execute function public.set_batch_expiration();

-- ---------------------------------------------------------------------------
-- 4. list_ingredients_with_stock() now also returns shelf_life_days.
--    The return columns changed, so it has to be dropped and recreated.
-- ---------------------------------------------------------------------------
drop function if exists public.list_ingredients_with_stock();

create function public.list_ingredients_with_stock()
returns table (
  id uuid,
  name text,
  unit text,
  minimum_threshold numeric,
  shelf_life_days integer,
  created_at timestamptz,
  total_stock numeric,
  is_low_stock boolean
)
language sql stable as $$
  select s.id, s.name, s.unit, s.minimum_threshold, s.shelf_life_days, s.created_at, s.total_stock,
         s.total_stock < s.minimum_threshold
  from (
    select i.id, i.name, i.unit, i.minimum_threshold, i.shelf_life_days, i.created_at,
           coalesce(sum(b.quantity) filter (
             where b.status = 'active' and b.expiration_date >= public.restaurant_today()
           ), 0) as total_stock
    from public.ingredients i
    left join public.inventory_batches b on b.ingredient_id = i.id
    group by i.id
  ) s
  order by s.name
$$;

revoke execute on function public.list_ingredients_with_stock() from public, anon;
grant  execute on function public.list_ingredients_with_stock() to authenticated;

-- Make PostgREST (Supabase's API) pick up the new column and function right away.
notify pgrst, 'reload schema';

-- ---------------------------------------------------------------------------
-- Rollback (only if you ever need it; keep commented):
--   drop trigger if exists inventory_batches_set_expiration_insert on public.inventory_batches;
--   drop trigger if exists inventory_batches_set_expiration_update on public.inventory_batches;
--   drop function if exists public.set_batch_expiration();
--   (then recreate list_ingredients_with_stock() from 001_schema.sql, and
--    alter table public.ingredients drop column shelf_life_days;)
-- ---------------------------------------------------------------------------
