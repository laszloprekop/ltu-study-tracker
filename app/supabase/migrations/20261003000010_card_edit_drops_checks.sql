-- Fixes 20261003000008: editing a Card must drop its Checks and Flags, but the trigger ran with
-- the editing Student's rights, which may not delete them, so row-level security quietly removed
-- nothing. It now runs as its owner, like the other card triggers.
create or replace function public.card_before_edit() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if (new.prompt, new.answer, new.sources, new.kind, new.course, new.group_number) is distinct from (old.prompt, old.answer, old.sources, old.kind, old.course, old.group_number) then
    new.status := 'draft'; new.updated_at := now();
    delete from public.card_check where card_id = old.id;
    delete from public.card_flag where card_id = old.id;
  end if;
  return new;
end; $$;
