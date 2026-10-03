-- Fixes 20261003000005: Postgres allows at most 255 repetitions in a regular expression, so the
-- https check is a pattern plus a length check.
alter table public.calendar_link drop constraint if exists calendar_link_url_check;
alter table public.calendar_link add constraint calendar_link_url_check
  check (url ~ '^https://[^[:space:]]+$' and length(url) between 18 and 2000);
