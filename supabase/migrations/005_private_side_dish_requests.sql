-- 005: Side-dish requests can only be recorded by signed-in staff or admin (FR-13).

-- 1. The recording function now refuses anyone who is not staff or admin.
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
  where id = p_menu_item_id and lower(category) = 'side dishes';
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

-- 2. The table itself no longer accepts requests from the public either.
drop policy if exists side_dish_requests_insert_public on public.side_dish_requests;
drop policy if exists side_dish_requests_insert_staff_or_admin on public.side_dish_requests;

create policy side_dish_requests_insert_staff_or_admin on public.side_dish_requests
  for insert to authenticated
  with check (
    public.is_staff_or_admin()
    and exists (
      select 1 from public.menu_items m
      where m.id = side_dish_requests.menu_item_id and lower(m.category) = 'side dishes'
    )
  );