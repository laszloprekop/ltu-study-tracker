# LTU Study Tracker

- `ltu-study-tracker.html` is generated. Edit `src/template.html` or `data/plan.mjs`, then
  `npm run build` (or `npm run update` to refresh Canvas data first). Never edit the output.
- The page is published at https://claude.ai/artifact/Tkm4xHdppNkcTGJ3xsrgoU. Republish with
  the Artifact tool and that `url`, never as a new artifact, and without `icon` or `capabilities`
  (it declares `db` and `user`; omitting keeps them).
- The page is shared with classmates. Keep the wording general: no personal notes, no "for you".
  Never bake in anyone's Canvas completion state, grades or submissions.
- Ticks are per viewer: `data/users/<id>/progress` in the artifact db, localStorage as fallback.
  Never move them to a shared path. Never rename a task id or change the id scheme without
  adding the old ids to `LEGACY_IDS`.
- Canvas is the source of truth for dates. Run `npm run check` before editing deadlines; the page
  gets them from `data/canvas-inventory.json`, not by hand.
- Z0025E lectures carry `status: "expected"` until an announcement names them. When
  `npm run check` reports a new announcement, read it and confirm or move the sessions it names.
- `data/my-progress.json` and `ltu-study-tracker.private.html` hold the owner's Canvas completion state. Both are git-ignored; never publish the private build to the shared artifact.
- Never read, print or commit `.env`. The token is only used by `tools/lib/canvas.mjs`.
- The README is about the repo and the web app; details live in `docs/` (`maintaining.md`,
  `page-guide.md`, `hosted-app.md`). Update those, not the README, when a feature changes.
- A screenshot for the repo (e.g. `docs/images/hero.png`) is taken signed out or as a Guest: no
  account name, ticks, calendar events or Canvas data in it.
- `docs/canvas-data-map.md` says where each kind of data lives in Canvas. Update it when the
  courses change shape.
- Page, app and Cards are in English. Canvas item names, links and references stay in Swedish as
  Canvas has them, so they can be found again in Canvas.
- `CONTEXT.md` is the glossary for the hosted app (Course Plan, Personal Layer, Key Event, Card...).
  Use its terms in code and docs.
- `app/` is the hosted tracker (Next.js, Supabase at ltu-studytracker-db.dentaku.se). It serves the
  same built page through `app/public/bridge.js`; keep the page's `window.claude.use` calls as the
  only storage seam. Migrations in `app/supabase/migrations/`, applied over SSH (see its README),
  then `app/supabase/tests/rls.sql`. Never commit `app/.env.local`.
