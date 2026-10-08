-- Gungjeon Unlimited — 001: schema
-- Scope: profiles, menu_items, tables. (Orders / reservations / payments are out of scope.)
--
-- Fresh database: run as-is.
-- Database that still has the OLD schema: run supabase/scripts/reset_legacy.sql first.

-- ---------------------------------------------------------------------------
-- Shared trigger: keep updated_at honest regardless of what the client sends
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------------------------------------------------------------------------
-- profiles  (1:1 with auth.users)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  email      text not null,
  full_name  text,
  role       text not null default 'customer',
  updated_at timestamptz not null default now(),
  constraint profiles_role_check check (role in ('admin', 'staff', 'customer'))
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Every new auth user gets a profile. Role is ALWAYS 'customer' here: it is never read
-- from signup metadata, so nobody can sign themselves up as admin.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, coalesce(new.email, ''), nullif(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill profiles for users that signed up before this trigger existed.
insert into public.profiles (id, email, full_name)
select u.id, coalesce(u.email, ''), nullif(u.raw_user_meta_data ->> 'full_name', '')
from auth.users u
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- menu_items
-- ---------------------------------------------------------------------------
create table public.menu_items (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  description  text,
  category     text not null,                       -- e.g. 'Pork', 'Beef', 'Side Dishes', 'Beverages', 'Set Meals'
  price        numeric(10, 2) not null check (price >= 0),
  image_url    text,
  is_available boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index menu_items_category_idx on public.menu_items (category);

create trigger menu_items_set_updated_at
  before update on public.menu_items
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- tables
-- ---------------------------------------------------------------------------
create table public.tables (
  id           uuid primary key default gen_random_uuid(),
  table_number text not null,
  capacity     integer not null check (capacity > 0),
  location     text,                                -- floor area: 'Indoor', 'Outdoor', 'Private room', ...
  status       text not null default 'available',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint tables_table_number_key unique (table_number),
  constraint tables_status_check check (status in ('available', 'occupied'))
);

create trigger tables_set_updated_at
  before update on public.tables
  for each row execute function public.set_updated_at();

-- Realtime: lets the staff portal and the public site subscribe to table status changes.
-- (Realtime honours RLS, and 002_rls.sql allows public SELECT on tables.)
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
       where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'tables'
     )
  then
    alter publication supabase_realtime add table public.tables;
  end if;
end $$;

-- ===========================================================================
-- FEFO inventory + side-dish analytics
-- Everything below is idempotent. If you already ran the original 001, run just this block.
-- ===========================================================================

-- "Today" for the restaurant (Philippines), so expiry and "today" analytics don't flip at 08:00 local.
create or replace function public.restaurant_today()
returns date
language sql stable as $$
  select (now() at time zone 'Asia/Manila')::date
$$;

-- ---------------------------------------------------------------------------
-- menu_items.views_count — bumped by log_side_dish_request() below.
-- ---------------------------------------------------------------------------
alter table public.menu_items
  add column if not exists views_count integer not null default 0
  constraint menu_items_views_count_check check (views_count >= 0);

-- A view-counter bump is not an edit: don't touch updated_at for it.
drop trigger if exists menu_items_set_updated_at on public.menu_items;
create trigger menu_items_set_updated_at
  before update on public.menu_items
  for each row
  when (old.views_count is not distinct from new.views_count)
  execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- ingredients / inventory_batches
-- ---------------------------------------------------------------------------
create table if not exists public.ingredients (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  unit              text not null,                  -- 'kg', 'grams', 'liters', 'packs', ...
  minimum_threshold numeric not null default 0,
  created_at        timestamptz not null default now(),
  constraint ingredients_name_key unique (name),
  constraint ingredients_threshold_check check (minimum_threshold >= 0)
);

create table if not exists public.inventory_batches (
  id              uuid primary key default gen_random_uuid(),
  ingredient_id   uuid not null references public.ingredients (id) on delete cascade,
  batch_number    text not null,
  quantity        numeric not null,
  expiration_date date not null,
  status          text not null default 'active',
  created_at      timestamptz not null default now(),
  constraint inventory_batches_quantity_check check (quantity >= 0),
  constraint inventory_batches_status_check check (status in ('active', 'expired', 'depleted'))
);

-- Serves the FEFO query: active batches, earliest expiry first.
create index if not exists inventory_batches_fefo_idx
  on public.inventory_batches (ingredient_id, expiration_date)
  where status = 'active';

-- Ingredients with the stock that is actually usable: active, unexpired batches only.
-- SECURITY INVOKER (default): RLS on both tables applies to the caller.
create or replace function public.list_ingredients_with_stock()
returns table (
  id uuid,
  name text,
  unit text,
  minimum_threshold numeric,
  created_at timestamptz,
  total_stock numeric,
  is_low_stock boolean
)
language sql stable as $$
  select s.id, s.name, s.unit, s.minimum_threshold, s.created_at, s.total_stock,
         s.total_stock < s.minimum_threshold
  from (
    select i.id, i.name, i.unit, i.minimum_threshold, i.created_at,
           coalesce(sum(b.quantity) filter (
             where b.status = 'active' and b.expiration_date >= public.restaurant_today()
           ), 0) as total_stock
    from public.ingredients i
    left join public.inventory_batches b on b.ingredient_id = i.id
    group by i.id
  ) s
  order by s.name
$$;

-- Atomic deduction (no read-modify-write race between two staff members).
-- Returns the updated batch, or zero rows if the batch is missing, not active, expired,
-- or holds less than p_amount — the API then works out which one.
create or replace function public.deduct_inventory_batch(p_batch_id uuid, p_amount numeric)
returns setof public.inventory_batches
language sql as $$
  update public.inventory_batches
  set quantity = quantity - p_amount,
      status   = case when quantity - p_amount = 0 then 'depleted' else status end
  where id = p_batch_id
    and status = 'active'
    and expiration_date >= public.restaurant_today()
    and quantity >= p_amount
  returning *
$$;

revoke execute on function public.list_ingredients_with_stock() from public, anon;
revoke execute on function public.deduct_inventory_batch(uuid, numeric) from public, anon;
grant  execute on function public.list_ingredients_with_stock() to authenticated;
grant  execute on function public.deduct_inventory_batch(uuid, numeric) to authenticated;

-- ---------------------------------------------------------------------------
-- side_dish_requests
-- ---------------------------------------------------------------------------
create table if not exists public.side_dish_requests (
  id           uuid primary key default gen_random_uuid(),
  menu_item_id uuid not null references public.menu_items (id) on delete cascade,
  table_id     uuid references public.tables (id) on delete set null,
  requested_at timestamptz not null default now()
);

create index if not exists side_dish_requests_requested_at_idx on public.side_dish_requests (requested_at);
create index if not exists side_dish_requests_menu_item_idx    on public.side_dish_requests (menu_item_id);

-- Public-facing: logs the request AND bumps views_count atomically. SECURITY DEFINER because
-- anon may not UPDATE menu_items. Only 'Side Dishes' items qualify; anything else yields zero rows.
create or replace function public.log_side_dish_request(p_menu_item_id uuid, p_table_id uuid default null)
returns setof public.side_dish_requests
language plpgsql
security definer set search_path = public as $$
declare
  v_row public.side_dish_requests;
begin
  update public.menu_items
  set views_count = views_count + 1
  where id = p_menu_item_id and lower(category) = 'side dishes';
  if not found then
    return;
  end if;

  insert into public.side_dish_requests (menu_item_id, table_id)
  values (p_menu_item_id, p_table_id)
  returning * into v_row;

  return next v_row;
end $$;

revoke execute on function public.log_side_dish_request(uuid, uuid) from public;
grant  execute on function public.log_side_dish_request(uuid, uuid) to anon, authenticated;

-- Request counts per side dish for a period (restaurant-local time):
--   today = since local midnight · week = last 7 days incl. today · month = last 30 days incl. today · all.
-- Side dishes with no requests are included (count 0). Ordered by requests, then views_count, then name.
-- views_count is a lifetime counter, so it is NOT narrowed by the period.
create or replace function public.side_dish_analytics(p_period text default 'all')
returns table (
  menu_item_id uuid,
  name text,
  request_count bigint,
  views_count integer,
  last_requested_at timestamptz
)
language sql stable as $$
  with bounds as (
    select case p_period
      when 'today' then date_trunc('day', now() at time zone 'Asia/Manila') at time zone 'Asia/Manila'
      when 'week'  then (date_trunc('day', now() at time zone 'Asia/Manila') - interval '6 days')  at time zone 'Asia/Manila'
      when 'month' then (date_trunc('day', now() at time zone 'Asia/Manila') - interval '29 days') at time zone 'Asia/Manila'
      else '-infinity'::timestamptz
    end as since
  )
  select m.id, m.name, count(r.id), m.views_count, max(r.requested_at)
  from public.menu_items m
  cross join bounds b
  left join public.side_dish_requests r
    on r.menu_item_id = m.id and r.requested_at >= b.since
  where lower(m.category) = 'side dishes'
  group by m.id
  order by count(r.id) desc, m.views_count desc, m.name asc
$$;

revoke execute on function public.side_dish_analytics(text) from public, anon;
grant  execute on function public.side_dish_analytics(text) to authenticated;

-- ===========================================================================
-- Staff account management
-- Idempotent. If you already ran the original 001, run just this block.
-- ===========================================================================

-- Lets an admin deactivate an account without deleting the auth user.
alter table public.profiles add column if not exists is_active boolean not null default true;
