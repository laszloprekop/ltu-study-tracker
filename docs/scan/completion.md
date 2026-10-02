# Completion and progress signals in Canvas

Scanned 2026-10-02 against `ltuedu.instructure.com`, courses 613 (Z7005E) and 614 (Z0025E), with a
student token, GET only. The question: where can the tracker take "done" from Canvas, and where
does only a Tick know?

This page describes shapes and counts of kinds. It holds no one's actual states, scores or grades.
Every example value below is made up and marked `(made up)`.

## Every signal a student token can read

| Signal | Endpoint | Fields | Flips when | Covers | Caveats |
|---|---|---|---|---|---|
| Module item requirement | `GET /courses/:id/modules?include[]=items&include[]=content_details` | item `completion_requirement: {type, completed}`; `min_score` only when type is `min_score` | `must_view`: the item is opened (page, or an ExternalUrl clicked through its module link). `must_mark_done`: the student presses "Mark as done" on the page. `must_contribute`: the student posts a reply. `must_submit`: a submission arrives (New Quizzes: when the attempt is turned in). | 614: 68 items (see below). 613: none, it sets no requirements. | `&student_id=self` is refused (403) for a student; leave it off, the items already answer for the caller. `must_view` means opened, not read or watched. `must_mark_done` is a click the student makes, not evidence. Progressions are recalculated by a background job, so a flag can trail the action by seconds to minutes. `min_score` is used in neither course. |
| Module state | same call, module object | `state` (`locked`, `unlocked`, `started`, `completed`), `completed_at`, `require_sequential_progress`, `prerequisite_module_ids` | all of the module's item requirements are met | a whole module in 614 | A module with no requirements reports `completed` at once: every 613 module and the 614 modules without requirements read `completed` with a `completed_at`, which means nothing. The student's module object carries no `completion_requirements` array; the rules are only on the items. No module in either course is sequential or has prerequisites. |
| Course progress | `GET /courses/:id/users/self/progress`, or `GET /users/self/courses?include[]=course_progress` | `requirement_count`, `requirement_completed_count`, `next_requirement_url`, `completed_at` | sum of the item flags above | a per-course progress bar | 614: `requirement_count` 68 (equals the item count below). 613: 0, so useless. A count only, it does not say which items. |
| Submission | `GET /courses/:id/students/submissions?student_ids[]=self&include[]=assignment` (add `include[]=submission_history` for every attempt) | `workflow_state` (`unsubmitted`, `submitted`, `graded`, `pending_review`), `submitted_at`, `attempt`, `submission_type`, `late`, `missing`, `seconds_late`, `excused`, `score`, `grade`, `entered_score`, `graded_at`, `posted_at`, `redo_request`, `cached_due_date`; with the assignment: `points_possible`, `grading_type`, `submission_types`, `group_category_id` | the student (or a group mate) submits; the teacher grades or excuses; `missing` is set by a job once the due date passes without a submission | every assignment: hand-ins, labs, quizzes, midterms, the home exam. 613: 11, 614: 16 | `score` and `grade` stay `null` until the teacher posts grades (`posted_at` null). 613 grades `pass_fail`, so `grade` is `complete`/`incomplete` (made up example: `"complete"`), not points. 614 grades `points`. Group assignments (613: 7, 614: 6) count one member's upload for the whole group. `late`/`missing` are always false when there is no due date (613's 3 practice quizzes). |
| New Quizzes attempt | the submission above, for assignments with `submission_types: ["external_tool"]` on `ltuedu.quiz-lti-dub-prod.instructure.com` | `workflow_state`, `attempt`, `submitted_at`, `score` (when posted) | the quiz attempt is submitted and the tool passes the result back | 614: 8 module quizzes + 2 midterms. 613: 3 ungraded pattern quizzes | The New Quizzes API itself (`/api/quiz/v1/...`) is refused (403) for students, so per-question answers and in-progress attempts are invisible. Unlimited attempts (`allowed_attempts: -1`) on all of them. No attempt was observed in this scan, so the exact moment the passback lands is from Canvas documentation, not measured. |
| Classic quiz | `GET /courses/:id/quizzes`, `/courses/:id/quizzes/:qid/submissions` | `quiz_submissions[]` with `workflow_state`, `attempt`, `finished_at`, `score` | the student finishes an attempt | 614: 1 classic quiz, a `survey`. 613: endpoint 404 (quizzes tab off) | Not used for anything graded in these courses. |
| Planner item | `GET /planner/items?start_date=&end_date=` | `plannable_type`, `plannable_id`, `submissions: {submitted, graded, late, missing, excused, needs_grading, has_feedback, redo_request, posted_at}` (or `false` for announcements), `planner_override`, `new_activity` | `submissions` follows the submission; `planner_override` follows the student's own check in the Canvas planner | only things with a date: 27 items this term (613: 8 dated assignments, 614: 16 assignments + 3 announcements) | Pages have no `todo_date` in these courses, so no reading, lecture or video ever appears here. The `submissions` object is a summary of the submission row, no extra truth. |
| Planner "mark done" | `GET /planner/overrides` (also embedded as `planner_override` above) | `plannable_type` (`assignment`, `wiki_page`, `announcement`, `discussion_topic`, ...), `plannable_id`, `marked_complete`, `dismissed`, `workflow_state`, `updated_at` | the student ticks the item in the Canvas planner or dashboard to-do | the same dated items only | A self-report, exactly like a Tick but stored in Canvas. Ticking an assignment there does not submit it. Usable as a second source of Ticks for dated items, not as evidence. Writing one (`PUT`) is out of scope: the tracker stays read-only. |
| Discussion read state | `GET /courses/:id/discussion_topics` | `read_state` (`read`/`unread`), `unread_count`, `subscribed`, `require_initial_post`, `user_can_see_posts` | the student opens the topic (read); new replies raise `unread_count` | 613: 37 module discussions (23 self-paced video lectures, 14 prompts). 614: 13 topics | Opened, not watched or answered. The student can also mark a topic unread by hand. `user_can_see_posts: false` on a `require_initial_post` topic means the student has not posted yet; 614 has 11 such topics (already covered by `must_contribute`), 613 none. Whether the student posted in a 613 topic is not on the topic; it would need one `/discussion_topics/:id/view` call per topic and a search of `view[]` for the caller's user id. |
| To-do list | `GET /users/self/todo`, `GET /courses/:id/todo` | `type` (`submitting`, `grading`), `assignment`, `ignore`, `ignore_permanently`, `html_url` | an assignment is due soon and not submitted | dated assignments | Derived from submissions; adds nothing. |
| Missing submissions | `GET /users/self/missing_submissions?filter[]=submittable&course_ids[]=` | assignment objects | past due and not submitted | dated assignments | Same truth as the `missing` flag. |
| Enrollment activity | `GET /courses/:id/enrollments?user_id=self` | `last_activity_at`, `total_activity_time`, `last_attended_at`, `grades.{current_score, final_score, ...}` | any page load in the course | nothing per item | `last_attended_at` is empty in both courses (no Canvas attendance). Course totals only. |
| Page views, analytics | `/users/self/page_views`, `/courses/:id/analytics/users/self/*` | | | | Refused (403) for this student token. |
| Pages list | `/courses/:id/pages` | | | | 404 in both courses (pages tab hidden); pages are only reachable through modules. |

