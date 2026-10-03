#!/bin/sh
# Prints a JWT for the database role tracker_sync, valid one year, signed on the server with the
# tracker Supabase's JWT secret (which never leaves the server). Paste it into the app's Coolify
# environment as SYNC_JWT. To revoke it early: rotate the JWT secret, or drop the role's grants.
#   tools/mint-sync-jwt.sh | pbcopy
set -eu
. "$(dirname "$0")/server.env"
ssh -o BatchMode=yes "$TRACKER_SSH" "SERVICE=$SUPABASE_SERVICE python3 -" <<'PY'
import base64, hashlib, hmac, json, os, time
secret = next(l.split("=", 1)[1].strip() for l in open(f"/data/coolify/services/{os.environ['SERVICE']}/.env") if l.startswith("SERVICE_PASSWORD_JWT="))
b = lambda d: base64.urlsafe_b64encode(d).rstrip(b"=").decode()
now = int(time.time())
head = b(json.dumps({"alg": "HS256", "typ": "JWT"}, separators=(",", ":")).encode())
body = b(json.dumps({"role": "tracker_sync", "iss": "supabase", "iat": now, "exp": now + 365 * 86400}, separators=(",", ":")).encode())
sig = b(hmac.new(secret.encode(), f"{head}.{body}".encode(), hashlib.sha256).digest())
print(f"{head}.{body}.{sig}")
PY
