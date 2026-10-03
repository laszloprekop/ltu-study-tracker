# Privacy is enforced by the database

The tracker holds three kinds of data with different readers: the Course Plan (anyone), the Group
Layer (one Group's members) and the Personal Layer (one Student). We use the owner's self-hosted
Supabase, as Babel Bookshelf does, so that row-level security policies decide who reads each row:
a bug in an API route or a component cannot show one Student's Reviews or one Group's Answer Cards
to anyone else. Group membership in those policies comes from Canvas, recorded while the member is
signed in with a token.

## Considered Options

- Node server with SQLite, as in the Elden map project: lighter, but every privacy rule would live
  only in application code, and one missed check leaks data.
- Cloudflare Workers with D1: free and maintenance-free, but the same weakness, and a second hosting
  setup to learn.
