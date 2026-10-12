-- How much the hosted app is used. Counts only: no names, no addresses.
--   tools/db.sh -q < tools/usage.sql
-- Guests are not in here: their ticks never leave their browser.

\echo 'Accounts'
select count(*)                                   as accounts,
       count(last_sign_in_at)                     as signed_in_once,
       min(created_at)::date                      as first,
       max(created_at)::date                      as newest
from auth.users;

\echo 'New accounts per day'
select created_at::date as day, count(*) as new_accounts
from auth.users group by 1 order by 1;

\echo 'People whose session renewed itself (close to: opened the app)'
with seen as (
  select user_id, max(coalesce(refreshed_at, updated_at, created_at)) as at
  from auth.sessions group by 1
)
select count(*) filter (where at > now() - interval '1 day')   as last_day,
       count(*) filter (where at > now() - interval '7 days')  as last_7_days,
       count(*) filter (where at > now() - interval '14 days') as last_14_days,
       count(*)                                                as with_a_session
from seen;

\echo 'People who ticked something'
select count(*)                                                        as ever,
       count(*) filter (where updated_at > now() - interval '7 days')  as last_7_days,
       count(*) filter (where updated_at > now() - interval '1 day')   as last_day
from public.progress;

\echo 'People who rated Cards'
select count(distinct user_id)                                                        as ever,
       count(distinct user_id) filter (where updated_at > now() - interval '7 days')  as last_7_days,
       count(*)                                                                       as cards_in_review
from public.review;

\echo 'Rows per table'
select relname as "table", n_live_tup as "rows"
from pg_stat_user_tables where schemaname = 'public' order by 1;
