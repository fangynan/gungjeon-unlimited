-- Gungjeon Unlimited — 002: Row Level Security
-- Run after 001_schema.sql.

-- ---------------------------------------------------------------------------
-- Role helpers. SECURITY DEFINER so policies on `profiles` can look up the
-- caller's role without recursing into profiles' own RLS.
-- ---------------------------------------------------------------------------
create or replace function public.get_my_role()
returns text
language sql stable
security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.is_admin()
returns boolean
language sql stable
security definer set search_path = public as $$
  select coalesce(public.get_my_role() = 'admin', false)
$$;

create or replace function public.is_staff_or_admin()
returns boolean
language sql stable
security definer set search_path = public as $$
  select coalesce(public.get_my_role() in ('staff', 'admin'), false)
$$;

alter table public.profiles   enable row level security;
alter table public.menu_items enable row level security;
alter table public.tables     enable row level security;

-- ---------------------------------------------------------------------------
-- profiles: SELECT / UPDATE for self or admin. No client INSERT/DELETE
-- (profiles are created by the auth trigger and removed by cascade).
-- ---------------------------------------------------------------------------
create policy profiles_select_self_or_admin on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.is_admin());

create policy profiles_update_self_or_admin on public.profiles
  for update to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

-- RLS cannot restrict individual columns, so without this a user could
-- `update profiles set role = 'admin'` on their own row. Only admins may change roles.
-- (auth.uid() is null for the service role / SQL editor, which stay unrestricted.)
create or replace function public.guard_profile_update()
returns trigger
language plpgsql as $$
begin
  if auth.uid() is not null and not public.is_admin() and new.role is distinct from old.role then
    raise exception 'Only an admin can change a user''s role.' using errcode = '42501';
  end if;
  return new;
end $$;

create trigger profiles_guard_update
  before update on public.profiles
  for each row execute function public.guard_profile_update();

-- ---------------------------------------------------------------------------
-- menu_items: public read; admin write
-- ---------------------------------------------------------------------------
create policy menu_items_select_public on public.menu_items
  for select to anon, authenticated
  using (true);

create policy menu_items_insert_admin on public.menu_items
  for insert to authenticated
  with check (public.is_admin());

create policy menu_items_update_admin on public.menu_items
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy menu_items_delete_admin on public.menu_items
  for delete to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- tables: public read; admin insert/delete; admin OR staff update
-- ---------------------------------------------------------------------------
create policy tables_select_public on public.tables
  for select to anon, authenticated
  using (true);

create policy tables_insert_admin on public.tables
  for insert to authenticated
  with check (public.is_admin());

create policy tables_update_staff_or_admin on public.tables
  for update to authenticated
  using (public.is_staff_or_admin())
  with check (public.is_staff_or_admin());

create policy tables_delete_admin on public.tables
  for delete to authenticated
  using (public.is_admin());

-- Staff may change a table's STATUS only; admins may change anything. Same reason as
-- the profiles guard above: RLS policies are row-level, not column-level.
create or replace function public.guard_table_update()
returns trigger
language plpgsql as $$
begin
  if auth.uid() is not null and not public.is_admin()
     and (new.table_number, new.capacity, new.location)
         is distinct from (old.table_number, old.capacity, old.location)
  then
    raise exception 'Staff can only update a table''s status.' using errcode = '42501';
  end if;
  return new;
end $$;

create trigger tables_guard_update
  before update on public.tables
  for each row execute function public.guard_table_update();

-- ---------------------------------------------------------------------------
-- Storage: public bucket for menu photos (admins upload from the browser, then
-- save the resulting public URL in menu_items.image_url via the API).
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('menu-images', 'menu-images', true)
on conflict (id) do nothing;

create policy menu_images_public_read on storage.objects
  for select
  using (bucket_id = 'menu-images');

create policy menu_images_admin_write on storage.objects
  for all to authenticated
  using (bucket_id = 'menu-images' and public.is_admin())
  with check (bucket_id = 'menu-images' and public.is_admin());

-- ===========================================================================
-- FEFO inventory + side-dish analytics: RLS
-- Idempotent. If you already ran the original 002, run just this block (after the new 001 block).
-- ===========================================================================

alter table public.ingredients        enable row level security;
alter table public.inventory_batches  enable row level security;
alter table public.side_dish_requests enable row level security;

