# LTU Study Tracker

A week-by-week plan for LTU courses, one tab per study period, with a course filter and private
tick boxes for each viewer. It is a single HTML page published as a claude.ai artifact:

https://claude.ai/artifact/Tkm4xHdppNkcTGJ3xsrgoU

The artifact is private until shared from its Share menu.

## Files

| Path | What it is |
|---|---|
| `ltu-study-tracker.html` | The page. All schedule data lives in its `COURSES` and `TERMS` blocks. |
| `tools/canvas-sync.mjs` | Read-only check of the page against Canvas. |
| `.env.example` | Template for the Canvas token. Copy to `.env`, which git ignores. |

## Adding a course or study period

1. Add the course to `COURSES`: name, colour slot (`1` to `5`), Canvas URL (or `null` if the
   course is not in Canvas yet), quick links, pass rules.
2. List its code in the study period's `courses` in `TERMS`, and add rows to that period's `weeks`.
   Each week needs `start`, the ISO date of its Monday. Rows with a `task` id get a tick box, so
   task ids must be unique across all periods.
3. Republish the artifact to the same URL (see `CLAUDE.md`).

The schedule stays inside the page, not in the artifact database, because viewers outside the
author's claude.ai organisation cannot read the database.

## Checking against Canvas

Needs Node 20 or newer and a Canvas personal access token (Canvas: Account > Settings > New Access
Token), taken from `CANVAS_TOKEN`, then `.env`, then the macOS Keychain item `ltu-canvas-token`.

```
npm run courses   # list your Canvas courses and their ids
npm run check     # compare every deadline row with Canvas
```

`check` marks rows `ok`, `X` (date or time differs, or the assignment is gone), `+` (due in Canvas
but missing from the page) or `?` (no Canvas assignment linked, not checked).
