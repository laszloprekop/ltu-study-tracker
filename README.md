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
npm run progress        # write data/my-progress.json: what Canvas counts as done for YOUR account (git-ignored)
npm run build:private   # build ltu-study-tracker.private.html with those Canvas marks filled in (git-ignored, never share)
```

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

## Map view

A fourth tab. Left: the coming events (sessions, deadlines, tasks) as a timeline, titles only.
Centre: the Canvas entities, course to module to item, in a force layout: every node repels every
other, links pull connected nodes together, and a weak pull to the centre keeps it round. Drag a
node to move it, drag the background to pan, scroll to zoom, click a module to open it. Positions
are kept while the tab is open, so opening a module only moves what has to move. Dashed blue edges
show what a session's page depends on (its `prep`), a red dot marks MUST, a blue tint marks this
week's material. Right: details of the chosen event or node, with the tick box, mute, Canvas links
and everything connected to it. Which modules are open is remembered per viewer.

## Header and settings

Row 1: study period tabs, then the settings: text size, pulse on or off (target), course-coloured
titles (beach ball, on by default: unfinished titles take their course colour), theme (light, dark,
or follow the system; "system" hands control back to the viewer's own theme), "About this page"
(question mark, a popup), and working hours (clock). Every link into Canvas ends with the
external-link mark. Row 2: view, course filter, jump to Today, and one
progress block (green bar deadlines and tasks, blue bar material). Below the sticky header: the full
course names of the selected term and its period.

## Icons

Phosphor duotone icons (MIT, `assets/icons/LICENSE`). `tools/fetch-icons.sh` downloads the list it
names into `assets/icons/`; the build inlines every SVG there as a hidden sprite, used in the
template as `ic("name")`. Icons take the text colour they sit in, so they keep its contrast.

## Pulse, mute, folding

- **Pulse:** an unfinished deadline or task pulses when it is overdue or due within the coming
  seven days (today plus six); unfinished MUST material pulses in the current week and earlier ones.
  Nothing further ahead pulses. The header button turns it off; the choice is remembered.
- **Mute:** the circle-slash button on any item marks it "not for me". It stays visible, stops
  pulsing and leaves the counts. Muting is per viewer and stored with the ticks.
- **Folding:** week cards fold from the chevron by the week number, material blocks fold from
  their heading. Both are remembered per viewer.

## Free time for group work

Group activities have no fixed slot, so the page shows where they can go instead. Each day heading
lists the windows inside the viewer's working hours (default 09:00 to 17:00, adjustable next to the
week and day views, remembered per viewer) that no session occupies, with the longest window marked
as the best candidate. The week rail sums the free hours Monday to Friday; the Day view has a "Free
for group work" card. Only sessions on screen count, so filtering to one course frees its time.

## Tick boxes

Ids: `d:<course>:<assignmentId>` (deadline), `d:<course>:quizzes:<date>` (quizzes closing
together), `t:<taskId>` (task), `m:<course>:<itemId>` (material). `LEGACY_IDS` maps the ids of
earlier page versions so nobody loses progress. Ticks are private per viewer.
