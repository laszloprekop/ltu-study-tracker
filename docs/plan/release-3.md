# Release 3: the Day Plan

Done 2026-10-03, in the Day view (no new view): one day of both Courses in 15-minute slots.

- Fixed: sessions with a time, the Student's Calendar Events, their Group's booked lab slot, and
  deadlines as a line at their time.
- Free Slots: the gaps inside the Student's working hours (the clock setting), as dashed slots.
- Unplaced this week: unfinished tasks (30 min) and material (its estimate, rounded up to 15 min,
  20 min when unknown), each with a hint, the first Free Slot long enough. "Place at" puts it
  there; on a computer it can also be dragged onto any Free Slot, and a drop where it does not fit
  is refused. The tracker never places anything by itself (CONTEXT.md, Free Slot).
- Planned Blocks are kept with the Ticks (localStorage, the account copy, Export Codes) and merge
  between devices per block by the later change, a removal included (migration 007, tested in
  `app/supabase/tests/rls.sql`). A Planned Block whose item is done is shown struck through.

Not yet: group-wide free time (needs every member's day), moving a placed block by dragging it.
