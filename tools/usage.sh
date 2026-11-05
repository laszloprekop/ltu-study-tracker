#!/bin/sh
# How many people use the hosted app. Needs tools/server.env.
#   tools/usage.sh            the last 14 days
#   tools/usage.sh 30         the last 30 days
#
# Two sources, both on the server. Accounts: the sign-in event log in Supabase (auth.audit_log_entries);
# an account is active on a day when its browser logged in or refreshed its sign-in token that day,
# which happens about hourly while the page is open. Visitors: the proxy's access log
# (/data/coolify/proxy/access/access.log, JSON lines, kept 14 days by logrotate, set up 5 Nov 2026):
# distinct client addresses that loaded the page (GET / with status 200) on the tracker's host, so
# guests count too. One address can be several people on the same network, and one person on a phone
# and a laptop is two addresses. Requests whose user agent names a bot or a monitor are left out.
set -eu
. "$(dirname "$0")/server.env"
days="${1:-14}"
host="${TRACKER_HOST:-ltu-studytracker.dentaku.se}"
psql="docker exec -i supabase-db-$SUPABASE_SERVICE psql -U postgres -q -t -A -F ' '"

echo "== Accounts active per day, last $days days (signed in; logins that day in brackets)"
ssh -o BatchMode=yes "$TRACKER_SSH" "$psql" <<SQL
select to_char(created_at::date, 'YYYY-MM-DD Dy'), count(distinct payload->>'actor_id'),
  '(' || count(*) filter (where payload->>'action' = 'login') || ')'
from auth.audit_log_entries where created_at > now() - interval '$days days' group by 1 order by 1;
SQL
echo
echo "== Accounts active per week (from Monday), all time; accounts created"
ssh -o BatchMode=yes "$TRACKER_SSH" "$psql" <<SQL
with a as (select date_trunc('week', created_at)::date as w, payload->>'actor_id' as u from auth.audit_log_entries),
  n as (select date_trunc('week', created_at)::date as w, count(*) as c from auth.users group by 1)
select a.w, count(distinct a.u), 'active', coalesce(n.c, 0), 'new' from a left join n on n.w = a.w group by a.w, n.c order by a.w;
SQL
echo
echo "== Visitors per day (distinct addresses that loaded $host), last $days days"
ssh -o BatchMode=yes "$TRACKER_SSH" 'cd /data/coolify/proxy/access && cat access.log && for f in access.log-*; do [ -e "$f" ] || continue; case $f in *.gz) zcat "$f";; *) cat "$f";; esac; done' \
  | python3 -c '
import json, sys, collections, datetime
host, days = sys.argv[1], int(sys.argv[2])
since = (datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=days)).date()
seen, hits = collections.defaultdict(set), collections.Counter()
bots = ("bot", "crawl", "spider", "monitor", "uptime", "curl", "wget", "python-requests", "go-http-client")
for line in sys.stdin:
    try:
        r = json.loads(line)
    except ValueError:
        continue
    if r.get("RequestHost") != host or r.get("RequestMethod") != "GET" or r.get("RequestPath") != "/" or r.get("DownstreamStatus") != 200:
        continue
    ua = (r.get("request_User-Agent") or "").lower()
    if any(b in ua for b in bots):
        continue
    day = datetime.date.fromisoformat(r["StartUTC"][:10])  # UTC day; the stamp has nanoseconds
    if day < since:
        continue
    seen[day].add(r["ClientHost"])
    hits[day] += 1
for day in sorted(seen):
    print(day.strftime("%Y-%m-%d %a"), len(seen[day]), "addresses,", hits[day], "page loads")
if not seen:
    print("(nothing yet: the log starts when the access log was set up)")
' "$host" "$days"
