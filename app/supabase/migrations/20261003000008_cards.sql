-- Release 4: study Cards (CONTEXT.md, Cards; ADR 0002 and 0003). Every rule is in the database:
-- policies decide who reads and writes, triggers move a Card between draft, shared and flagged.

-- Who settles Flags. Filled by hand; nobody can read or write it through the API.
create table if not exists public.app_maintainer (user_id uuid primary key references auth.users (id) on delete cascade);
alter table public.app_maintainer enable row level security;
alter table public.app_maintainer force row level security;
revoke all on public.app_maintainer from anon, authenticated, tracker_sync;
create or replace function public.is_maintainer() returns boolean language sql stable security definer set search_path = ''
  as $$ select exists (select 1 from public.app_maintainer where user_id = auth.uid()) $$;

-- A Student's Group per Course, as Canvas said. Written only by the app (record_groups, as
-- tracker_sync) after it read Canvas with the Student's own token; read by its owner.
create table if not exists public.group_member (
  user_id      uuid not null references auth.users (id) on delete cascade,
  course       text not null check (course ~ '^[A-Z][0-9]{4}E$'),
  group_number int  not null check (group_number between 1 and 99),
  verified_at  timestamptz not null default now(),
  primary key (user_id, course)
);
alter table public.group_member enable row level security;
alter table public.group_member force row level security;
drop policy if exists "group member: owner reads" on public.group_member;
create policy "group member: owner reads" on public.group_member for select to authenticated using (user_id = auth.uid());
revoke all on public.group_member from anon, tracker_sync;
revoke insert, update, delete on public.group_member from authenticated;
grant select on public.group_member to authenticated;

create or replace function public.in_group(c text, g int) returns boolean language sql stable security definer set search_path = ''
  as $$ select exists (select 1 from public.group_member where user_id = auth.uid() and course = c and group_number = g) $$;

create or replace function public.record_groups(student uuid, groups jsonb) returns void language plpgsql security definer set search_path = '' as $$
declare k text; v jsonb;
begin
  if jsonb_typeof(groups) is distinct from 'object' then raise exception 'bad groups' using errcode = '22023'; end if;
  for k, v in select key, value from jsonb_each(groups) loop
    if k ~ '^[A-Z][0-9]{4}E$' and jsonb_typeof(v) = 'number' and (v::int) between 1 and 99 then
      insert into public.group_member (user_id, course, group_number, verified_at) values (student, k, v::int, now())
      on conflict (user_id, course) do update set group_number = excluded.group_number, verified_at = excluded.verified_at;
    end if;
  end loop;
end; $$;
revoke all on function public.record_groups(uuid, jsonb) from public, anon, authenticated;
grant execute on function public.record_groups(uuid, jsonb) to tracker_sync;

