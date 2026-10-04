# Release 4: study Cards

Done 2026-10-03. Rules tested in `app/supabase/tests/rls.sql` (25 checks, four made-up
Students); the view tested in the browser with a stand-in for the database and real FSRS, not yet
with a real session. 20 AI-drafted Concept Cards uploaded unchecked
(`data/cards/2026-10-03-ip-and-patterns.json`). Groups for Answer Cards are recorded when a
signed-in Student reads Canvas with their own token.

Goal: before every lab and exam a Student drills Cards made from the material that prepares for it,
with spaced repetition aimed at the day of the event. Terms as in `CONTEXT.md` (Cards section);
ADR 0002 (graded answers stay in the Group) and ADR 0003 (privacy in the database). Hosted app only.

## Data (`app/supabase/migrations/…_cards.sql`)

| Table | What | Who reads | Who writes |
|---|---|---|---|
| `card` | kind (concept, question, answer), prompt, answer, Sources (Course Plan ids), course, Group number for an Answer Card, owner, AI-drafted, status (draft, shared, flagged) | concept and question: every signed-in Student unless flagged; answer: its owner, or the members of its Group | owner, while not shared; an edit makes it a draft again |
| `card_check` | one Check by a Student other than the owner | signed in | anyone but the owner; for an Answer Card only its Group |
| `card_flag` | a Flag with an optional reason | the Maintainer | any signed-in Student |
| `review` | the Student's FSRS state per Card | owner | owner |
| `group_member` | a Student's Group per Course, as Canvas said | owner | only the app, after reading Canvas with the Student's own token (the `tracker_sync` role) |
| `app_maintainer` | who settles Flags | nobody but the database | by hand |

Rules in triggers, so no page can skip them: the first Check makes a draft shared; a Flag makes a
shared Card flagged; editing a shared or flagged Card makes it a draft again and drops its Checks;
the Maintainer settles a Flag (`settle_flag`).

## Drafting (step 2 of the plan's Q20: on the Maintainer's machine first)

`tools/cards/upload.mjs <file.json>` sends drafted Cards to the database over SSH as the
Maintainer, marked AI-drafted and unchecked. The drafts are written with Claude in the repo; every
Card names its Sources. Students can also write Cards by hand in the app.

Since 2026-10-04 a module's Cards are drafted from what the module teaches, not from its page titles:

1. `node tools/cards/material.mjs <course> <module>...` downloads the module as text into
   `cache/course-material/` (git-ignored: LTU's material, and the repo is public): every page and
   discussion with its Check Your Understanding questions, the slide PDFs as text, the lecture
   transcripts, the captions of embedded YouTube lectures, and `objectives.md`, the overview's
   Learning Objectives and Study Guide.
2. The overview sets the scope: at least one Card per Learning Objective and per Study Guide focus
   question, and one per comparison the "Before you take the Module N Quiz" note asks for. Then the
   concepts the slides and lectures spend most time on.
3. Answers follow the slides and transcripts; where they disagree, the slides (the teacher's) win
   and the disagreement is noted. A Card answering a focus question also names the overview as a
   Source.
4. `docs/cards/<course>-m<N>-coverage.md` records the audit: each objective and focus question, the
   Cards covering it, and corrections to earlier Cards. Only our own wording is committed.
5. The textbook exercises the pages link (Knowledge Checks, interactive problems on
   gaia.cs.umass.edu, cached by the same tool) get hint Cards: how to recognise and approach each
   kind of question, the formula with every symbol explained, the traps; never the answers or a
   solved copy of the exercise. Prompts start "Knowledge Check, <title>:" or "Interactive problem,
   <title>:", and the coverage file lists them under Textbook exercises.
6. `node tools/cards/upload.mjs <file> --dry-run` checks the file; then upload.

The first 49 drafts (2026-10-03) predate this; the coverage files list what they missed.

## The Cards view

Redesigned 2026-10-03: Cards are real cards in a grid, rectangles with the page's cut top-right
corner. A click (or Enter) turns a card over on its vertical axis: the question on the front, the
answer, its Sources and the ratings on the back. Filters: Due now, one per Card Set, All. To check
and Flagged are grids too. Buttons, fields and tags added since release 2 lost their rounded
corners and take the cut corner, like the page's own controls.

Cards have a playing card's proportions (5 to 7, at least 300 by 420). An answer may use a few
marks, applied after escaping so no HTML gets through: `- ` and `1. ` lines for lists, backticks
for `code`, `**term**`, and one `Key:` line, which is pinned below the scrolling answer so the
one thing to remember always shows. The answer's opening line is set as its title (larger, in Archivo);
a hint Card's "Linked from ..." line sits small above it.

Hiding: the eye-slash in a Card's header hides it for that viewer (kept in the muted list under
`card:<id>`, saved and synced with the ticks). Hidden Cards leave the Sets, the counts and the
Prepare lines; the **Hidden** toggle in the filters shows them again, faded, each with an eye to
bring it back. The toggle is remembered per browser. The first 20 drafts were rewritten this way, in plain words
with every term explained (`node tools/cards/upload.mjs <file> --update` changes only unchecked
AI drafts).

- Card Sets per upcoming Key Event: a Card belongs to the Sets of the assessments its Sources
  prepare for (the same `needsOf` the Map uses). So one Card can sit in several Sets (a Module 2 Card in the
  Module 2 Quiz Set and the Midterm 1 Set). Its header names the Set being viewed, else the nearest
  event, with `+N` and the others on hover; reviews are planned toward the nearest.
- Drill: the due Cards, one at a time, answer revealed on demand, rated Again, Hard, Good or Easy.
  FSRS (`ts-fsrs`, request retention 0.9) schedules the next Review; with the Drill Goal "until
  the Key Event" a Review is never scheduled after its event, so the last ones crowd before it.
- To check: drafts written by others (for Answer Cards: by the Group), with Check and Flag.
- Write: a form for a new Card, its kind and Sources picked from the Course Plan.
