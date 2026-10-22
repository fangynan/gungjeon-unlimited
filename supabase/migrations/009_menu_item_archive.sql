-- 009: Menu items are archived, never deleted.
--   Archived = hidden from the public site, still listed (under "Archived") in Menu Management,
--   and its side-dish request history stays intact. Safe to re-run.

-- 1. The flag.
alter table public.menu_items
  add column if not exists is_archived boolean not null default false;

create index if not exists menu_items_is_archived_idx on public.menu_items (is_archived);

-- 2. Visitors (anon) can no longer read archived items at the database level either.
--    Signed-in staff/admin still can, so history such as "Recent Requests" keeps its dish names.
drop policy if exists menu_items_select_public on public.menu_items;
create policy menu_items_select_public on public.menu_items
  for select to anon, authenticated
  using (not is_archived or public.is_staff_or_admin());

-- 3. Nobody deletes menu items through the app any more.
drop policy if exists menu_items_delete_admin on public.menu_items;

-- 4. An archived side dish can no longer be recorded as requested.
create or replace function public.log_side_dish_request(p_menu_item_id uuid, p_table_id uuid default null)
returns setof public.side_dish_requests
language plpgsql
security definer set search_path = public as $$
declare
  v_row public.side_dish_requests;
begin
  if not public.is_staff_or_admin() then
    raise exception 'Only staff or admin can record side dish requests.' using errcode = '42501';
  end if;

  update public.menu_items
  set views_count = views_count + 1
  where id = p_menu_item_id and lower(category) = 'side dishes' and not is_archived;
  if not found then
    return;
  end if;

  insert into public.side_dish_requests (menu_item_id, table_id)
  values (p_menu_item_id, p_table_id)
  returning * into v_row;

  return next v_row;
end $$;

revoke execute on function public.log_side_dish_request(uuid, uuid) from public, anon;
grant  execute on function public.log_side_dish_request(uuid, uuid) to authenticated;
