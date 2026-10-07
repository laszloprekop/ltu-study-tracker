# LTU Study Tracker

A study planner for students in a set of LTU Canvas courses: what is due, what to study before it,
and what has been done.

## Language

### People and layers

**Course**:
One Canvas course the tracker knows, together with its hand-written plan. Courses are data: adding
one adds a record, not new behaviour. Today: Z7005E and Z0025E.
_Avoid_: Class, subject

**Course Plan**:
Everything about a Course that is the same for every student: modules, deadlines, sessions,
announcements and the hand-written parts (session times, needs, weekly notes). Its Canvas parts
are synced hourly with the Sync Token, its hand-written parts come from the Maintainer; shown,
with its last sync date, to anyone, with or without a token.
_Avoid_: Shared data, public view, fallback

**Student**:
A person using the tracker for their own study. May or may not have connected a token.
_Avoid_: User, viewer

**Maintainer**:
The Student whose token syncs the Course Plan and who edits its hand-written parts.
_Avoid_: Admin, owner

**Sync Token**:
A Canvas token the Maintainer creates only for syncing the Course Plan: expiring, stored
encrypted, used only to read. The one Canvas token the tracker keeps; a Student's token is kept only
if they opt in.
_Avoid_: API key, admin token

**Account**:
A Student's Google login, under which their Personal Layer is kept across devices. A Student
without one is a **Guest**: their Personal Layer lives in one browser and merges into the Account
at its first login.
_Avoid_: Profile, user

**Group**:
The Canvas group a Student belongs to in one Course, known by its number ("Lab Group 8" and
"Grupp 8" are the same Group). Read from Canvas with the Student's token by default; the Student
may set it by hand when Canvas is wrong. A Booking belongs to a Group, not to a Student, unless the
Student has **pinned** a slot as theirs, which overrides the Group for that one Booking.
_Avoid_: Team, lab partners

**Personal Layer**:
What belongs to one Student and only they see: their Canvas completion, submissions, grades and
own deadline overrides, their calendar events, ticks and card reviews. Ticks and reviews work
without a token; the Canvas parts need one.
_Avoid_: User data, profile

**Group Layer**:
What one Group's members share and nobody else sees: claimed Bookings entered by a member,
and Answer Cards. Membership is confirmed from Canvas while a member is signed in with a token.
_Avoid_: Team space, shared data

**Calendar Link**:
A secret iCal address a Student gives the tracker so it can read a calendar's events. Read-only,
so it may be stored with the Account, unlike a Student's Canvas token.
_Avoid_: Calendar URL, feed, ICS

**Calendar Event**:
An event read through one Student's Calendar Link. Part of their Personal Layer, shown among Course
Plan events but marked as theirs. Belongs to the Student even when the calendar is a group's.
_Avoid_: Group event, session (a session is in the Course Plan)

### Planning

**Key Event**:
A moment where something is decided about a Student that they cannot redo on their own: a lab
session with the teacher, a workshop, a midterm, a presentation, an interview, the home exam, an
oral exam. Its kind gives the default; the Course Plan can say otherwise for one item.
_Avoid_: Milestone, assessment, exam

**Prep**:
Anything that feeds one or more Key Events: lectures, self-study, quizzes, hand-ins before a
session, self-organised group sessions, Card drills. Prep can carry its own deadline and points
and still be Prep. One Prep item may feed several Key Events, and may even fall after one.
_Avoid_: Baggage, prerequisite, material

**Chain**:
A Key Event together with all the Prep that feeds it, followed back as far as it goes. Shared Prep
belongs to several Chains at once.
_Avoid_: Dependency tree, baggage

**Workshop**:
A teacher-scheduled session where Groups work in pairs to a fixed agenda. A Key Event.
_Avoid_: Group session (that is a self-organised Calendar Event)

**Taught Date**:
When the Course teaches a Prep item, from its schedule or module week. A real date, even when it
falls after a Key Event that needs the item.
_Avoid_: Release date, unlock date

**Do-By Date**:
A date the tracker suggests for Prep with no Taught Date: a lead time before the first Key Event
it feeds. Never shown as if Canvas gave it.
_Avoid_: Soft deadline, target date

**Day Plan**:
One Student's day across all their Courses in 15-minute slots: sessions, deadlines, Calendar
Events, Bookings and the Free Slots between them. The view the tracker exists for.
_Avoid_: Agenda, schedule, today view

**Booking**:
A session that only takes place once a group claims a time in it, such as a lab assessment slot on
a signup sheet. It moves through Not open yet, Open, Due, Urgent, and Claimed; the warning grows
with each stage. A claim is read from the signup sheet, else matched from a Calendar Event, else
entered by one member of the Group for all of its members; a later entry replaces an earlier one.
_Avoid_: Reservation, signup

**Unplaced**:
Work that has to happen but has no time yet, such as an unbooked Booking or a group session not
yet agreed.
_Avoid_: Floating, TBD

