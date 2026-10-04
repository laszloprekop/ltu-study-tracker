-- Cards for everyone, with public Votes (CONTEXT.md: Vote). Every Concept and Question Card is seen by
-- every signed-in Student from the start, whatever its status; Answer Cards stay inside their Group
-- (ADR 0002). Each Student may cast one Vote per Card, "legit" or "fix" (with an optional reason),
-- change it or take it back; everyone sees the Votes. They replace the Check and the Flag: the old
-- rows are carried over and the two tables are no longer written by the page.

create table if not exists public.card_vote (
  card_id uuid not null references public.card (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  vote    text not null check (vote in ('legit', 'fix')),
  reason  text not null default '' check (length(reason) <= 500),
  at      timestamptz not null default now(),
  primary key (card_id, user_id)
);
alter table public.card_vote enable row level security;
alter table public.card_vote force row level security;

insert into public.card_vote (card_id, user_id, vote, at)
  select card_id, user_id, 'legit', at from public.card_check on conflict do nothing;
insert into public.card_vote (card_id, user_id, vote, reason, at)
  select card_id, user_id, 'fix', reason, at from public.card_flag
  on conflict (card_id, user_id) do update set vote = 'fix', reason = excluded.reason, at = excluded.at;

-- Who may see a Card: no longer hidden while a draft or flagged.
create or replace function public.can_see_card(c public.card) returns boolean language sql stable security definer set search_path = '' as $$
  select c.owner = auth.uid()
      or public.is_maintainer()
      or c.kind in ('concept', 'question')
      or (c.kind = 'answer' and c.group_number is not null and public.in_group(c.course, c.group_number))
$$;

-- Votes are public among those who can see the Card (the subquery runs under the card's own policy).
-- A Student may not vote on a Card they wrote; an AI draft has no human writer, so its uploader may.
drop policy if exists "vote: read" on public.card_vote;
create policy "vote: read" on public.card_vote for select to authenticated
  using (exists (select 1 from public.card c where c.id = card_id));
drop policy if exists "vote: cast" on public.card_vote;
create policy "vote: cast" on public.card_vote for insert to authenticated
  with check (user_id = auth.uid() and exists (select 1 from public.card c where c.id = card_id and (c.owner <> auth.uid() or c.ai_drafted)));
drop policy if exists "vote: change" on public.card_vote;
create policy "vote: change" on public.card_vote for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and exists (select 1 from public.card c where c.id = card_id and (c.owner <> auth.uid() or c.ai_drafted)));
drop policy if exists "vote: take back" on public.card_vote;
create policy "vote: take back" on public.card_vote for delete to authenticated using (user_id = auth.uid());

revoke all on public.card_vote from anon, tracker_sync;
grant select, insert, delete on public.card_vote to authenticated;
grant update (vote, reason, at) on public.card_vote to authenticated;

-- Editing what a Card says drops its Votes too: they were about the old text.
create or replace function public.card_before_edit() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if (new.prompt, new.answer, new.sources, new.kind, new.course, new.group_number) is distinct from (old.prompt, old.answer, old.sources, old.kind, old.course, old.group_number) then
    new.status := 'draft'; new.updated_at := now();
    delete from public.card_check where card_id = old.id;
    delete from public.card_flag where card_id = old.id;
    delete from public.card_vote where card_id = old.id;
  end if;
  return new;
end; $$;

-- The Maintainer settles a Card voted "fix": keep it (its fix Votes go) or remove it.
create or replace function public.settle_flag(target uuid, keep boolean) returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_maintainer() then raise exception 'maintainer only' using errcode = '42501'; end if;
  if keep then
    delete from public.card_flag f where f.card_id = target;
    delete from public.card_vote v where v.card_id = target and v.vote = 'fix';
    update public.card c set status = 'shared' where c.id = target;
  else
    delete from public.card c where c.id = target;
  end if;
end; $$;
