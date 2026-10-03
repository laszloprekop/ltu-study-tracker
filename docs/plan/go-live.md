# Going live: the Maintainer's steps

Everything in release 1 is built and tested up to these steps, which need the Maintainer's own
accounts. In this order; each says how to check it.

Done already: Supabase for the tracker (`ltu-studytracker-db.dentaku.se`, Google sign-in), its
tables and privacy rules, the image `ghcr.io/laszloprekop/ltu-study-tracker:latest` (public, built
by `.github/workflows/app.yml` on every push to `main`), and DNS for `ltu-studytracker.dentaku.se`.

## 1. The Canvas Sync Token

Done 2026-10-03 (replaced once the same day, after a script bug showed part of the first one).
First real sync, run from the Mac with the Vault token: stored 13:18 UTC.

1. Canvas, Account, Settings, + New access token. Purpose `tracker-sync`, expires 2026-12-31.
2. On the Mac, into the Keychain (asks for it without showing it):
   `security add-generic-password -a "$USER" -s ltu-canvas-sync-token -w`
3. Into the database's Vault: `tools/set-sync-token.sh`. It prints "Sync Token stored in Vault."

## 2. The app in Coolify

1. Same project, + New, Docker Image: `ghcr.io/laszloprekop/ltu-study-tracker:latest`. No
   registry login is needed: the image is public and holds no secrets.
2. Domain: `https://ltu-studytracker.dentaku.se:3000` (3000 is the port inside the container), and
   **Ports Exposes: `3000`**. Coolify defaults that field to 80 and passes it to the app as `PORT`,
   which then listens where the proxy is not looking.
3. Environment variables:

   | Name | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://ltu-studytracker-db.dentaku.se` |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | the Supabase service's `SERVICE_SUPABASEANON_KEY` |
   | `SYNC_JWT` | the output of `tools/mint-sync-jwt.sh \| pbcopy` (valid one year) |

   Never the service role key: the app does not need it (ADR 0001, `tracker_sync`).
4. Deploy. Check: `https://ltu-studytracker.dentaku.se/health` answers `{"ok":true,"page":true}`.

## 3. Deploys from GitHub

1. Coolify: the app's Webhooks tab gives the deploy URL; Keys & Tokens, API tokens, gives a token
   with deploy rights.
2. GitHub, the repo, Settings, Secrets and variables, Actions: `COOLIFY_WEBHOOK` and
   `COOLIFY_TOKEN`.
3. Check: the next push to `main` ends with "Deploy to Coolify" calling the webhook instead of the
   "deploy skipped" notice.

## 4. The hourly sync

1. Coolify, the app, Scheduled Tasks, + Add: name `course-plan-sync`, command
   `node scripts/sync.mjs`, frequency `7 * * * *` (seven minutes past every hour).
2. Run it once by hand from the same screen. Its log ends with
   `sync: stored Course Plan at ...`. A line starting `sync: plan check failed` means Canvas no
   longer matches `data/plan.mjs`: fix the plan, push, and the last good plan stays meanwhile.
3. Check: the page's "read from Canvas on" line shows today's time and is no longer amber.

## 5. First sign-in

1. Open the app, Sign in, choose the Google account. Tick something.
2. Open the app in another browser or a private window, sign in: the Tick is there.
3. Untick it there, reload the first browser: it is unticked.

## 6. Turn on the move banner on the claude.ai page

Only after step 5 worked. In `data/plan.mjs` set
`export const MOVED_TO = "https://ltu-studytracker.dentaku.se";`, then `npm run build`, commit,
push and republish the artifact. Classmates then see the banner; after they export, their ticks
there are locked until they unlock them.

## If something goes wrong

- Sync Token leaked or unsure: delete it in Canvas (Account, Settings), make a new one, step 1 again.
- `SYNC_JWT` leaked: it can only read the Sync Token and replace the Course Plan. Make a new Sync
  Token (step 1); to invalidate the JWT itself, rotate the Supabase JWT secret, which also changes
  the anon key.
- Database checks after any migration: `app/supabase/README.md`.