### What the web UI shows for the same data (inferred from the API, not checked in a browser)
- The Modules page puts a requirement icon ("View", "Mark done", "Contribute", "Submit") beside each
  614 item and a check once `completion_requirement.completed` is true; 613 shows no icons, matching
  its empty requirements. A module header "Complete" pill is `state: "completed"`, which is why every
  613 module would look complete without anything being done.
- The Grades page "Late" and "Missing" pills are the submission `late`/`missing` flags; a grade cell
  stays empty while `posted_at` is null.
- The checkbox beside a planner or dashboard to-do item is `planner_override.marked_complete`.

### Would a classmate's token see the same?
Yes in shape: every endpoint above answers for the caller only, with the same fields and the same
course structure (68 requirement items in 614, none in 613). The values are theirs alone. A student
token cannot read anyone else's (`student_id` and `student_ids[]` other than `self` are refused), so
the shared page can show Canvas completion only to a viewer who has connected their own token.

## Coverage per course

Counts are module items by the tracker's `kind` (from `data/canvas-inventory.json`) plus the
hand-written sessions and tasks in `data/plan.mjs` for LP2.

### Z0025E (614)

| Kind | Items | Authoritative Canvas signal | Tick only |
|---|---|---|---|
| lecture page | 12 | 10 `must_mark_done`, 1 `must_contribute` (a click, but it is the course's own record) | 1 |
| reading | 12 | 10 `must_view`, 1 `must_mark_done` | 1 |
| overview | 11 | 9 `must_view`, 1 `must_mark_done` | 1 |
| wrap-up | 8 | 8 `must_view` | 0 |
| instructions | 3 | 1 `must_view` | 2 |
| link (Zoom, signup sheet) | 3 | 2 `must_view` | 1 |
| poll | 7 | 7 `must_contribute` | 0 |
| self-paced lecture (discussion) | 4 | 4 `must_contribute` | 0 |
| module quiz (New Quizzes) | 8 | 8 `must_submit` + submission | 0 |
| hand-in (lab report) | 6 | 6 `must_submit` + submission (group) | 0 |
| midterm | 2 | submission only (no module requirement) | 0 |
| **module items, total** | **76** | **70** | **6** |
| sessions (12 lectures, 5 labs, 1 more lecture) | 18 | none: no attendance in Canvas | 18 |
| hand-written tasks | 4 | none | 4 |

Caveats: `must_view` on a lecture page with videos says opened, not watched. A lab's Zoom
presentation and its lab sheet work have no signal of their own; only the report upload does.

### Z7005E (613)

| Kind | Items | Authoritative Canvas signal | Tick only |
|---|---|---|---|
| hand-in (lab, portfolio) | 7 | submission (`pass_fail`, mostly group) | 0 |
| practice pattern quiz (New Quizzes, no due date) | 3 | submission | 0 |
| home exam (in no module) | 1 | submission | 0 |
| self-paced video lecture (discussion) | 23 | weak: `read_state` (opened) | 23 |
| discussion prompt | 14 | weak: `read_state`; posting needs one call per topic | 14 |
| session page (Zoom lecture, workshop) | 24 | none | 24 |
| reading | 19 | none | 19 |
| video page | 16 | none | 16 |
| exercise | 5 | none | 5 |
| wrap-up | 4 | none | 4 |
| **items, total** | **116** | **11** (plus 37 weak) | **105** |
| sessions (14 lectures, 6 workshops, seminar, interview, exam) | 23 | none | 23 |
| hand-written tasks | 9 | none | 9 |

613 sets no completion requirements, so its module states and course progress are empty or
trivially "completed". Only its assignments carry a real Canvas record.

## What this means for the tracker

1. In 614, Canvas can be the source for 70 of 76 module items: the item flags for 68, submissions for
   the 2 midterms. Ticks remain for the other 6 items, all 18 sessions and the 4 tasks.
2. In 613, Canvas is the source only for the 11 assignments, through submissions. Everything else
   needs a Tick. `read_state` on discussions could pre-fill a hint ("opened in Canvas") but should
   not count as done.
3. The `progress` command in `tools/canvas-sync.mjs` reads only the module item flags, so today it
   sees nothing in 613 and misses the 614 midterms. Adding the submissions call covers both.
4. "Submitted" and "graded" are different facts: `workflow_state` gives submitted at once, `score`
   and `grade` only after the teacher posts. A tracker that shows done should key on submitted.
5. The Canvas planner's "mark done" is another Tick, not proof, and reaches only dated items.
