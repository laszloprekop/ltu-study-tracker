-- Privacy and merge test for the tracker database. Runs inside one transaction and rolls back.
-- ssh root@157.90.168.58 'docker exec -i supabase-db-aqhq0ki76r5bniaurku9xpzf psql -U postgres -qtA' < app/supabase/tests/rls.sql
-- Every line printed should read 'ok ...' or show the expected value; any 'FAIL' is a broken rule.
\set ON_ERROR_STOP 1
begin;
insert into auth.users (id, aud, role, email) values
  ('00000000-0000-0000-0000-00000000000a', 'authenticated', 'authenticated', 'a@test.invalid'),
  ('00000000-0000-0000-0000-00000000000b', 'authenticated', 'authenticated', 'b@test.invalid');
insert into public.course_plan (id, data) values ('rls-test', '{"x":1}');

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

-- The sync role: reads the token, writes the plan, sees nothing personal
reset role;
grant tracker_sync to postgres;  -- only so this test can act as the sync; rolled back below
select vault.create_secret('test-token-not-real', 'canvas_sync_token_test');
set local role tracker_sync;
select set_config('request.jwt.claims', '{"role":"tracker_sync"}', true);
select 'sync stores plan at: ' || (public.store_course_plan('{"plan":{},"inventory":{},"private":false,"progress":null}') is not null);
do $$ begin
  begin perform public.store_course_plan('{"plan":{},"inventory":{},"private":true,"progress":{"x":1}}'); raise notice 'FAIL private plan accepted';
  exception when invalid_parameter_value then raise notice 'ok private plan refused'; end;
  begin perform 1 from public.progress; raise notice 'FAIL sync can read progress';
  exception when insufficient_privilege then raise notice 'ok sync cannot read progress'; end;
  begin perform 1 from vault.decrypted_secrets; raise notice 'FAIL sync can read all of vault';
  exception when insufficient_privilege then raise notice 'ok sync cannot read vault directly'; end;
end $$;
reset role; set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
do $$ begin
  begin perform public.sync_canvas_token(); raise notice 'FAIL a Student can read the sync token';
  exception when insufficient_privilege then raise notice 'ok a Student cannot read the sync token'; end;
  begin perform public.store_course_plan('{"plan":{},"inventory":{}}'); raise notice 'FAIL a Student can write the plan';
  exception when insufficient_privilege then raise notice 'ok a Student cannot write the plan'; end;
end $$;

-- Deleting one's own account removes it and its progress, and nobody else's
reset role; set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);
select public.save_progress('{"checked":{"t:b":true},"tickAt":{"t:b":"2026-10-03T10:00:00Z"}}');
select public.delete_my_account();
reset role;
select 'after B deletes: B users ' || (select count(*) from auth.users where id = '00000000-0000-0000-0000-00000000000b') || ', B progress ' || (select count(*) from public.progress where user_id = '00000000-0000-0000-0000-00000000000b') || ', A users ' || (select count(*) from auth.users where id = '00000000-0000-0000-0000-00000000000a') || ', A progress ' || (select count(*) from public.progress where user_id = '00000000-0000-0000-0000-00000000000a');
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
do $$ begin
  begin perform public.delete_my_account(); raise notice 'FAIL anon can call delete';
  exception when insufficient_privilege then raise notice 'ok anon cannot call delete'; end;
end $$;

reset role;
select 'A row still there after B delete: ' || count(*) from public.progress where user_id = '00000000-0000-0000-0000-00000000000a';
rollback;
