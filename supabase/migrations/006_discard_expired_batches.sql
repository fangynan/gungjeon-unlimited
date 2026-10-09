-- 006: Discard expired inventory batches (an extra, not an SRS requirement).

-- 1. The activity log may now record "discarded".
alter table public.inventory_logs drop constraint if exists inventory_logs_type_check;
alter table public.inventory_logs
  add constraint inventory_logs_type_check
  check (change_type in ('added', 'used', 'adjusted', 'discarded'));

-- 2. Discard clears one expired batch (quantity 0, status depleted).
--    The existing log trigger records it as "discarded".
create or replace function public.discard_inventory_batch(p_batch_id uuid)
returns setof public.inventory_batches
language plpgsql as $$
begin
  perform set_config('app.change_type', 'discarded', true);
  return query
  with u as (
    update public.inventory_batches
    set quantity = 0, status = 'depleted'
    where id = p_batch_id
      and quantity > 0
      and status <> 'depleted'
      and expiration_date < public.restaurant_today()
    returning *
  )
  select * from u;
end $$;

revoke execute on function public.discard_inventory_batch(uuid) from public, anon;
grant  execute on function public.discard_inventory_batch(uuid) to authenticated;