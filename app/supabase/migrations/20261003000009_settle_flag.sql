-- Fixes 20261003000008: settle_flag's parameter was named like the card table, which made its
-- statements ambiguous. Same behaviour, parameter renamed.
drop function if exists public.settle_flag(uuid, boolean);
create function public.settle_flag(target uuid, keep boolean) returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_maintainer() then raise exception 'maintainer only' using errcode = '42501'; end if;
  if keep then
    delete from public.card_flag f where f.card_id = target;
    update public.card c set status = 'shared' where c.id = target;
  else
    delete from public.card c where c.id = target;
  end if;
end; $$;
revoke all on function public.settle_flag(uuid, boolean) from public, anon, tracker_sync;
grant execute on function public.settle_flag(uuid, boolean) to authenticated;
