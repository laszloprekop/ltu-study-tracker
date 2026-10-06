#!/bin/sh
# Bug reports sent from the hosted app's footer form (public.bug_report), read over SSH as postgres.
#   tools/bugs.sh             the new ones, oldest first
#   tools/bugs.sh all         every report
#   tools/bugs.sh done <id>   mark one as dealt with
set -eu
db="$(dirname "$0")/db.sh"
case "${1:-new}" in
  done)
    echo "${2:-}" | grep -Eq '^[0-9a-f-]{36}$' || { echo "usage: tools/bugs.sh done <id>" >&2; exit 1; }
    echo "update public.bug_report set status = 'done' where id = '$2' returning id, status;" | "$db" -q ;;
  all) echo "select id, at, status, version, route, did, expected, happened, contact, context from public.bug_report order by at;" | "$db" -x -q ;;
  *)   echo "select id, at, version, route, did, expected, happened, contact, context from public.bug_report where status = 'new' order by at;" | "$db" -x -q ;;
esac
