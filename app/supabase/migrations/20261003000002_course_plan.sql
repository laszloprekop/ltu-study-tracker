-- Course Plan: the same for every Student, readable by anyone, Guests included. Written only by
-- the hourly sync, which runs with the service role (it bypasses row-level security); there is no
-- write policy for anyone else.

create table if not exists public.course_plan (
  id         text primary key,           -- 'current': the built plan for every Course at once
  data       jsonb not null,
  synced_at  timestamptz not null default now(),
  source     text not null default 'sync' -- 'sync' (hourly job) or 'deploy' (built into the image)
);

alter table public.course_plan enable row level security;
alter table public.course_plan force row level security;

drop policy if exists "course plan: anyone reads" on public.course_plan;
create policy "course plan: anyone reads" on public.course_plan
  for select to anon, authenticated using (true);

revoke insert, update, delete on public.course_plan from anon, authenticated;
grant select on public.course_plan to anon, authenticated;
