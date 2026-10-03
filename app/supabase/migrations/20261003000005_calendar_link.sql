-- Calendar Links (CONTEXT.md): secret iCal addresses a Student gives the tracker. Personal Layer:
-- only the owner reads, adds or removes their own, at most five, https only. The app fetches them
-- only from a fixed list of calendar providers (app/src/lib/calendar-fetch.ts).

create table if not exists public.calendar_link (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  url        text not null check (url ~ '^https://[^\s]{10,2000}$'),
  label      text not null default '' check (length(label) <= 60),
  created_at timestamptz not null default now()
);
create index if not exists calendar_link_user on public.calendar_link (user_id);

alter table public.calendar_link enable row level security;
alter table public.calendar_link force row level security;

drop policy if exists "calendar link: owner reads" on public.calendar_link;
create policy "calendar link: owner reads" on public.calendar_link
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "calendar link: owner adds, at most five" on public.calendar_link;
create policy "calendar link: owner adds, at most five" on public.calendar_link
  for insert to authenticated
  with check (user_id = auth.uid() and (select count(*) from public.calendar_link c where c.user_id = auth.uid()) < 5);

drop policy if exists "calendar link: owner removes" on public.calendar_link;
create policy "calendar link: owner removes" on public.calendar_link
  for delete to authenticated using (user_id = auth.uid());

revoke all on public.calendar_link from anon, tracker_sync;
revoke update on public.calendar_link from authenticated;
grant select, insert, delete on public.calendar_link to authenticated;
