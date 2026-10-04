-- Privacy and merge test for the tracker database. Runs inside one transaction and rolls back.
-- tools/db.sh -qtA < app/supabase/tests/rls.sql
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

-- Planned Blocks merge per block by the later change, a removal included
reset role; set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
select public.save_progress('{"planned":{"p1":{"date":"2026-10-05","start":"13:00","mins":30,"at":"2026-10-03T10:00:00Z"},"p2":{"date":"2026-10-05","start":"14:00","mins":15,"at":"2026-10-03T10:00:00Z"}}}');
select public.save_progress('{"planned":{"p1":{"gone":true,"at":"2026-10-03T11:00:00Z"},"p2":{"date":"2026-10-06","start":"09:00","mins":15,"at":"2026-10-03T09:00:00Z"}}}');
select 'planned after merge: p1 gone ' || coalesce(doc->'planned'->'p1'->>'gone','false') || ', p2 still ' || (doc->'planned'->'p2'->>'date') from public.progress where user_id = '00000000-0000-0000-0000-00000000000a';

-- Calendar Links: owner only, at most five, https only
reset role; set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
do $$ begin
  begin insert into public.calendar_link (url) values ('http://calendar.google.com/plain'); raise notice 'FAIL an http link was accepted';
  exception when check_violation then raise notice 'ok https only'; end;
  begin insert into public.calendar_link (user_id, url) values ('00000000-0000-0000-0000-00000000000b', 'https://calendar.google.com/for-b'); raise notice 'FAIL a link was added for someone else';
  exception when insufficient_privilege then raise notice 'ok no links for someone else'; end;
end $$;
insert into public.calendar_link (url, label) select 'https://calendar.google.com/test-' || g, 'test' from generate_series(1, 5) g;
do $$ begin
  begin insert into public.calendar_link (url) values ('https://calendar.google.com/sixth'); raise notice 'FAIL a sixth link was accepted';
  exception when insufficient_privilege then raise notice 'ok at most five links'; end;
end $$;
select 'A sees own links: ' || count(*) from public.calendar_link;
reset role; set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
do $$ begin
  begin perform 1 from public.calendar_link; raise notice 'FAIL anon can read links';
  exception when insufficient_privilege then raise notice 'ok anon cannot read links'; end;
end $$;

-- Cards (release 4, Votes since 2026-10-04): A writes, B and C vote, M settles; A and C are in Group 8
reset role;
insert into auth.users (id, aud, role, email) values
  ('00000000-0000-0000-0000-00000000000c', 'authenticated', 'authenticated', 'c@test.invalid'),
  ('00000000-0000-0000-0000-00000000000d', 'authenticated', 'authenticated', 'm@test.invalid');
insert into public.app_maintainer values ('00000000-0000-0000-0000-00000000000d');
-- an AI draft, uploaded as the Maintainer
insert into public.card (id, kind, prompt, answer, sources, course, owner, ai_drafted) values ('10000000-0000-0000-0000-000000000003', 'concept', 'AI: what is a socket?', 'A door between process and transport', '{m:Z0025E:19918}', 'Z0025E', '00000000-0000-0000-0000-00000000000d', true);
set local role tracker_sync;
select public.record_groups('00000000-0000-0000-0000-00000000000a', '{"Z0025E": 8}');
select public.record_groups('00000000-0000-0000-0000-00000000000c', '{"Z0025E": 8}');
select public.record_groups('00000000-0000-0000-0000-00000000000b', '{"Z0025E": 3}');
reset role; set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
insert into public.card (id, kind, prompt, answer, sources, course) values ('10000000-0000-0000-0000-000000000001', 'concept', 'What does a /26 mask leave for hosts?', '62 usable addresses', '{m:Z0025E:19900}', 'Z0025E');
insert into public.card (id, kind, prompt, answer, sources, course, group_number) values ('10000000-0000-0000-0000-000000000002', 'answer', 'Reflection 3', 'Our answer', '{d:Z0025E:3043}', 'Z0025E', 8);
do $$ begin
  begin insert into public.card (kind, prompt, sources, course, ai_drafted) values ('concept', 'Fake AI card', '{m:Z0025E:1}', 'Z0025E', true); raise notice 'FAIL a Student marked a card AI-drafted';
  exception when insufficient_privilege then raise notice 'ok only the upload marks AI drafts'; end;
  begin insert into public.card (kind, prompt, sources, course, group_number) values ('answer', 'For group 3', '{d:Z0025E:3043}', 'Z0025E', 3); raise notice 'FAIL an Answer Card for another group';
  exception when insufficient_privilege then raise notice 'ok no Answer Cards for another group'; end;
  begin insert into public.card (kind, prompt, sources, course, group_number) values ('concept', 'Grouped concept', '{m:Z0025E:1}', 'Z0025E', 8); raise notice 'FAIL a grouped Concept Card';
  exception when check_violation then raise notice 'ok only Answer Cards belong to a group'; end;
  begin insert into public.card (kind, prompt, sources, course) values ('concept', 'Bad source', '{whatever}', 'Z0025E'); raise notice 'FAIL a card without a Course Plan source';
  exception when check_violation then raise notice 'ok sources must be Course Plan ids'; end;
  begin insert into public.card_vote (card_id, vote) values ('10000000-0000-0000-0000-000000000001', 'legit'); raise notice 'FAIL the writer voted on their own card';
  exception when insufficient_privilege then raise notice 'ok no voting on your own card'; end;
  begin update public.card set status = 'shared' where id = '10000000-0000-0000-0000-000000000001'; raise notice 'FAIL a Student set the status';
  exception when insufficient_privilege then raise notice 'ok status only by the rules'; end;
