# Release 2: the Student's own Canvas, Groups, calendars and Bookings

Goal: a signed-in Student sees what Canvas has recorded for them next to their own Ticks, their
Group's lab booking with a warning before it is too late, and their own calendar's events among the
Course Plan. Terms as in `CONTEXT.md`; decisions in `docs/adr/`. Everything here appears only on
the hosted app; the claude.ai page keeps working as before.

Done when: with a Canvas token pasted, a handed-in lab shows the Canvas mark, a ticked lab with no
submission shows the Conflict sign, the Group number is known, the Lab 3 Booking shows its stage,
and a calendar link's events appear marked as the Student's.

## Steps

### 1. The Canvas relay and the token

Done 2026-10-03. Tested: wrong origin 403, malformed token 400, rejected token 401, bad course
ids 400, GET 405, the 13th call a minute 429, and no token in the server log.

- The Student pastes a Canvas personal access token in the Hosted app view. It is kept in that
  browser only (localStorage), shown masked, and can be forgotten with one button (ADR 0001).
- `POST /api/me/canvas` carries the token in a header to the server, which calls Canvas with it
  and answers with only what the page needs. The token is never written anywhere on the server,
  not even to a log. The route accepts only same-origin requests and is rate limited per address.
- It reads, for each Course: module items with their completion requirement, the Student's
  submissions, and the Student's Groups. GET only, to an allowlist of these paths.

### 2. Completion and Status marks

Done 2026-10-03, tested with made-up relay data in the browser; not yet with a Student's real
token.

- Each task row gets a second mark next to its tick box: Canvas's (read-only).
  Confirmed (both), Done by Canvas, Started (opened, with the setting off), the minus sign for
  Untracked by Canvas, or the Conflict sign (ticked, but Canvas can see the task and has nothing).
- What counts as done for the page's counts and greying: the Tick or a Completion, except that
  "opened" counts only with the setting "Opening a page in Canvas counts as done" (on by default).
- Submitted means `submitted_at` set or `workflow_state` submitted, graded or pending review;
  scores are never read.

### 3. Groups

Done 2026-10-03: from Canvas, with an override per Course in the Hosted app view (kept in the
browser for now, not yet with the Account).

- The Group number per Course comes from `/users/self/groups` ("Lab Group 8", "Projektgrupp 8"
  give 8). The Student can override it per Course in the Hosted app view. Stored in the browser
  with the token, and with the Account.

### 4. Bookings from the signup sheet

Done 2026-10-03. The sheet parser is tested against the real layout (`npm test` in `app/`) and
reads the live sheet; the route refuses anyone not signed in. Stages tested in the browser with
made-up Booking data; not yet with a real session. Claims from a Calendar Event or entered by a
member, and pinning a slot, are left for later.

- `data/plan.mjs` names each Booking: course, the assessment it is for, the sheet, the section.
- `GET /api/bookings` (signed-in only) reads the sheet's text export, at most every five minutes,
  and returns per Booking: the session's date and slot times, how many slots are free, and the
  slot of the Group the request names. No names ever leave the server; they are dropped while
  parsing.
- Stages: Not open yet, Open, Due (seven days before the session, or the plan's deadline), Urgent
  (two days before, or one free slot left), Claimed. Shown on the booking task's row and at the
  top of the page.

### 5. Calendar Links

- Signed in, a Student saves one or more secret iCal links (table `calendar_link`, owner-only).
- `GET /api/me/calendar` reads the signed-in Student's links with their own session, fetches each
  feed (https only, size and time limited), parses the events of the coming weeks and returns
  them. The page shows them on their day, marked as the Student's.
- A Calendar Event whose description holds a Canvas assignment link is tied to that assessment.

## Not in release 2

The Day Plan view (release 3), Cards (4), Chains (5), notifications, storing Student tokens.
