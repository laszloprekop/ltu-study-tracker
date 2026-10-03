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

- Next.js (App Router, TypeScript, `output: "standalone"`), copied in shape from
  `epub-reader-web`: Supabase clients in `app/lib/supabase/`, Google sign-in, the auth callback
  that uses `NEXT_PUBLIC_SITE_URL` because `request.url` is `0.0.0.0` in Docker.
- GitHub Actions: lint, test, build on the runner, push the image to GHCR, call the Coolify webhook.
  Coolify resource of type Docker Image.
- Guest mode works with no sign-in: the page as today, Ticks in localStorage.

### 3. Database, with row-level security from the first table

SQL migrations in `app/supabase/migrations/`, applied as in Babel Bookshelf.

| Table | Rows | Who reads | Who writes |
|---|---|---|---|
| `course` | one per Course | anyone | sync job |
| `course_plan` | the built Course Plan per Course, with `synced_at` | anyone | sync job |
| `account` | one per Google login | its owner | its owner |
| `tick` | `(account, task_id, on, at)` | its owner | its owner |

Ticks are saved as rows, and the latest `at` wins on every write, so two devices of the same Student
merge the same way an import does.

### 4. Hourly Course Plan sync on the server

- The Maintainer creates a Canvas token named "tracker-sync" with an expiry at the end of the term.
  It goes into Supabase Vault; only the sync job's database role may read it (ADR 0001).
- The job runs `buildInventory` (`tools/canvas-sync.mjs`) and the plan merge from `tools/build.mjs`
  against `data/plan.mjs` as built into the image, and writes `course_plan`. Its Canvas client
  accepts only GET and only the endpoints the inventory uses; anything else throws.
- Trigger: a Coolify scheduled task every hour calling a protected route, and once after every
  deploy, so a push of `data/plan.mjs` shows within minutes.
- The page shows "Course Plan synced <time>". If a sync fails, the last good plan stays and the
  time turns amber after three hours.
- `npm run check` keeps working on the Maintainer's machine as before.

### 5. Sign-in, merge and import

- Signing in with Google creates the `account`. On the first sign-in in a browser, the Guest's
  local Ticks merge in by the latest-change rule, once.
- The settings popup's import accepts Export Codes of both versions.

### 6. The artifact points to the app

- A banner for everyone: the tracker has moved, with the app's address and how to bring Ticks
  (export here, import there).
- Exporting records it in the viewer's own progress document and locks the tick boxes. The banner
  then offers Unlock; any Tick changed after the last export switches it to Out of Sync.
- The artifact keeps being rebuilt from the same `data/plan.mjs` until it is retired.

## Settled with the Maintainer (2026-10-03)

1. A separate Supabase resource in Coolify for the tracker, not a schema inside Babel Bookshelf's.
2. The address is `ltu-studytracker.dentaku.se`.
3. A new Google OAuth client for the tracker.

## Not in release 1

The Canvas relay, Completion and Status marks, Groups, Calendar Links and Bookings (release 2), the
Day Plan (3), Cards (4), Chains and Disagreement reports (5), notifications (later).