-- ---------------------------------------------------------------------------
-- ingredients + inventory_batches: admin or staff, all operations.
-- (The API additionally restricts creating ingredients to admins.)
-- ---------------------------------------------------------------------------
drop policy if exists ingredients_select_staff_or_admin on public.ingredients;
drop policy if exists ingredients_insert_staff_or_admin on public.ingredients;
drop policy if exists ingredients_update_staff_or_admin on public.ingredients;
drop policy if exists ingredients_delete_staff_or_admin on public.ingredients;

create policy ingredients_select_staff_or_admin on public.ingredients
  for select to authenticated using (public.is_staff_or_admin());
create policy ingredients_insert_staff_or_admin on public.ingredients
  for insert to authenticated with check (public.is_staff_or_admin());
create policy ingredients_update_staff_or_admin on public.ingredients
  for update to authenticated using (public.is_staff_or_admin()) with check (public.is_staff_or_admin());
create policy ingredients_delete_staff_or_admin on public.ingredients
  for delete to authenticated using (public.is_staff_or_admin());

drop policy if exists inventory_batches_select_staff_or_admin on public.inventory_batches;
drop policy if exists inventory_batches_insert_staff_or_admin on public.inventory_batches;
drop policy if exists inventory_batches_update_staff_or_admin on public.inventory_batches;
drop policy if exists inventory_batches_delete_staff_or_admin on public.inventory_batches;

create policy inventory_batches_select_staff_or_admin on public.inventory_batches
  for select to authenticated using (public.is_staff_or_admin());
create policy inventory_batches_insert_staff_or_admin on public.inventory_batches
  for insert to authenticated with check (public.is_staff_or_admin());
create policy inventory_batches_update_staff_or_admin on public.inventory_batches
  for update to authenticated using (public.is_staff_or_admin()) with check (public.is_staff_or_admin());
create policy inventory_batches_delete_staff_or_admin on public.inventory_batches
  for delete to authenticated using (public.is_staff_or_admin());

-- ---------------------------------------------------------------------------
-- side_dish_requests: anyone may log a request for a real side dish; only admin/staff may read.
-- No UPDATE/DELETE policies: the log is append-only from the API's point of view.
-- ---------------------------------------------------------------------------
drop policy if exists side_dish_requests_insert_public on public.side_dish_requests;
drop policy if exists side_dish_requests_select_staff_or_admin on public.side_dish_requests;

create policy side_dish_requests_insert_public on public.side_dish_requests
  for insert to anon, authenticated
  with check (
    exists (
      select 1 from public.menu_items m
      where m.id = side_dish_requests.menu_item_id and lower(m.category) = 'side dishes'
    )
  );

create policy side_dish_requests_select_staff_or_admin on public.side_dish_requests
  for select to authenticated using (public.is_staff_or_admin());

-- ---------------------------------------------------------------------------
-- Storage: the public `menu-images` bucket and its admin-write / public-read policies are
-- created above. Here we only cap what the bucket accepts (matches POST /api/upload).
-- ---------------------------------------------------------------------------
update storage.buckets
set file_size_limit    = 4194304,  -- 4 MB
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id = 'menu-images';

-- ===========================================================================
-- Staff account management: RLS
-- Idempotent. If you already ran the original 002, run just this block (after the new 001 block).
-- ===========================================================================

-- A deactivated account has no role anywhere: is_admin() / is_staff_or_admin() become false, so it
-- is locked out of every RLS-protected table even while its old JWT is still valid.
create or replace function public.get_my_role()
returns text
language sql stable
security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid() and is_active
$$;

-- Same column-level guard as before, plus is_active: otherwise a deactivated user (who can still
-- update their own profile row) could simply switch themselves back on.
create or replace function public.guard_profile_update()
returns trigger
language plpgsql as $$
begin
  if auth.uid() is not null and not public.is_admin()
     and (new.role, new.is_active) is distinct from (old.role, old.is_active)
  then
    raise exception 'Only an admin can change a user''s role or active status.' using errcode = '42501';
  end if;
  return new;
end $$;

-- Admins may read and update any profile (profiles_select_self_or_admin / profiles_update_self_or_admin
-- above already cover that). They may now also insert and delete any profile.
drop policy if exists profiles_insert_admin on public.profiles;
drop policy if exists profiles_delete_admin on public.profiles;

create policy profiles_insert_admin on public.profiles
  for insert to authenticated with check (public.is_admin());

create policy profiles_delete_admin on public.profiles
  for delete to authenticated using (public.is_admin());
