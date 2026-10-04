# Tracker database

Migrations in `migrations/`, applied in file-name order, as `postgres`, over SSH (the tracker's
Supabase has no Studio). `tools/db.sh` reads the server from `tools/server.env`, which is
git-ignored; copy `tools/server.env.example` to make it.

    tools/db.sh -v ON_ERROR_STOP=1 -q < app/supabase/migrations/<file>.sql

Then run `tests/rls.sql` the same way; it rolls back and prints `ok` or `FAIL` per rule.

| Migration | Applied |
|---|---|
| 20261003000001_progress.sql | 2026-10-03 |
| 20261003000002_course_plan.sql | 2026-10-03 |
| 20261003000003_sync_role.sql | 2026-10-03 |
| 20261003000004_delete_my_account.sql | 2026-10-03 |
| 20261003000005_calendar_link.sql | 2026-10-03 |
| 20261003000006_calendar_link_check.sql | 2026-10-03 |
| 20261003000007_planned_blocks.sql | 2026-10-03 |
| 20261003000008_cards.sql | 2026-10-03 |
| 20261003000009_settle_flag.sql | 2026-10-03 |
| 20261003000010_card_edit_drops_checks.sql | 2026-10-03 |
| 20261003000011_flag_drafts.sql | 2026-10-03 |
| 20261004000012_card_votes.sql | 2026-10-04 |

## The sync role

`tracker_sync` may only call `sync_canvas_token()` (the Sync Token from Vault) and
`store_course_plan(plan)`. The app's sync authenticates as it with `SYNC_JWT`
(`tools/mint-sync-jwt.sh`); the token goes into Vault with `tools/set-sync-token.sh`.
