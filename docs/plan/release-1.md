# Release 1: the move-over

Goal: classmates can leave the claude.ai artifact for the hosted app without losing a Tick, and the
Course Plan updates by itself every hour. Terms are as in `CONTEXT.md`; decisions in `docs/adr/`.

Done when: a Student opens the app as a Guest or with Google, imports their Export Code, sees the
same views and Ticks they had in the artifact, and a teacher's new announcement or moved deadline
shows up within an hour without anyone running a command.

## Approach: move the page, then rebuild it

Release 1 serves today's page (`src/template.html`, built by `tools/build.mjs`) from the Next.js app
and replaces only two things in it: where the data comes from and where Ticks are saved. The page
already reaches both through narrow points: `DATA` is injected at build time, and Ticks go through
one `store` object with `get()`/`set()` (template, end of file). Rebuilding every view as React
components is not needed to move people over, and doing it first would delay the move by weeks.
Views move to components from release 3 on, one at a time, starting with the Day Plan.

## Steps

Each step ships on its own and leaves everything working.

### 0. Fix our own Course Plan errors (`data/plan.mjs`)

From the scan (`docs/scan/`): interview length 30 minutes shared by three groups, not 45; task
`w39-book1` asks for a Lab 1 booking that does not exist (removed; `LEGACY_IDS` is for renamed
ids, and an old Tick on a removed task is simply unused); the `t-group` note contradicts the lab assignments, which allow working alone.
Also added: booking tasks for Labs 3 to 6 on the Monday of each session week. Done 2026-10-03.

### 1. Ticks get a time (artifact first)

Done 2026-10-03.

- `state.checked` stays `{ id: true }`; `state.tickAt` keeps, per id, when it was last ticked or
  cleared, in localStorage (`ltu-plan-tick-at`) and the artifact db document (`tickAt`).
- One rule, `mergeTicks`: per id the later change wins; a side without a time (a version 1 code,
  ticks from before) can only add a tick. Used by import and when loading the account copy, which
  before this only ever added ticks, so a clear never reached another device.
- Export Code version 2 carries `tickAt`. Import accepts versions 1 and 2.
- A restore records a time for every id it changes.
- `node tools/test-ticks.mjs` runs the rule from the template against six cases.

### 2. App skeleton in `app/`

Done 2026-10-03, not yet deployed.

- Next.js 16 in `app/`, standalone output. It serves the same tracker page the artifact publishes
  (`tools/build.mjs`, never the `--private` build) at `/`, plus `/health`.
- The page reaches storage only through `window.claude.use("db")` and `use("user")`.
  `app/public/bridge.js` provides both on top of Supabase, so the page runs unchanged in both
  places. Signed out, both return null and Ticks stay in the browser (Guest).
- Sign-in is Google through Supabase (PKCE, in the browser). The Sign in / Sign out button sits
  with the page's settings buttons.
- Headers: a content security policy (data only to the tracker's Supabase, no framing; scripts
  need 'unsafe-inline' because the page is one file), nosniff, referrer and permissions policies.
- Supabase address and anon key are read at run time (`NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`), so the image holds no environment-specific values.
- CI: `.github/workflows/app.yml` runs the tick tests, type check and build, pushes
  `ghcr.io/laszloprekop/ltu-study-tracker`, and calls the Coolify webhook when `COOLIFY_WEBHOOK` and
  `COOLIFY_TOKEN` are set (skipped otherwise).

### 3. Database, with row-level security from the first table

Done and applied 2026-10-03 (`app/supabase/`).

| Table | Rows | Who reads | Who writes |
|---|---|---|---|
| `progress` | one progress document per Account (`checked`, `tickAt`, `muted`, `snaps`) | its owner | only through `save_progress` |
| `course_plan` | `current`: the built Course Plan, with `synced_at` | anyone, Guests too | the sync (service role) |

- Deviation from the first draft: progress is one document per Account, the shape the page
  already uses, instead of one row per Tick. `save_progress` merges it on the server by the same
  rule as the page (per id the later change wins), so two devices cannot overwrite each other.
- Accounts are Supabase's own `auth.users`; no separate table is needed yet.
- `app/supabase/tests/rls.sql` checks every rule inside a rolled-back transaction: owners only,
  no direct writes, Guests read the Course Plan and nothing else.

### 4. Hourly Course Plan sync on the server

Built and tested 2026-10-03; switched on once the Sync Token exists and the app is deployed.

- `app/scripts/sync.mjs`, run in the app container by a Coolify scheduled task every hour:
  reads the Sync Token from Vault, builds the inventory (`tools/canvas-sync.mjs`) with GET requests
  to an allowlist of five path patterns, checks `data/plan.mjs` against it (`tools/lib/page.mjs`)
  and stores the Course Plan. A failed check stores nothing; the last good plan stays.
- Deviation from the first draft, for least privilege: no service-role key in the app. The sync
  acts as the database role `tracker_sync` (`SYNC_JWT`), which can only read the Sync Token and
  replace the Course Plan. `store_course_plan` also refuses any plan carrying completion state.
- The page is served with the Course Plan from the database (cached five minutes), falling back to
  the plan built into the image. The "read from Canvas" line now has a time, and on the hosted app
  turns amber with a note when the last read is over three hours old.
- `node scripts/sync.mjs --dry-run` (in `app/`, with `CANVAS_ENV_FILE` pointing at the repo's
  `.env`) runs it on the Maintainer's machine without Vault and stores nothing.
- Tested: the dry run against Canvas; the role through the public API (reads the token, stores the
  plan; Students and Guests refused); the app serving the stored plan. Not yet run with a real Sync
  Token or on a schedule.

### 5. Sign-in, merge and import

Done with step 2: the page saves right after loading the account copy, so a Guest's Ticks merge
in at the first sign-in; import already takes both code versions. Untested until a real sign-in.

- Signing in with Google creates the `account`. On the first sign-in in a browser, the Guest's
  local Ticks merge in by the latest-change rule, once.
- The settings popup's import accepts Export Codes of both versions.

### 6. The artifact points to the app

Built and tested 2026-10-03; switched on the same day after the first real sign-in.
Before that: `MOVED_TO = null` in `data/plan.mjs`. Setting it to
`"https://ltu-studytracker.dentaku.se"` and republishing turns it on. Only after a real sign-in
on the app has worked.

- On the claude.ai page only (never in the app): a banner names the new address and how to bring
  Ticks (Export here, Import there).
- Export records the time (`exportedAt`, kept with the Ticks) and locks the tick boxes; a click on a
  locked box is undone and the banner asks to unlock. Unlock is per browser.
- Any Tick changed after the last export turns the banner red: Out of Sync, export and import again.
- Tested with a build that had the switch on: all seven states, and that a reload keeps them.

## Settled with the Maintainer (2026-10-03)

1. A separate Supabase resource in Coolify for the tracker, not a schema inside Babel Bookshelf's.
2. The address is `ltu-studytracker.dentaku.se`.
3. A new Google OAuth client for the tracker.

## Not in release 1

The Canvas relay, Completion and Status marks, Groups, Calendar Links and Bookings (release 2), the
Day Plan (3), Cards (4), Chains and Disagreement reports (5), notifications (later).