end $$;
-- B: sees the concepts (a draft too), not the group's answer; votes legit, cannot vote on the answer
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);
select 'B sees cards (expect concept,concept): ' || string_agg(kind, ',' order by kind) from public.card where id::text like '10000000-%';
insert into public.card_vote (card_id, vote) values ('10000000-0000-0000-0000-000000000001', 'legit');
do $$ begin
  begin insert into public.card_vote (card_id, vote) values ('10000000-0000-0000-0000-000000000002', 'legit'); raise notice 'FAIL B voted on another group''s answer';
  exception when insufficient_privilege then raise notice 'ok answers are voted inside the group'; end;
  begin insert into public.card_vote (card_id, user_id, vote) values ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-00000000000c', 'fix'); raise notice 'FAIL B voted as C';
  exception when insufficient_privilege then raise notice 'ok a vote is cast as yourself'; end;
end $$;
-- C (group 8): sees all three, votes on the answer; a review is C's alone
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000c","role":"authenticated"}', true);
select 'C sees cards (expect answer,concept,concept): ' || string_agg(kind, ',' order by kind) from public.card where id::text like '10000000-%';
insert into public.card_vote (card_id, vote) values ('10000000-0000-0000-0000-000000000002', 'legit');
insert into public.review (card_id, fsrs, due) values ('10000000-0000-0000-0000-000000000001', '{"state":1}', now());
-- B changes the vote to fix: the card stays visible to C, who sees B's vote and reason
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);
select 'B sees reviews (expect 0): ' || count(*) from public.review;
update public.card_vote set vote = 'fix', reason = 'wrong count' where card_id = '10000000-0000-0000-0000-000000000001';
do $$ begin
  update public.card_vote set vote = 'legit' where user_id = '00000000-0000-0000-0000-00000000000c';
  if found then raise notice 'FAIL B changed C''s vote'; else raise notice 'ok only your own vote changes'; end if;
end $$;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000c","role":"authenticated"}', true);
select 'C sees the concept voted fix (expect 1): ' || count(*) from public.card where id = '10000000-0000-0000-0000-000000000001';
select 'C sees votes (expect fix:wrong count,legit:): ' || string_agg(vote || ':' || reason, ',' order by vote) from public.card_vote;
-- M votes on the AI draft it uploaded, and settles the concept: its fix votes go
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000d","role":"authenticated"}', true);
insert into public.card_vote (card_id, vote) values ('10000000-0000-0000-0000-000000000003', 'legit');
select 'M voted on its AI draft (expect 1): ' || count(*) from public.card_vote where card_id = '10000000-0000-0000-0000-000000000003';
select public.settle_flag('10000000-0000-0000-0000-000000000001', true);
select 'after M keeps it, fix votes (expect 0): ' || count(*) from public.card_vote where card_id = '10000000-0000-0000-0000-000000000001' and vote = 'fix';
-- B votes again and takes it back; then A edits the concept: its votes are gone
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);
insert into public.card_vote (card_id, vote) values ('10000000-0000-0000-0000-000000000001', 'legit') on conflict (card_id, user_id) do update set vote = 'legit';
delete from public.card_vote where card_id = '10000000-0000-0000-0000-000000000003';
insert into public.card_vote (card_id, vote) values ('10000000-0000-0000-0000-000000000003', 'fix');
delete from public.card_vote where card_id = '10000000-0000-0000-0000-000000000003' and user_id = auth.uid();
select 'B took its vote back (expect 0): ' || count(*) from public.card_vote where card_id = '10000000-0000-0000-0000-000000000003' and user_id = auth.uid();
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
update public.card set answer = '62 hosts (64 minus network and broadcast)' where id = '10000000-0000-0000-0000-000000000001';
select 'after A edits, votes (expect 0): ' || (select count(*) from public.card_vote where card_id = '10000000-0000-0000-0000-000000000001');
do $$ begin
  begin perform public.settle_flag('10000000-0000-0000-0000-000000000001', false); raise notice 'FAIL a Student settled a flag';
  exception when insufficient_privilege then raise notice 'ok only the Maintainer settles flags'; end;
  begin perform public.record_groups(auth.uid(), '{"Z0025E": 3}'); raise notice 'FAIL a Student set their own group';
  exception when insufficient_privilege then raise notice 'ok groups only from Canvas'; end;
end $$;
reset role; set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
do $$ begin
  begin perform 1 from public.card; raise notice 'FAIL anon can read cards';
  exception when insufficient_privilege then raise notice 'ok anon cannot read cards'; end;
  begin perform 1 from public.card_vote; raise notice 'FAIL anon can read votes';
  exception when insufficient_privilege then raise notice 'ok anon cannot read votes'; end;
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
