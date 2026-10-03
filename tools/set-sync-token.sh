#!/bin/sh
# Stores the Canvas Sync Token (ADR 0001) in the tracker database's Vault, encrypted.
# Reads it from the macOS Keychain item "ltu-canvas-sync-token" and sends it over SSH on stdin, so
# it never appears in a command line, a process list or shell history. Run again to replace it.
#   tools/set-sync-token.sh
set -eu
HOST=root@157.90.168.58
DB=supabase-db-aqhq0ki76r5bniaurku9xpzf
TOKEN=$(security find-generic-password -s ltu-canvas-sync-token -w) || { echo "No Keychain item ltu-canvas-sync-token. Add it with: security add-generic-password -a \"\$USER\" -s ltu-canvas-sync-token -w" >&2; exit 1; }
[ -n "$TOKEN" ] || { echo "The Keychain item is empty." >&2; exit 1; }
{
  printf '\\set ON_ERROR_STOP 1\n\\set tok %s\n' "$(printf %s "$TOKEN" | sed "s/'/''/g; s/^/'/; s/\$/'/")"
  cat <<'SQL'
select case
  when exists (select 1 from vault.secrets where name = 'canvas_sync_token')
  then (select vault.update_secret(id, :tok) from vault.secrets where name = 'canvas_sync_token')::text
  else vault.create_secret(:tok, 'canvas_sync_token', 'Canvas Sync Token for the hourly Course Plan sync (ADR 0001)')::text
end is not null as stored;
SQL
} | ssh -o BatchMode=yes "$HOST" "docker exec -i $DB psql -U postgres -qtA" >/dev/null
echo "Sync Token stored in Vault."
