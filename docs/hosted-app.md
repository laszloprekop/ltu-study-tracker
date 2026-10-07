# The hosted app: features, privacy and security

What https://ltu-studytracker.dentaku.se adds to the claude.ai page, and how it treats data.
Back to the [README](../README.md).

## Overview

The same page also runs as its own site, https://ltu-studytracker.dentaku.se (`app/`, see
`docs/plan/release-1.md`). On the claude.ai page an orange banner in condensed Archivo (folds to one muted
line, remembered per viewer) gives the steps to move and the main reasons; the **Hosted app** view, in both places,
lists everything. The lists live in one place in `src/template.html` (`APP_INFO`).

**What it does today**
- Ticks on every device with a Google sign-in; no claude.ai account needed.
- Two devices never undo each other: per task the later change wins, an untick included.
- The Course Plan updates itself from Canvas every hour; the page shows when, and turns the line
  amber if the last read is over three hours old.
- Without signing in it works like the claude.ai page: ticks stay in that browser.
- With the Student's own Canvas token (kept in the browser, passed through, never stored): what
  Canvas has recorded beside each tick, and the Conflict sign for a ticked hand-in with no
  submission; the Group number from Canvas, overridable.
- Lab Bookings from the signup sheet (no names kept): the Group's slot, or a stage that grows as
  the session nears and slots run out, on the booking task and in a strip at the top.
- Calendar Links (signed in, at most five, fetched only from known calendar providers): their
  events among the sessions, marked as the Student's, counted as busy time.
- The Day Plan in Day Planner: one day in 15-minute slots with the free slots and this week's unplaced
  work; place it with a suggested slot or by dragging (`docs/plan/release-3.md`). This one also
  works on the claude.ai page.
- Prep chains (`docs/plan/release-5.md`): in All deadlines every Key Event with its Prep, Taught
  Dates, warnings for material taught after it is needed, hollow Do-By Dates; the map opens on the
  next Key Event and steps through them. Disagreements (`DISAGREEMENTS` in `data/plan.mjs`) mark
  their rows, the earliest not-yet-past deadline is used, and each course's list copies as a
  report for the teacher. These work on the claude.ai page too.
- Cards (`docs/plan/release-4.md`): drill with FSRS at 90% recall, aimed at each card's next lab or
  exam (Drill Goal); Card Sets per event from the cards' Sources, a passed event's Set kept only
  with the Drill Goal "until mastered"; a card is at most twice as tall as it is wide and a longer
  prompt or answer scrolls inside it; every card open to all, with
  public legit and needs-fix Votes and a trust filter; a random order per round, Again back at a
  random place; write Concept, Question and Group answer cards. Drafts from the Maintainer's machine:
  `node tools/cards/upload.mjs data/cards/<file>.json`. What still lacks cards:
  `node tools/cards/coverage.mjs -v`; length, format and duplicate checks before an upload:
  `node tools/cards/lint.mjs`.

**Coming next** (`docs/plan/release-1.md`, then the design in `CONTEXT.md` and `docs/adr/`)

**Privacy and security**
- A Student's ticks are one database row that a row-level security rule lets only their account
  read or change; `app/supabase/tests/rls.sql` checks every rule.
- Sign-in asks Google for name and email only (scopes `openid email profile`).
- A Student's Canvas token (release 2) never reaches server storage; the one stored Canvas token is
  the Maintainer's Sync Token, encrypted in Vault and readable only by the sync role (ADR 0001).
- Guests leave no ticks or account on the server.
- No ads, analytics or tracking scripts. A content security policy limits the page to its own
  server and database, Google Fonts, and Google during sign-in, and forbids framing.
- Written answers to graded questions stay inside the Group (ADR 0002); privacy is enforced in the
  database, not only in the page (ADR 0003).
- Hosted on Hetzner in the EU over HTTPS. The sync reads Canvas with GET requests to a fixed list
  of course paths and stores nothing about any Student.
- The server takes SSH by key only, no passwords. A Hetzner Cloud Firewall, outside the server so
  Docker cannot bypass it, lets in only TCP 22, 80 and 443 and UDP 443; the database, the Coolify
  dashboard and Traefik are reached through the HTTPS proxy or an SSH tunnel. The server's address
  is kept out of the repo, in the git-ignored `tools/server.env` that `tools/db.sh` reads.
- Signed in, the Hosted app view has a two-step button that deletes the account and its ticks
  from the server (`public.delete_my_account`); ticks in the browser stay.
- The code is public: https://github.com/laszloprekop/ltu-study-tracker

