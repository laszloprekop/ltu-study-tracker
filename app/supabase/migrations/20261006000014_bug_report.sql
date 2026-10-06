-- Bug reports from the page's footer form. Anyone may send one, a Guest too; only the Maintainer
-- reads them. A sender sets the answers and nothing else: id, time, sender and status come from
-- the defaults (column grants below). The sender is kept only as an id, and cleared when the
-- account is deleted.

create table if not exists public.bug_report (
  id       uuid primary key default gen_random_uuid(),
  at       timestamptz not null default now(),
  user_id  uuid default auth.uid() references auth.users (id) on delete set null,
  did      text not null default '' check (length(did) <= 1500),
  expected text not null default '' check (length(expected) <= 1500),
  happened text not null check (length(btrim(happened)) between 1 and 1500),
  contact  text not null default '' check (length(contact) <= 200),
  version  text not null default '' check (length(version) <= 20),
  route    text not null default '' check (length(route) <= 300),
  context  jsonb not null default '{}' check (pg_column_size(context) <= 2000),
  status   text not null default 'new' check (status in ('new', 'done'))
);
alter table public.bug_report enable row level security;
alter table public.bug_report force row level security;

drop policy if exists "bug: send" on public.bug_report;
create policy "bug: send" on public.bug_report for insert to anon, authenticated with check (true);
drop policy if exists "bug: maintainer reads" on public.bug_report;
create policy "bug: maintainer reads" on public.bug_report for select to authenticated using (public.is_maintainer());
drop policy if exists "bug: maintainer settles" on public.bug_report;
create policy "bug: maintainer settles" on public.bug_report for update to authenticated using (public.is_maintainer()) with check (public.is_maintainer());

revoke all on public.bug_report from anon, authenticated, tracker_sync;
grant insert (did, expected, happened, contact, version, route, context) on public.bug_report to anon, authenticated;
grant select on public.bug_report to authenticated;
grant update (status) on public.bug_report to authenticated;

-- A flood guard: the form is open to anyone, so no more than 30 reports an hour in all.
create or replace function public.bug_report_limit() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if (select count(*) from public.bug_report where at > now() - interval '1 hour') >= 30 then
    raise exception 'too many reports this hour' using errcode = '53400';
  end if;
  return new;
end $$;
drop trigger if exists bug_report_limit on public.bug_report;
create trigger bug_report_limit before insert on public.bug_report for each row execute function public.bug_report_limit();
