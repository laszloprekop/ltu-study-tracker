# Where agenda data lives in Canvas

Scanned 2026-09-25 against `ltuedu.instructure.com`, courses 613 (Z7005E Programvaruteknik) and
614 (Z0025E Computer Networks), with a student token. Counts are from that scan.

## Hierarchy

```
Course (613 / 614)
├─ Syllabus tab                      prose, no dates
├─ Front page / "Schema" page        the ONLY place with session times (lectures, workshops, lab slots)
├─ Modules            613: 8   614: 13
│   ├─ SubHeader      grouping label only ("Lectures", "Module Quiz", "Lab 3 - PTSkills 6 - 7")
│   ├─ Page           lecture pages, instructions, overviews
│   ├─ Discussion     self-paced lecture videos and Q&A (613: 41, 614: 13), never dated
│   ├─ Assignment     613: 11, 614: 16  <- the only objects that carry due dates
│   └─ ExternalUrl    Zoom rooms, the Google Docs lab signup sheet
├─ Announcements      614: 2 ("Welcome to Week N", carries that week's plan). 613: none
├─ Files              613: 261, 614: blocked (403)
└─ Calendar events    NONE in either course (confirmed 0 via /calendar_events)
```

## What carries a date

| Kind | Where | Count | Notes |
|---|---|---|---|
| Lab and portfolio deadlines | Assignment `due_at` | 613: 8, 614: 6 | `online_upload` |
| Quizzes and midterms | Assignment `due_at`, `external_tool` | 614: 10 | 8 module quizzes all close 2 Dec, 2 midterms |
| Ungraded practice quizzes | Assignment, no `due_at` | 613: 3 | pattern quizzes 3.6.1 to 3.6.3 |
| Weekly plan changes | Announcement `posted_at` | 614 only | e.g. "week 2 is self-paced, no lectures" |
| Lecture / workshop / lab session times | Page prose | - | 613 "Schema" page; 614 announcements and lecture pages |
| Module release | Module `unlock_at` | 614 only | all set to mid-September, so not a real schedule |

**The gap:** no session times are machine-readable. Canvas holds no calendar events for either course,
so the timetable can only be read by a human from the Schema page and announcements. Deadlines, by
contrast, are fully machine-readable.

## How things link together

- **One call spans both courses:** `GET /planner/items?start_date=&end_date=` returns assignments and
  announcements from every enrolled course in one date-sorted list, each with `context_name`,
  `html_url`, `plannable_type` and points. 26 items for this term. This is the single feed a merged
  view should be built on.
- **Module item to content:** each module item has `type`, `content_id` and two links: `html_url`
  (the item inside its module, keeps the surrounding context) and `url` (the API object). An
  assignment's `id` equals the `content_id` of its module item, which is how a deadline is tied back
  to the material around it.
- **SubHeaders give a deadline its neighbours:** in 614 Module 9, each `Lab N - ...` subheader is
  followed by that lab's submit assignment, so the subheader names what the deadline is about.
- **Numbering is the real cross-reference:** `module.section.item` (`9.4`, `3.5.4`, `1.8`). Lab
  instructions `9.1` and signup sheet `9.2` belong to submissions `9.4` to `9.10`. Sorting by this
  number reconstructs the intended order inside a course.
- **Completion state:** 614 module items carry `completion_requirement` (`must_view`, `must_submit`)
  with a per-student `completed` flag, so Canvas already knows which material you have opened.
- **The Schema page links out:** 74 links, mostly to `/courses/613/modules/<id>`, so each week in the
  prose schedule points at the module it covers. No tables, only lists, so parsing it is text work.

## Consequences for this project

1. Deadlines should be generated from Canvas, never typed. They are complete and exact there.
2. Session times must stay hand-written in `ltu-study-tracker.html`, because Canvas has none.
3. A merged cross-course view is one `planner/items` call plus the module context looked up per
   assignment.
4. 614 announcements are worth surfacing: they change the week's plan.

## Rescan 2026-09-25: calendar feeds and the work inside nested pages

### Calendar feeds add nothing
- The personal iCal feed (`/users/self/profile` → `calendar.ics`) holds 24 events: 22 assignment
  deadlines from the two courses and 2 unrelated. No lectures, workshops or lab sessions.
- `GET /calendar_events` for the user context and for both courses: 0 events. `type=assignment`
  gives the same 27 deadlines the assignments endpoint gives.
- So the feed is exactly the assignments list in another format. The timetable exists only in prose.

### Where the prose timetable is, and how parseable it is
- **613 "Schema" page:** 42 dated list items. Sessions read `HH:MM - HH:MM: Del X.Y – Föreläsning N
  i Zoom (link)`, deadlines read `Vecka W D/M (HH:MM) - [Grupp] X.Y Laboration N`. The `Del X.Y`
  reference is the module item number, so each session can be tied to its page. Some sessions carry
  preparation: `(att ha tittat på innan: Modul 2.3)`.
- **614 Homepage:** session dates and times in prose (17 Sept 14:30, 28 Sept 09:00, ...), plus the
  weekly announcements ("week 2 is self-paced, no lectures").

### The buried work, by course
Each module item has `html_url`, so every entry below can be linked directly.

**613 Z7005E** (no completion rules, Canvas does not track what you have done)
- Module 0, workplace wellbeing: 55 items, 11 workbook exercises ("Do Exercise N in your
  workbook"), about 25 short videos, 30 discussion prompts. Course says "when you have time".
- 18 Zoom lecture pages (`X.Y Zoom 🖥️ (Föreläsning N)`): recording plus slides (PPTX and PDF).
- 6 workshops with instructions to read before the session (Workshop 1: 282 words, Workshop 2: 677
  words and 6 files, Workshop 6: 565 words).
- Self-paced Software architecture block (3.4 to 3.6, 4.2): 24 pages of 200 to 660 words, one video
  each, 2 exercise pages with solution pages, 3 ungraded pattern quizzes, 5 reflection discussions.
- Labs: 350 to 1,400 words each. Lab 1 states "Tidsåtgång: ~8 timmar". No other estimates.

**614 Z0025E** (every item has a completion rule, so the API reports done or not, for the token's owner)
- Per module, 8 times: overview page (~1,000 words) → 1 or 2 lecture pages (2,000 to 3,000 words,
  1 to 4 videos, 50 to 110 embedded knowledge-check questions each) → 1 self-paced lecture as a
  discussion that requires a post (`must_contribute`) → module quiz → end page.
- Pre-knowledge: 7 polls, `[2min]` each, `must_contribute`.
- Labs: each has three activities (lab sheet from attached files, report upload, Zoom presentation),
  5 to 10 attached files each, 350 to 950 words of instructions.
- Midterms: instructions page plus study guide references.

### Completion tracking
614 rules per item: `must_view`, `must_mark_done`, `must_contribute`, `must_submit`, each with a
`completed` flag for the calling user. Read via `/courses/614/modules?include[]=items`. 613 has none.
This state belongs to the token's owner only, so a shared page cannot show it for other viewers.