create table if not exists public.card (
  id           uuid primary key default gen_random_uuid(),
  kind         text not null check (kind in ('concept', 'question', 'answer')),
  prompt       text not null check (length(prompt) between 3 and 2000),
  answer       text not null default '' check (length(answer) <= 4000),
  sources      text[] not null check (cardinality(sources) between 1 and 10),
  course       text not null check (course ~ '^[A-Z][0-9]{4}E$'),
  group_number int check (group_number between 1 and 99),
  owner        uuid not null default auth.uid() references auth.users (id) on delete cascade,
  ai_drafted   boolean not null default false,
  status       text not null default 'draft' check (status in ('draft', 'shared', 'flagged')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  -- Only an Answer Card may belong to a Group; ADR 0002.
  check (kind = 'answer' or group_number is null)
);
create index if not exists card_course on public.card (course, status);

create table if not exists public.card_check (
  card_id uuid not null references public.card (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  at      timestamptz not null default now(),
  primary key (card_id, user_id)
);
create table if not exists public.card_flag (
  card_id uuid not null references public.card (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  reason  text not null default '' check (length(reason) <= 500),
  at      timestamptz not null default now(),
  primary key (card_id, user_id)
);
create table if not exists public.review (
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  card_id    uuid not null references public.card (id) on delete cascade,
  fsrs       jsonb not null,
  due        timestamptz not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, card_id)
);

-- Sources must be Course Plan ids: d: (assessment), m: (module item), t: (task).
create or replace function public.card_sources_ok(s text[]) returns boolean language sql immutable set search_path = ''
  as $$ select coalesce(bool_and(x ~ '^[dmt]:[A-Z][0-9]{4}E:[A-Za-z0-9:._-]{1,80}$'), false) from unnest(s) x $$;
alter table public.card drop constraint if exists card_sources_valid;
alter table public.card add constraint card_sources_valid check (public.card_sources_ok(sources));

-- Who may see a Card.
create or replace function public.can_see_card(c public.card) returns boolean language sql stable security definer set search_path = '' as $$
  select c.owner = auth.uid()
      or public.is_maintainer()
      or (c.kind in ('concept', 'question') and c.status <> 'flagged')
      or (c.kind = 'answer' and c.group_number is not null and c.status <> 'flagged' and public.in_group(c.course, c.group_number))
$$;

alter table public.card enable row level security;   alter table public.card force row level security;
alter table public.card_check enable row level security; alter table public.card_check force row level security;
alter table public.card_flag enable row level security;  alter table public.card_flag force row level security;
alter table public.review enable row level security;     alter table public.review force row level security;

drop policy if exists "card: who may see" on public.card;
create policy "card: who may see" on public.card for select to authenticated using (public.can_see_card(card));
drop policy if exists "card: owner adds" on public.card;
create policy "card: owner adds" on public.card for insert to authenticated
  with check (owner = auth.uid() and status = 'draft' and not ai_drafted and (group_number is null or public.in_group(course, group_number)));
drop policy if exists "card: owner edits" on public.card;
create policy "card: owner edits" on public.card for update to authenticated using (owner = auth.uid()) with check (owner = auth.uid() and (group_number is null or public.in_group(course, group_number)));
drop policy if exists "card: owner removes" on public.card;
create policy "card: owner removes" on public.card for delete to authenticated using (owner = auth.uid() or public.is_maintainer());

drop policy if exists "check: read" on public.card_check;
create policy "check: read" on public.card_check for select to authenticated using (exists (select 1 from public.card c where c.id = card_id));
drop policy if exists "check: someone else, who can see it" on public.card_check;
create policy "check: someone else, who can see it" on public.card_check for insert to authenticated
  with check (user_id = auth.uid() and exists (select 1 from public.card c where c.id = card_id and c.owner <> auth.uid() and c.status = 'draft'
                and (c.kind <> 'answer' or (c.group_number is not null and public.in_group(c.course, c.group_number)))));

drop policy if exists "flag: maintainer reads" on public.card_flag;
create policy "flag: maintainer reads" on public.card_flag for select to authenticated using (public.is_maintainer() or user_id = auth.uid());
drop policy if exists "flag: anyone who can see it" on public.card_flag;
create policy "flag: anyone who can see it" on public.card_flag for insert to authenticated
  with check (user_id = auth.uid() and exists (select 1 from public.card c where c.id = card_id and c.status = 'shared'));

drop policy if exists "review: owner" on public.review;
create policy "review: owner" on public.review for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid() and exists (select 1 from public.card c where c.id = card_id));

revoke all on public.card, public.card_check, public.card_flag, public.review from anon, tracker_sync;
grant select, insert, update, delete on public.card to authenticated;
grant select, insert on public.card_check, public.card_flag to authenticated;
grant select, insert, update, delete on public.review to authenticated;
-- A Student can edit what a Card says, never who made it, its status or whether AI drafted it.
revoke update on public.card from authenticated;
grant update (kind, prompt, answer, sources, course, group_number) on public.card to authenticated;

-- Status, kept by triggers.
create or replace function public.card_after_check() returns trigger language plpgsql security definer set search_path = '' as $$
begin update public.card set status = 'shared' where id = new.card_id and status = 'draft'; return null; end; $$;
drop trigger if exists card_after_check on public.card_check;
create trigger card_after_check after insert on public.card_check for each row execute function public.card_after_check();

create or replace function public.card_after_flag() returns trigger language plpgsql security definer set search_path = '' as $$
begin update public.card set status = 'flagged' where id = new.card_id and status = 'shared'; return null; end; $$;
drop trigger if exists card_after_flag on public.card_flag;
create trigger card_after_flag after insert on public.card_flag for each row execute function public.card_after_flag();

create or replace function public.card_before_edit() returns trigger language plpgsql set search_path = '' as $$
begin
  if (new.prompt, new.answer, new.sources, new.kind, new.course, new.group_number) is distinct from (old.prompt, old.answer, old.sources, old.kind, old.course, old.group_number) then
    new.status := 'draft'; new.updated_at := now();
    delete from public.card_check where card_id = old.id;
    delete from public.card_flag where card_id = old.id;
  end if;
  return new;
end; $$;
drop trigger if exists card_before_edit on public.card;
create trigger card_before_edit before update on public.card for each row execute function public.card_before_edit();

-- The Maintainer settles a Flag: keep the Card (shared again) or remove it.
create or replace function public.settle_flag(card uuid, keep boolean) returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_maintainer() then raise exception 'maintainer only' using errcode = '42501'; end if;
  if keep then delete from public.card_flag where card_id = card; update public.card set status = 'shared' where id = card;
  else delete from public.card where id = card; end if;
end; $$;
revoke all on function public.settle_flag(uuid, boolean) from public, anon, tracker_sync;
grant execute on function public.settle_flag(uuid, boolean) to authenticated;
revoke all on function public.is_maintainer() from public, anon;
revoke all on function public.in_group(text, int) from public, anon;
revoke all on function public.can_see_card(public.card) from public, anon;
grant execute on function public.is_maintainer(), public.in_group(text, int), public.can_see_card(public.card) to authenticated;
