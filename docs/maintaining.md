# Maintaining the Course Plan

How the page is built from `data/plan.mjs` and Canvas, the commands, and how to edit the plan.
Back to the [README](../README.md).

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
npm run palette         # regenerate the Ice and Neon colours in src/template.html (tools/palette.mjs)
# tools/contrast-scan.js: paste into the browser console on the built page for a WCAG contrast audit of the visible text
npm run announcements   # print the announcements per course
npm run courses         # list your Canvas courses with ids
npm run progress        # write data/my-progress.json: what Canvas counts as done for YOUR account (git-ignored)
npm run build:private   # build ltu-study-tracker.private.html with those Canvas marks filled in (git-ignored, never share)
npm run bugs            # list the new bug reports sent from the hosted app (needs tools/server.env)
```

The page shows its version in the footer and sends it with every bug report. Nobody sets it: the
build counts it from git (`version()` in `tools/lib/page.mjs`, `git describe`). The latest tag of
the form `v1.0` gives the first two numbers and the commits since that tag the third, so `v1.0`
plus 4 commits is `1.0.4`. For a new first or second number, tag a commit and push the tag:

```
git tag -a v1.1 -m "What is new" && git push origin v1.1
```

A build with changes not yet committed counts the commit they are about to become, so build last
and commit the built page together with its source. The app is built by CI from that commit and
shows the same number; CI fetches the whole history for this (`fetch-depth: 0`).

`tools/bugs.sh done <id>` marks a bug report as dealt with.

The shared page shows, for each material item, whether Canvas has a completion requirement
(view, mark done, post, submit) as an empty box. Canvas only tells a person about their own
completion, so the filled-in box exists only in the private build.

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
- **Needs:** what an assessment tests, keyed `course:assignmentId`, as refs. A rule already
  covers the obvious cases (see below); `NEEDS_LP2` holds what the structure cannot say: the
  midterm ranges, Lab 3's IP lectures, the home exam's two videos.

Refs point at module items by number: `"3.5"` matches 3.5 and every 3.5.x (hand-ins and session
pages excluded unless named exactly), `"3.4@Discussion"` narrows by item type, `"#Required Software"`
matches by title. A ref that matches nothing stops the build.

## Adding a study period

Add a term to `TERMS` with `start`, `end`, `courses` and empty `sessions`, `study`, `tasks`,
`notes`. Add each course to `COURSES`. Run `npm run update` once the course exists in Canvas, then
fill in sessions from its schedule page. `docs/canvas-data-map.md` records where the data lives
in Canvas and what is and is not machine-readable.

## MUST and NICE

Every item carries a level, and every MUST item has a red stripe on its left edge. By rule: hand-ins, quizzes, exams, items Canvas requires a post or
submission for, and lab, seminar, interview and exam sessions are MUST; everything else is NICE.
`must` and `nice` lists on a course in `data/plan.mjs` override the rule by ref (Z7005E
workshops are MUST that way). Tasks take `"must"` as their last argument, and a task listed in
`TASK_FOR` with the deadline it feeds (`"Z7005E:3013"`) inherits MUST and shows a "for ..." tag.
Material listed as `prep` for a MUST session is MUST too. Canvas records none of these links,
so they live in the plan.

## What an assessment needs

Every dated quiz, lab hand-in and exam is linked to the material it tests, so a walk from the
event reaches the pages, and a page reaches the events it counts for. The rule, applied by the
page: the other items under the assessment's own heading; when it sits alone under its heading
(every Z0025E quiz), the items before it in the module, minus those under a heading that holds
another assessment. Then the `needs` refs from the plan. Hand-ins, exams and links are never
material. Ungraded practice quizzes get no rule, only refs. An assignment Canvas lists in no
module (the Z7005E home exam) is placed in the module its number names, flagged `unlisted`, and
gets only its refs. The level (MUST/NICE) does not travel along these links.

