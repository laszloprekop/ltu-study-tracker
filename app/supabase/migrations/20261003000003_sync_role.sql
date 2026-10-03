-- The hourly Course Plan sync (ADR 0001). It runs with its own role, tracker_sync, which can do
-- exactly two things: read the Maintainer's Canvas Sync Token from Vault, and replace the Course
-- Plan. It holds no service-role key, so a leak of the app's sync credentials exposes the Sync
-- Token (revocable in Canvas, and expiring) and lets someone overwrite a plan the next sync
-- rewrites, nothing else. The token itself is stored with vault.create_secret, never in a table
-- or an environment variable; see tools/set-sync-token.sh.

do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'tracker_sync') then
    create role tracker_sync nologin noinherit;
  end if;
end $$;
-- PostgREST switches to this role when a request carries a JWT with "role": "tracker_sync".
grant tracker_sync to authenticator;
grant usage on schema public to tracker_sync;

create or replace function public.sync_canvas_token()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select decrypted_secret from vault.decrypted_secrets where name = 'canvas_sync_token' limit 1;
$$;

create or replace function public.store_course_plan(plan jsonb)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare at timestamptz := now();
begin
  if jsonb_typeof(plan) is distinct from 'object' or not (plan ? 'plan' and plan ? 'inventory') then
    raise exception 'not a course plan' using errcode = '22023';
  end if;
  -- The shared plan must never carry anyone's Canvas completion state.
  if coalesce((plan ->> 'private')::boolean, false) or jsonb_typeof(plan -> 'progress') not in ('null') then
    raise exception 'refusing a private plan' using errcode = '22023';
  end if;
  insert into public.course_plan as c (id, data, synced_at, source)
  values ('current', plan, at, 'sync')
  on conflict (id) do update set data = excluded.data, synced_at = excluded.synced_at, source = excluded.source;
  return at;
end;
$$;

revoke all on function public.sync_canvas_token() from public, anon, authenticated;
revoke all on function public.store_course_plan(jsonb) from public, anon, authenticated;
grant execute on function public.sync_canvas_token() to tracker_sync;
grant execute on function public.store_course_plan(jsonb) to tracker_sync;
