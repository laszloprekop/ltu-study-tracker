-- Privacy and merge test for the tracker database. Runs inside one transaction and rolls back.
-- ssh root@157.90.168.58 'docker exec -i supabase-db-aqhq0ki76r5bniaurku9xpzf psql -U postgres -qtA' < app/supabase/tests/rls.sql
-- Every line printed should read 'ok ...' or show the expected value; any 'FAIL' is a broken rule.
\set ON_ERROR_STOP 1
begin;
insert into auth.users (id, aud, role, email) values
  ('00000000-0000-0000-0000-00000000000a', 'authenticated', 'authenticated', 'a@test.invalid'),
  ('00000000-0000-0000-0000-00000000000b', 'authenticated', 'authenticated', 'b@test.invalid');
insert into public.course_plan (id, data) values ('current', '{"x":1}');

-- Student A saves, as the page would
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
select public.save_progress('{"checked":{"t:a":true,"t:old":true},"tickAt":{"t:a":"2026-10-02T10:00:00Z"},"muted":{},"snaps":{}}');
-- an older untick from another device must not win; a newer one must
select public.save_progress('{"checked":{},"tickAt":{"t:a":"2026-10-01T10:00:00Z"}}');
select 'A after older clear: t:a ' || coalesce((doc->'checked'->>'t:a'),'gone') from public.progress;
select public.save_progress('{"checked":{},"tickAt":{"t:a":"2026-10-03T10:00:00Z"}}');
select 'A after newer clear: t:a ' || coalesce((doc->'checked'->>'t:a'),'gone') || ', untimed t:old ' || coalesce((doc->'checked'->>'t:old'),'gone') from public.progress;
-- direct writes are refused
do $$ begin
  begin insert into public.progress (user_id, doc) values (auth.uid(), '{}'); raise notice 'FAIL direct insert allowed';
  exception when insufficient_privilege then raise notice 'ok direct insert refused'; end;
  begin update public.progress set doc = '{}'; raise notice 'FAIL direct update allowed';
  exception when insufficient_privilege then raise notice 'ok direct update refused'; end;
  begin insert into public.course_plan (id, data) values ('evil', '{}'); raise notice 'FAIL course_plan write allowed';
  exception when insufficient_privilege then raise notice 'ok course_plan write refused'; end;
end $$;

-- Student B sees nothing of A, and cannot delete it
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);
select 'B sees rows: ' || count(*) from public.progress;
delete from public.progress where user_id = '00000000-0000-0000-0000-00000000000a';
select 'B sees course plan rows: ' || count(*) from public.course_plan;

-- a Guest (anon) sees the Course Plan, no progress, and cannot save
reset role; set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
select 'anon sees course plan rows: ' || count(*) from public.course_plan;
do $$ begin
  begin perform 1 from public.progress; raise notice 'FAIL anon can read progress';
  exception when insufficient_privilege then raise notice 'ok anon cannot read progress'; end;
  begin perform public.save_progress('{}'); raise notice 'FAIL anon can save';
  exception when insufficient_privilege then raise notice 'ok anon cannot save'; end;
end $$;

reset role;
select 'A row still there after B delete: ' || count(*) from public.progress where user_id = '00000000-0000-0000-0000-00000000000a';
rollback;
