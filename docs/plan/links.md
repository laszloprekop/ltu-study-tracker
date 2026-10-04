# Links, sharing and Pins

Agreed 2026-10-04. Stage 1 (Links and Share) built the same day; stage 2 (Pins) is next.

## The idea

Every view and every row on the page has an address, a **Link** (CONTEXT.md). Share hands a Link
out; a Pin keeps one for yourself. Routing, sharing and pinning are one mechanism, so a share or a
pin can never point somewhere the router cannot open.

## Addresses

After `#`, so no server route is needed and Google sign-in returns to `/` unchanged.

| Address | Opens |
|---|---|
| `#/week`, `#/day`, `#/all`, `#/map`, `#/cards` | that view |
| `#/about`, `#/help`, `#/privacy`, `#/terms` | the info views |
| `#/week/2026-10-12` | Week by week, at that week |
| `#/week/<row>`, `#/all/<row>` | that view, scrolled to the row and lit for a moment |
| `#/day/2026-10-14`, `#/day/2026-10-14/<row>` | Day on that date, optionally at a row |
| `#/map/<key>` | Map with that key selected (`gotoKey`) |
| `#/cards/set/<filter>` | Cards with that filter: a Card Set `Z0025E:3043` or a Source `m:Z0025E:<id>` |
| `#/cards/<uuid>`, `#/cards/<uuid>/answer` | one Card on its own, on the side it was shared from |

Query: `?term=<id>&course=<code>`. Row ids are the tick ids (`d:`, `t:`, `m:`), the session key
`s:<course>:<date>:<start>` and `a:<course>:<announcement id>` for announcements.

## Rules

- An address wins over the remembered view. A bare address opens the last view, as before.
- The address follows what is on screen. A view, a term or one Card is a step Back returns to;
  filters, a flip and a Day step only replace the address.
- Course and term go in the address; personal choices (hidden cards, trust scale) do not.
- A Link carries no Ticks, ratings, Reviews or anything else of the person sharing it.
- Opening a Link wins over folds, the course filter and the viewer's own Mute, and saves none of
  it. A muted target says so, with Unhide.
- A Link to something gone says so. A session that moved: the same course's session in the same
  week is shown instead.
- Cards stay for signed-in Students. A Card Link opened signed out asks for sign-in; the bridge
  keeps the address in `sessionStorage` across the Google round trip. Answer Cards have no Share.
- Share and its controls are on the hosted app only. The artifact runs the same router but keeps
  its plain Mute button.
- Share uses the device's share menu on touch screens, else copies the address ("Link copied").
  The text is the course code and the title, Canvas names as Canvas has them.

## Stage 1, built

- Router: `routeOf`, `parseRoute`, `applyRoute`, `currentRoute`, `syncRoute`, `focusTarget` in
  `src/template.html`, tested by `tools/test-routes.mjs` (`npm test`).
- Every row (task, deadline, session, material item, announcement) carries `data-link` and, on the
  hosted app, a ⋯ menu with Share and Hide in place of the Mute button.
- Cards: Share on each Concept and Question Card, "Share this set" in the Drill heading, a
  one-card view with "All cards".

Not verified yet: a real signed-in session on the hosted app (tested on a static copy with stub
cards), the phone share menu, and the sign-in round trip keeping a Link.

## Stage 2: Pins

- A **Pin** is a Link a Student keeps in their Personal Layer: the address plus the title at
  pinning time, shown only when the target is gone ("Lab 3 (no longer exists)"). The live title
  is used otherwise.
- Stored per Student like Ticks: a new migration with RLS tests on the hosted app, localStorage
  when signed out. Never a shared path.
- Pin joins Share in the ⋯ menu; "Pin this view" pins the current address with its filters.
- A **Pinned** view, for signed-in Students only: rows that can be renamed, reordered and removed.
- Pins hold page addresses only, never outside links; a Canvas file is pinned through its material
  item.
