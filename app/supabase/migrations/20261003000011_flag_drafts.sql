-- A checker who finds a mistake in a draft can Flag it too, not only a shared Card: the draft is
-- then hidden until the Maintainer settles it, like a flagged shared Card.
drop policy if exists "flag: anyone who can see it" on public.card_flag;
create policy "flag: anyone who can see it" on public.card_flag for insert to authenticated
  with check (user_id = auth.uid() and exists (select 1 from public.card c where c.id = card_id and c.status in ('draft', 'shared')));
create or replace function public.card_after_flag() returns trigger language plpgsql security definer set search_path = '' as $$
begin update public.card set status = 'flagged' where id = new.card_id and status in ('draft', 'shared'); return null; end; $$;
