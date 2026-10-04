# How the page behaves

The tracker page's views and controls, in detail. Shared by the hosted app and the claude.ai page.
Back to the [README](../README.md).

## Header, profile menu, footer and the info views

- Header: text size, theme and palette stay as shortcuts; **?** opens Help; the person icon at the far right
  opens the profile menu: the account (Sign in with Google, Sign out), display settings (pulse,
  course colours, working hours), the Student's Canvas token and Groups, Calendar Links, progress
  (Import, Go back to a day, Export) and deleting the account. Laid out as a bento grid.
- Footer: About, Help, Privacy, Terms, the code, when Canvas was last read, and the disclaimer.
- About, Help, Privacy and Terms are views of their own (`renderInfoView`), written plainly in the
  card marks (lists, `code`, **terms**, a Key line) and laid out as bento grids.
- Icons are Phosphor only, all 16 px except the banner's large alert; the build stops on an icon
  name that is not in `assets/icons` (`tools/fetch-icons.sh` fetches them).
- Elements with the cut top-right corner keep their frame along the cut: a 1 px diagonal drawn on
  the inside of the cut, measured from the outer edge like the clip.
- The favicon is a glacier teal square with the cut corner: `tools/make-favicon.py` writes SVG, ICO and a
  180 px PNG to `assets/favicon/`; the app serves them from its head, the page carries the SVG inline.

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

Row 1: study period tabs, then text size, theme (light, dark, or follow the system; "system"
hands control back to the viewer's own theme) and palette (snowflake: Ice, lightning: Neon; kept
per viewer in `ltu-plan-palette`), **?** (opens Help), and at the far right the
profile menu (person icon). Every other setting lives in that menu: Sign in or out, the pulse
(target), course-coloured titles (beach ball, on by default), working hours, the Canvas token and
Groups, Calendar Links, progress (Import, Go back to a day, Export) and deleting the account.
Every link into Canvas ends with the external-link mark. Row 2: view, course filter, jump to
Today, and one progress block (green bar deadlines and tasks, blue bar material). Below the sticky
header: the full course names of the selected term and its period.

## Palettes

`tools/palette.mjs` generates every colour (`npm run palette` writes them between the
`palette:start` and `palette:end` markers in the template), each palette in light and dark, all in
OKLCH. **Ice** is the default: low chroma, a frosted Nordic mood, courses glacier, moss, heather,
cloudberry and twilight, rust for alerts, heather for Now, sky blue for announcements, soft
shadows. Its fills are dim and the text on them carries the colour, like a status badge. **Neon** (`data-palette="neon"` on the root) is the earlier fluorescent set with its cyan
glow in dark mode. Text colours reach WCAG AA (4.5:1) on every background in both; `node
tools/palette.mjs --check` prints the main pairs. Mix colours in OKLCH (`color-mix(in oklch, ...)`).
The shadows of flip cards and popups (`--card-lift`, `--pop-lift`) belong to the palette too.

Colour roles follow Material Design 3. Each accent role X (`c1` to `c5`, `alert`, `now`) has
`--X` (text and strokes on the surfaces), `--on-X` (text on a solid `--X`), `--X-container` (the fill
for chips, tags, selected controls and map nodes) and `--on-X-container` (text on that fill), plus
`--X-soft`, a faint wash behind ordinary text. Announcements are `--ann-container` and
`--on-ann-container`. A course's role reaches an element as `--cc`, `--on-cc`, `--cc-container`,
`--on-cc-container` and `--cc-soft` (`colorVars`). Pick the pair, never mix a fill with another
role's text: that is what keeps both palettes legible.

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

## Prepare lines

In the week view an assessment (a module quiz in a material block, a lab report or other single
deadline row) carries a **Prepare** line: the items it tests, from `needsOf` (the items before it in
its module or section, plus `NEEDS_LP2`), the same list as the map's Needs section. Every link
leads to something to study: an item with Cards made from it opens the Cards view filtered to those
Cards (its number carries the count), any other item opens in Canvas. When the assessment has a
Card Set, a Cards chip in front opens it. Cards exist on the hosted app only, so on the claude.ai
page every link goes to Canvas; the hosted app loads the Cards when the page opens. Ticked items are
struck through, the line counts what is ticked and the minutes left, and it fades when everything
is ready. Grouped deadlines (the quizzes all due on one day) have no line; their quizzes carry it in
the material blocks.

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
