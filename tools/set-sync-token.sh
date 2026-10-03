#!/bin/sh
# Stores the Canvas Sync Token (ADR 0001) in the tracker database's Vault, encrypted.
# Reads it from the macOS Keychain item "ltu-canvas-sync-token" and sends it over SSH on stdin, so
# it never appears in a command line, a process list or shell history. Run again to replace it.
#   tools/set-sync-token.sh
set -eu
HOST=root@157.90.168.58
DB=supabase-db-aqhq0ki76r5bniaurku9xpzf
ITEM=${SYNC_TOKEN_ITEM:-ltu-canvas-sync-token}   # override only to test the script
NAME=${SYNC_TOKEN_NAME:-canvas_sync_token}
TOKEN=$(security find-generic-password -s "$ITEM" -w) || { echo "No Keychain item ltu-canvas-sync-token. Add it with: security add-generic-password -a \"\$USER\" -s ltu-canvas-sync-token -w" >&2; exit 1; }
[ -n "$TOKEN" ] || { echo "The Keychain item is empty." >&2; exit 1; }
{
  printf '\\set ON_ERROR_STOP 1\n\\set VERBOSITY terse\n\\set name %s\n\\set tok %s\n' "$NAME" "$(printf %s "$TOKEN" | sed "s/'/''/g; s/^/'/; s/\$/'/")"
  cat <<'SQL'
select case
  when exists (select 1 from vault.secrets where name = :'name')
  then (select vault.update_secret(id, :'tok') from vault.secrets where name = :'name')::text
  else vault.create_secret(:'tok', :'name', 'Canvas Sync Token for the hourly Course Plan sync (ADR 0001)')::text
end is not null as stored;
SQL
# psql's own messages can quote the statement, and with it the token: never show them.
} | ssh -o BatchMode=yes "$HOST" "docker exec -i $DB psql -U postgres -qtA" >/dev/null 2>&1 || { echo "Storing the Sync Token failed (details hidden, they could contain the token)." >&2; exit 1; }
echo "Sync Token stored in Vault."
