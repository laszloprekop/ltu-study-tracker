# LTU Study Tracker

A week-by-week tracker for LTU courses: sessions to attend, deadlines from Canvas, and the
material buried in the Canvas modules, each with a link. One tab per study period, a course
filter, a day planner, a flat deadline list, and private tick boxes for each viewer. It is a
single HTML page published as a claude.ai artifact:

https://claude.ai/artifact/Tkm4xHdppNkcTGJ3xsrgoU

Sharing is set from the artifact's Share menu (currently: anyone with the link).

## How the page is made

```
data/plan.mjs                 hand-written: study periods, courses, sessions, study weeks, tasks, advice
data/canvas-inventory.json    generated: every module item, deadline and announcement from Canvas
src/template.html             the page's markup, styles and rendering code
        |
   tools/build.mjs  ->  ltu-study-tracker.html   (generated, do not edit, publish this)
```

The page never calls Canvas itself. Viewers outside the author's claude.ai organisation have no
Canvas access from the page, so all data is baked in at build time.

## Commands

Needs Node 20 or newer and a Canvas personal access token (Canvas: Account > Settings > New Access
Token), read from `CANVAS_TOKEN`, then `.env` (copy `.env.example`), then the macOS Keychain item
`ltu-canvas-token`. The tools only ever read from Canvas.

```
npm run update          # inventory + build, the usual refresh
npm run inventory       # rewrite data/canvas-inventory.json from Canvas
npm run build           # rebuild ltu-study-tracker.html; fails on any ref that matches nothing
npm run check           # diff the committed inventory against live Canvas (dates, points, new items, announcements)
npm run announcements   # print the announcements per course
npm run courses         # list your Canvas courses with ids
```

After `npm run update`, publish `ltu-study-tracker.html` to the artifact URL above and commit.

## Editing the plan (`data/plan.mjs`)

- **Course:** name, `prefix` (chip label), colour slot 1 to 5, `canvasId` (or `null` before the
  course exists in Canvas), teachers, quick links, pass rules, optional material blocks.
- **Session:** course, date, start, end, kind (`lecture`, `workshop`, `lab`, `interview`,
  `seminar`, `exam`), title, `ref` to its Canvas page, `prep` refs, `status` (`expected` when the
  lecture number is predicted from module order, `confirmed` once an announcement names it).
- **Study week:** the Monday, the course, refs to the material for that week, and why.
- **Task:** a to-do Canvas does not list. Its `id` is the tick box key, so never rename one.
- **Notes:** advice attached to a Canvas deadline, keyed `course:assignmentId`.

Refs point at module items by number: `"3.5"` matches 3.5 and every 3.5.x (hand-ins and session
pages excluded unless named exactly), `"3.4@Discussion"` narrows by item type, `"#Required Software"`
matches by title. A ref that matches nothing stops the build.

## Adding a study period

Add a term to `TERMS` with `start`, `end`, `courses` and empty `sessions`, `study`, `tasks`,
`notes`. Add each course to `COURSES`. Run `npm run update` once the course exists in Canvas, then
fill in sessions from its schedule page. `docs/canvas-data-map.md` records where the data lives
in Canvas and what is and is not machine-readable.

## Tick boxes

Ids: `d:<course>:<assignmentId>` (deadline), `d:<course>:quizzes:<date>` (quizzes closing
together), `t:<taskId>` (task), `m:<course>:<itemId>` (material). `LEGACY_IDS` maps the ids of
earlier page versions so nobody loses progress. Ticks are private per viewer.
