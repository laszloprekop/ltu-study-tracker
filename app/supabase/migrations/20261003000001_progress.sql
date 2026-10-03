-- Personal Layer, release 1: one progress document per Account, in the shape the tracker page
-- already uses ({ checked, tickAt, muted, snaps }). Only its owner can read or change it.
-- Writes go through save_progress, which merges instead of overwriting, so two devices of the
-- same Student cannot undo each other: per task id the later change wins (CONTEXT.md, Tick).

create table if not exists public.progress (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  doc        jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.progress enable row level security;
alter table public.progress force row level security;

drop policy if exists "progress: owner reads" on public.progress;
create policy "progress: owner reads" on public.progress
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "progress: owner deletes" on public.progress;
create policy "progress: owner deletes" on public.progress
  for delete to authenticated using (user_id = auth.uid());

-- No insert or update policy: direct writes are refused; save_progress is the only way in.
revoke all on public.progress from anon;
revoke insert, update on public.progress from authenticated;
grant select, delete on public.progress to authenticated;

create or replace function public.save_progress(incoming jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid      uuid := auth.uid();
  cur      jsonb;
  checked  jsonb;
  tick_at  jsonb;
  snaps    jsonb;
  inc_chk  jsonb := coalesce(incoming -> 'checked', '{}'::jsonb);
  inc_at   jsonb := coalesce(incoming -> 'tickAt', '{}'::jsonb);
  k        text;
  a_new    text;
  a_old    text;
  day      jsonb;
begin
  if uid is null then
    raise exception 'not signed in' using errcode = '28000';
  end if;
  if jsonb_typeof(incoming) is distinct from 'object' or pg_column_size(incoming) > 2000000 then
    raise exception 'bad progress document' using errcode = '22023';
  end if;

  select p.doc into cur from public.progress p where p.user_id = uid for update;
  cur     := coalesce(cur, '{}'::jsonb);
  checked := coalesce(cur -> 'checked', '{}'::jsonb);
  tick_at := coalesce(cur -> 'tickAt', '{}'::jsonb);

  -- Ticks: the later change per id wins; an id without a time can only add a tick.
  for k in select jsonb_object_keys(inc_chk || inc_at) loop
    a_new := inc_at ->> k;
    a_old := tick_at ->> k;
    if a_new is not null and (a_old is null or a_new > a_old) then
      if inc_chk ? k then checked := checked || jsonb_build_object(k, true);
      else checked := checked - k;
      end if;
      tick_at := tick_at || jsonb_build_object(k, a_new);
    elsif a_new is null and inc_chk ? k and not checked ? k then
      checked := checked || jsonb_build_object(k, true);
    end if;
  end loop;

  -- Snapshots: per day the later one wins; the "undo" slot is the device's own and is replaced.
  snaps := coalesce(cur -> 'snaps', '{}'::jsonb);
  for k, day in select key, value from jsonb_each(coalesce(incoming -> 'snaps', '{}'::jsonb)) loop
    if k = 'undo' or coalesce(day ->> 'at', '') > coalesce(snaps -> k ->> 'at', '') then
      snaps := snaps || jsonb_build_object(k, day);
    end if;
  end loop;

  insert into public.progress as p (user_id, doc, updated_at)
  values (uid, jsonb_build_object(
            'checked', checked,
            'tickAt',  tick_at,
            'muted',   coalesce(incoming -> 'muted', cur -> 'muted', '{}'::jsonb),
            'snaps',   snaps,
            'updated', now()),
          now())
  on conflict (user_id) do update set doc = excluded.doc, updated_at = excluded.updated_at;
end;
$$;

revoke all on function public.save_progress(jsonb) from public, anon;
grant execute on function public.save_progress(jsonb) to authenticated;
