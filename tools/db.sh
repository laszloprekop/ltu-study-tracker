#!/bin/sh
# Runs psql as postgres in the tracker database, over SSH, with SQL on stdin. The host and the
# Coolify service id come from tools/server.env (git-ignored; see tools/server.env.example).
#   tools/db.sh -v ON_ERROR_STOP=1 -q < app/supabase/migrations/<file>.sql
set -eu
. "$(dirname "$0")/server.env"
exec ssh -o BatchMode=yes "$TRACKER_SSH" "docker exec -i supabase-db-$SUPABASE_SERVICE psql -U postgres $*"
