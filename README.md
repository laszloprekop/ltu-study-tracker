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
npm run palette         # regenerate the theme colours in src/template.html from the reference hues (tools/palette.mjs)
# tools/contrast-scan.js: paste into the browser console on the built page for a WCAG contrast audit of the visible text
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

## Where progress lives

Ticks and muted items are saved in the viewer's browser (`localStorage` under the artifact's own
origin, keys `ltu-plan-ticks`, `ltu-plan-muted`, `ltu-plan-snaps`) and, for a viewer signed in with
an id from the owner's organisation, also in the artifact database at `data/users/<id>/progress`,
a subtree private to that viewer. Every save also stores the day's state under its date; the last
seven days are kept. The About panel shows the count and last save, copies an export code (ticks,
muted items, snapshots, and since version 2 when each tick was last set or cleared) to the
clipboard, brings a pasted code in, and restores a snapshot day; the state before a restore is kept
as "before the last restore", so a restore can be undone. Bringing ticks in, from a code or from the
account copy on load, keeps per task the later change, so an untick travels too; a tick without a
time (a version 1 code) can only be added. `npm test` checks this rule against the page's own code.

## The hosted app

The same page also runs as its own site, https://ltu-studytracker.dentaku.se (`app/`, see
`docs/plan/release-1.md`). On the claude.ai page an orange banner in condensed Archivo (folds to one muted
line, remembered per viewer) gives the steps to move and the main reasons; the **Hosted app** view, in both places,
lists everything. The lists live in one place in `src/template.html` (`APP_INFO`).

**What it does today**
- Ticks on every device with a Google sign-in; no claude.ai account needed.
- Two devices never undo each other: per task the later change wins, an untick included.
- The Course Plan updates itself from Canvas every hour; the page shows when, and turns the line
  amber if the last read is over three hours old.
- Without signing in it works like the claude.ai page: ticks stay in that browser.

**Coming next** (`docs/plan/release-1.md`, then the design in `CONTEXT.md` and `docs/adr/`)
- Release 2: the Student's own Canvas status beside each tick (with a warning for a ticked hand-in
  Canvas has no submission for), the Group's lab booking from the signup sheet with warnings before
  booking closes, a calendar link of their choice.
- Release 3: a Day Plan of both courses in 15-minute slots, with free slots for group work.
- Release 4: study cards: flashcards for every lab and exam from the lectures, lab questions and
  course checklists, with spaced repetition planned so each card is known on the event's day;
  checked by a classmate before sharing, and anyone can flag a wrong one.
- Release 5: prep chains: every lab session, quiz, midterm and oral exam with the lectures,
  readings, quizzes, group sessions and card sets that prepare for it, drawn back on a timeline,
  including lectures taught too late for the lab that needs them.

**Privacy and security**
- A Student's ticks are one database row that a row-level security rule lets only their account
  read or change; `app/supabase/tests/rls.sql` checks every rule.
- Sign-in asks Google for name and email only (scopes `openid email profile`).
- A Student's Canvas token (release 2) never reaches server storage; the one stored Canvas token is
  the Maintainer's Sync Token, encrypted in Vault and readable only by the sync role (ADR 0001).
- Guests leave no ticks or account on the server.
- No ads, analytics or tracking scripts. A content security policy limits the page to its own
  server and database, Google Fonts, and Google during sign-in, and forbids framing.
- Written answers to graded questions stay inside the Group (ADR 0002); privacy is enforced in the
  database, not only in the page (ADR 0003).
- Hosted on Hetzner in the EU over HTTPS. The sync reads Canvas with GET requests to a fixed list
  of course paths and stores nothing about any Student.
- Signed in, the Hosted app view has a two-step button that deletes the account and its ticks
  from the server (`public.delete_my_account`); ticks in the browser stay.
- The code is public: https://github.com/laszloprekop/ltu-study-tracker

## What an assessment needs

Every dated quiz, lab hand-in and exam is linked to the material it tests, so a walk from the
event reaches the pages, and a page reaches the events it counts for. The rule, applied by the
page: the other items under the assessment's own heading; when it sits alone under its heading
(every Z0025E quiz), the items before it in the module, minus those under a heading that holds
another assessment. Then the `needs` refs from the plan. Hand-ins, exams and links are never
material. Ungraded practice quizzes get no rule, only refs. An assignment Canvas lists in no
module (the Z7005E home exam) is placed in the module its number names, flagged `unlisted`, and
gets only its refs. The level (MUST/NICE) does not travel along these links.