**Free Slot**:
A gap in a Day Plan, inside the Student's working hours, where Unplaced work could go. The tracker
may hint which Free Slot fits an Unplaced item; it never places one by itself.
_Avoid_: Gap, availability

**Planned Block**:
Unplaced work a Student has put into a Free Slot. Part of their Personal Layer.
_Avoid_: Appointment, booking (a Booking is claimed with the teacher)

**Disagreement**:
Two sources in one Course giving different values for the same fact, such as a deadline in Canvas
and another in a PDF. Shown with a warning and every source until the Maintainer settles it; for a
deadline the earliest value stands meanwhile. Each Course's open Disagreements form a report that
can be sent to its teacher.
_Avoid_: Conflict (a Conflict is between a Tick and Canvas), inconsistency

### Cards

**Card**:
One prompt and its answer for spaced-repetition drill. Every Card is drafted by AI or a Student
from Course material and voted on by the Students who use it. It names at least one
**Source**: the Course Plan item it was made from. Which Key Events it serves follows from the
Chains its Sources belong to, never set on the Card itself. Its answer side links to its Sources.
_Avoid_: Flashcard, note

**Vote**:
A Student's public verdict on a Card: **legit** (correct and useful) or **fix** (faulty or needs a
fix, with an optional reason). One per Student per Card, changeable; never on a Card one wrote,
except an AI draft. Every Concept and Question Card is seen by everyone; its **Trust** follows from
its Votes: *needs fix* once fix Votes reach the legit ones, *trusted* with more legit than fix,
else *new*. Practice leaves out Cards needing a fix by default. The Maintainer settles a Card
voted fix: keep it (its fix Votes go) or remove it. Votes replaced the earlier Check and Flag
(2026-10-04).
_Avoid_: Review (a review is a drill of a Card), Check, Flag, approval, downvote

**Concept Card**:
A Card for one idea a Key Event tests, with a checked answer. Shared with every Student.
_Avoid_: Theory card

**Question Card**:
A Card whose prompt is a graded question, word for word, and whose answer side points to the
Concept Cards and Course material that answer it. Shared with every Student; never holds a written
answer.
_Avoid_: Exam card

**Answer Card**:
A written answer to a graded question. Visible only to the Group that wrote it, or only to one
Student when private. Never shared beyond that.
_Avoid_: Solution, model answer

**Card Set**:
The Cards that serve one Key Event's Chain, drilled as Prep for it.
_Avoid_: Deck

**Review**:
One drill of one Card by one Student, with how well they knew it. Part of their Personal Layer.
Reviews are planned so each Card is likely remembered on the day of the Key Event it serves.
_Avoid_: Check (a Check confirms a Card is correct), study

**Drill Goal**:
A Student's choice of how long Reviews continue: until the Key Event (the default), or until
mastered, carrying on past smaller Key Events towards the midterms and final exams. Until mastered
also keeps the Card Sets of Key Events that have passed, as quick practice.
_Avoid_: Mode, horizon

### Links

**Link**:
The address of a view, a row or a Card on the page, such as `#/all/d:Z0025E:3043`. Share hands a
Link out; it carries where to go and the term and course filter, never anything of the person
sharing it.
_Avoid_: Deep link, URL (a URL may point outside the page), share link

**Pin**:
A Link a Student keeps in their Personal Layer, shown in the Pinned view. Only page Links, never
an outside address.
_Avoid_: Bookmark, Favourite

### Progress

**Tick**:
A Student's own mark that one task is done, or its removal, with the time it last changed. The
Student can change it. When two copies of the same Tick disagree, the later change wins.
_Avoid_: Check, completion

**Completion**:
What Canvas records about a task for one Student: submitted, contributed, marked done or opened.
Read-only. Shown beside the Tick, and neither overrides the other.
_Avoid_: Canvas tick, progress

**Status**:
A task's state for one Student, read from its Completion and Tick together: Confirmed (both),
Done by Canvas, Done by the Student (Canvas cannot see this kind of task), Started, Not started,
or Conflict. Whether opening a page in Canvas counts as done is the Student's choice; it does by
default.
_Avoid_: Progress, state

**Conflict**:
A Tick on a task Canvas can see but has no Completion for, such as a ticked hand-in with no
submission. Shown with a warning sign wherever the task appears.
_Avoid_: Mismatch, error

**Untracked by Canvas**:
A task Canvas has no way to record, such as a group session or a teacher session. Its Canvas mark
shows a minus sign; only a Tick can complete it.
_Avoid_: Manual task, offline task

**Export Code**:
A text a Student copies out of one tracker and pastes into another to carry their Ticks across.
_Avoid_: Backup, progress code

**Out of Sync**:
The state of an old tracker whose Ticks changed after its last Export Code was made.
_Avoid_: Desynced, stale
