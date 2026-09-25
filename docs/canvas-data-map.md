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
