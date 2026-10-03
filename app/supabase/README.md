# Tracker database

Migrations in `migrations/`, applied in file-name order, as `postgres`, over SSH (the tracker's
Supabase has no Studio):

    ssh root@157.90.168.58 'docker exec -i supabase-db-aqhq0ki76r5bniaurku9xpzf psql -U postgres -v ON_ERROR_STOP=1 -q' < app/supabase/migrations/<file>.sql

Then run `tests/rls.sql` the same way; it rolls back and prints `ok` or `FAIL` per rule.

| Migration | Applied |
|---|---|
| 20261003000001_progress.sql | 2026-10-03 |
| 20261003000002_course_plan.sql | 2026-10-03 |
