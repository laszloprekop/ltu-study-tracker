# LTU Study Tracker

A study planner for students in a set of LTU Canvas courses: what is due, what to study before it,
and what has been done.

## Language

**Course**:
One Canvas course the tracker knows, together with its hand-written plan. Courses are data: adding
one adds a record, not new behaviour. Today: Z7005E and Z0025E.
_Avoid_: Class, subject

**Course Plan**:
Everything about a Course that is the same for every student: modules, deadlines, sessions,
announcements and the hand-written parts (session times, needs, weekly notes). Synced by the
Maintainer; shown, with its last sync date, to anyone, with or without a token.
_Avoid_: Shared data, public view, fallback

**Personal Layer**:
What belongs to one Student and only they see: their Canvas completion, submissions, grades and
own deadline overrides, their calendar events, ticks and card reviews. Ticks and reviews work
without a token; the Canvas parts need one.
_Avoid_: User data, profile

**Student**:
A person using the tracker for their own study. May or may not have connected a token.
_Avoid_: User, viewer

**Account**:
A Student's Google login, under which their Personal Layer is kept across devices. A Student
without one is a **Guest**: their Personal Layer lives in one browser and merges into the Account
at its first login.
_Avoid_: Profile, user

**Calendar Link**:
A secret iCal address a Student gives the tracker so it can read a calendar's events. Read-only,
so it may be stored with the Account; a Canvas token never is.
_Avoid_: Calendar URL, feed, ICS

**Calendar Event**:
An event read through one Student's Calendar Link. Part of their Personal Layer, shown among Course
Plan events but marked as theirs. Belongs to the Student even when the calendar is a group's.
_Avoid_: Group event, session (a session is in the Course Plan)

**Day Plan**:
One Student's day across all their Courses in 15-minute slots: sessions, deadlines, Calendar
Events, Bookings and the Free Slots between them. The view the tracker exists for.
_Avoid_: Agenda, schedule, today view

**Booking**:
A session that only takes place once a group claims a time in it, such as a lab assessment slot on
a signup sheet. Unbooked until claimed, and the tracker warns before claiming closes.
_Avoid_: Reservation, signup

**Unplaced**:
Work that has to happen but has no time yet, such as an unbooked Booking or a group session not
yet agreed.
_Avoid_: Floating, TBD

**Free Slot**:
A gap in a Day Plan, inside the Student's working hours, where Unplaced work could go.
_Avoid_: Gap, availability

**Group**:
The Canvas group a Student belongs to in one Course, known by its number ("Lab Group 8" and
"Grupp 8" are the same Group). Read from Canvas with the Student's token, never entered by hand.
A Booking belongs to a Group, not to a Student.
_Avoid_: Team, lab partners

**Tick**:
A Student's own mark that one task is done, or its removal, with the time it last changed. The
Student can change it. When two copies of the same Tick disagree, the later change wins.
_Avoid_: Check, completion

**Completion**:
What Canvas records about a task for one Student: submitted, contributed, marked done or opened.
Read-only. Shown beside the Tick, and neither overrides the other.
_Avoid_: Canvas tick, progress

**Export Code**:
A text a Student copies out of one tracker and pastes into another to carry their Ticks across.
_Avoid_: Backup, progress code

**Out of Sync**:
The state of an old tracker whose Ticks changed after its last Export Code was made.
_Avoid_: Desynced, stale

**Maintainer**:
The Student whose token syncs the Course Plan and who edits its hand-written parts.
_Avoid_: Admin, owner
