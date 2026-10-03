-- A Student deletes everything the tracker keeps about them: their account in auth.users, which
-- removes their progress row with it (on delete cascade) and Supabase's own identity and session
-- rows. Only ever their own: the function takes no argument and uses auth.uid().

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'not signed in' using errcode = '28000';
  end if;
  delete from public.progress where user_id = uid;
  delete from auth.users where id = uid;
end;
$$;

revoke all on function public.delete_my_account() from public, anon, tracker_sync;
grant execute on function public.delete_my_account() to authenticated;
