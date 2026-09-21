# LTU Study Tracker

- The page is published at https://claude.ai/artifact/Tkm4xHdppNkcTGJ3xsrgoU. Republish with
  the Artifact tool and that `url`, never as a new artifact, and without `icon` or `capabilities`
  (it declares `db` and `user`; omitting keeps them).
- The page is shared with classmates. Keep the wording general: no personal notes, no "for you".
- Ticks are per viewer: `data/users/<id>/progress` in the artifact db, with localStorage as the
  fallback. Never move them to a shared path.
- Canvas is the source of truth for dates. Run `npm run check` after editing deadlines.
- Never read, print or commit `.env`. The token is only used by `tools/canvas-sync.mjs`.
