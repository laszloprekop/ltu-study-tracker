-- Group Links (CONTEXT.md): a page one Group shares with its own members, such as its lab archive,
-- listed in the page's Resources menu. A row names the Group by its number and the Courses it covers;
-- only a Student whom Canvas confirmed in that Group in every one of those Courses reads it (in_group,
-- migration 008). No Student writes here: the Maintainer adds rows over SSH (docs/maintaining.md), so
-- the addresses stay out of this public repo and out of the page.

create table if not exists public.group_link (
  id           uuid primary key default gen_random_uuid(),
  courses      text[] not null check (cardinality(courses) between 1 and 5),
  group_number int  not null check (group_number between 1 and 99),
  title        text not null check (length(btrim(title)) between 1 and 120),
  summary      text not null default '' check (length(summary) <= 600),
  url          text not null check (url ~ '^https://\S+$' and length(url) <= 500),
  created_at   timestamptz not null default now()
);
alter table public.group_link enable row level security;
alter table public.group_link force row level security;

drop policy if exists "group link: members read" on public.group_link;
create policy "group link: members read" on public.group_link for select to authenticated
  using (not exists (select 1 from unnest(courses) c where not public.in_group(c, group_number)));

revoke all on public.group_link from anon, authenticated, tracker_sync;
grant select on public.group_link to authenticated;