## Map view

A fourth tab that fits the window: the page never scrolls in it, the rail and the details pane scroll on their own (on narrow screens it falls back to a scrolling page). Left: the coming events (sessions, deadlines, tasks) as a timeline, titles only.
Centre: a clock in two zones: an outer band for everything with a date, an inner disc for the Canvas material; neither is drawn, the week ticks and the pills mark the ring. The study period runs once around a ring, starting at the top and going
clockwise, with a tick and label per week, and a wedge across the band spanning all of today's events (a hairline when there are none). Every dated thing (session,
deadline, task) sits just outside the ring as a small pill (day and kind icon), one slot each,
evenly spaced in date order; week ticks and the today spoke land between their neighbours. Each
pill is tied by a spring to the Canvas page it points at. Inside the ring the
Canvas structure floats in a force layout: course to module to section (Canvas's own headings,
when a module has several) to item; nodes repel, links attract, each level has a gentle home radius (courses in the middle, modules, sections and items a little further out, kept close so a module's cluster stays together), and the springs to the ring pull each page toward the time it is taught. Inner nodes are circles sized by level: the course (its prefix letters), modules (their number), sections (a letter), items (their kind icon), with the title underneath; module titles are never shortened. A legend sits in the graph's top-left corner. Nodes are not draggable; drag
the background to pan, scroll to zoom, click a module or section to open it. Selecting never moves
the layout, positions are remembered per viewer, and when a module opens only its new nodes
settle while everything already placed stays put. The full title replaces the short one under a hovered or selected node. Hovering or selecting highlights the whole chain in
both directions, as far as the links keep pointing the same way: up through parents,
prerequisites and the events pointing in, down through children and what depends on it, plus every event on the ring tied to anything in the chain. Ties
from events to a folded module do not count, but a selected event whose page is folded walks from the
folded module: Midterm 1 lights Modules 1 to 4 when Module 10 is open, and Modules 1 to 8 when it is
folded, because the folded module then stands for both midterms. A **Reach** slider (1 to 4 hops or all, remembered) caps how far the chain walks from the node; the jump to the ring counts as a hop. **Re-settle** forgets the saved positions and lays the material out afresh. **Unhide closed** (toolbar, on by default) opens every module
and section and fades sections and items, labels hidden, until they join a hovered or selected
chain; the viewer's own open/closed choices are kept for when it is off. A toggled button is filled blue with inverted text. Hovering a node also
previews its details in the right pane; a click pins them. So any item is zero clicks from its
information and one from keeping it. Dashed blue edges
show what a session's page depends on (its `prep`), dotted red edges what an assessment needs
(bundled to the module while it is folded, so a closed module still shows it feeds the exam), a red dot marks MUST, a blue tint marks this
week's material. Right: details of the chosen event or node, with the tick box, mute, Canvas links
and everything connected to it. On opening, today's first event is selected, or the next one coming up. The caret in the rail heading folds it to a thin timeline over the map's left edge. One continuous timeline of the whole study period in three zoom levels (scroll over it, or the +/- at its foot): one row per day, per hour, or per quarter hour; zooming keeps the moment under the pointer in place and the rest of the period stays around it, drag to slide the window; the band is 07:00 to 19:00 plus a "later" row for the 23:59 deadlines. Every event is a stack of squares, one per row it covers, coloured by course (hollow when ticked, ringed in cyan when selected); at the study-period level a day's events stack as half-height bars in one column, zoomed in overlaps sit in the next lane. The strip is built once at quarter-hour grain and a zoom level is only a height rule per row: zooming out sets rows to zero height, zooming in grows them back, so the transition is heights tweening and nothing appears or disappears. Runs of empty rows collapse to a zig-zag labelled with the time they stand for. A cyan line marks now. Hover or focus shows the date and title, a click selects it. The map widens underneath. Remembered per viewer. Shift-click (or Cmd/Ctrl-click) adds to or removes from the selection; every selected chain lights, the details show the last one picked with a count and a Clear button. The selection is shared: a node lights the events that point at it
(and, lighter, the sessions that need it first, or every event inside a module), an event lights
its node. Which modules are open is remembered per viewer. Link chips everywhere are icons (Zoom,
recording, submit, module, page, booking, download) with the label on hover.

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
