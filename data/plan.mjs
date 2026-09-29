// Hand-written plan data. Everything Canvas cannot tell us: sessions and their times, which
// material belongs to which week, advice, and the study periods themselves.
// Deadlines and module items come from data/canvas-inventory.json (npm run inventory).
//
// Refs point at Canvas module items by their number: "3.5" matches 3.5 and every 3.5.x,
// "3.4@Discussion" narrows to one item type when a number is reused, "#Required Software"
// matches by title. Hand-ins and session pages are never expanded from a prefix.

export const TEACHERS = {
  "josef-hallberg": {
    name: "Josef Hallberg", title: "Associate Professor",
    url: "https://www.ltu.se/personal/q/josef-hallberg", photo: "assets/teachers/josef-hallberg.jpg"
  },
  "chen-wei-yang": {
    name: "Chen-Wei Yang", title: "Senior Lecturer",
    url: "https://www.ltu.se/en/staff/c/chen-wei-yang", photo: "assets/teachers/chen-wei-yang.jpg"
  }
};

const ZOOM_SE = "https://ltu-se.zoom.us/j/3024506121";
const ZOOM_NET = "https://ltu-se.zoom.us/j/66123226809";
const BOOKING = "https://doodle.com/sign-up-sheet/participate/b49a3fa3-19ad-4030-92d4-04c1ccfd2767/select";
const SIGNUP = "https://ltuedu.instructure.com/courses/614/modules/items/19985";

// prefix: label before the code on chips. color: slot 1 to 5. canvasId: null until the course exists in Canvas.
export const COURSES = {
  Z7005E: {
    name: "Programvaruteknik", prefix: "PVT", color: 1, canvasId: 613, zoom: ZOOM_SE,
    teachers: ["josef-hallberg"],
    quick: [
      ["Schema", "https://ltuedu.instructure.com/courses/613/pages/schema"],
      ["Zoom room", ZOOM_SE],
      ["Interview booking", BOOKING],
      ["Assignments", "https://ltuedu.instructure.com/courses/613/assignments"]
    ],
    rules: [
      "Seven group labs, one shared project portfolio, deadlines at 17:00",
      "Individual home exam, Boomerang Australia, 25 Nov",
      "Oral examination in week 49, booking link appears after 25 Nov"
    ],
    note: "Almost everything is group work. The group moves at the pace of its slowest hand-off, so agree early who owns which diagram.",
    // MUST/NICE: graded work, required posts, labs, seminars and exams are MUST by rule (see the page).
    // These lists override the rule for named refs.
    must: ["1.7", "3.3", "3.5.6", "3.6.7", "4.2.10", "5.7"],  // workshops: portfolio work happens there
    nice: [],
    // Material the course marks as "when you have time". Shown as one optional block, not in the weeks.
    optional: [
      { title: "Module 0, workplace wellbeing", refs: ["0.1", "0.2", "0.3", "0.4", "0.5", "0.6", "0.7", "0.8", "0.9", "0.10"],
        why: "Eleven short workbook exercises with videos. The schema says to do it when you have time." },
      { title: "Voluntary group-work checklist", refs: ["2.4"], why: "One upload per person, any time during the course." }
    ]
  },
  Z0025E: {
    name: "Computer Networks", prefix: "NET", color: 2, canvasId: 614, zoom: ZOOM_NET,
    teachers: ["chen-wei-yang"],
    quick: [
      ["Course home", "https://ltuedu.instructure.com/courses/614"],
      ["Zoom room", ZOOM_NET],
      ["Lab sign-up sheet", SIGNUP],
      ["Assessment rules", "https://ltuedu.instructure.com/courses/614/pages/assessments-and-examination"]
    ],
    rules: [
      "Continuous assessment, pass or fail, no final exam",
      "Eight module quizzes: at least 150 of 300 points, all close 2 Dec",
      "Two midterms: at least 150 of 300 combined, minimum 75 on each",
      "Six labs: report plus a booked assessment session, groups of 3 to 4"
    ],
    note: "The quizzes are the easy points. Take each one in the week its module is covered and the 2 Dec closing date stops mattering.",
    must: [], nice: [],
    optional: []
  }
};

// Sessions: things you attend. status "expected" means the date comes from the Homepage slot
// table and the lecture number from module order; an announcement makes it "confirmed".
const S = (course, date, start, end, kind, title, extra) => Object.assign({ course, date, start, end, kind, title }, extra);

const SESSIONS_LP2 = [
  // Z7005E, from the Schema page
  S("Z7005E", "2026-09-17", "09:15", "10:15", "lecture", "Course walkthrough and Lecture 1", { ref: "0.0" }),
  S("Z7005E", "2026-09-17", "10:30", "11:45", "lecture", "Lecture 2, functional design", { ref: "1.1" }),
  S("Z7005E", "2026-09-18", "09:15", "10:15", "lecture", "Lecture 3, kravspecifikation", { ref: "1.2" }),
  S("Z7005E", "2026-09-18", "10:30", "11:45", "lecture", "Lecture 4, teknisk specifikation", { ref: "1.3" }),
  S("Z7005E", "2026-09-22", "09:15", "10:15", "lecture", "Lecture 5, interaction design and rapid prototyping", { ref: "1.4" }),
  S("Z7005E", "2026-09-22", "10:30", "11:45", "lecture", "Lecture 6, psychology of interaction design", { ref: "1.5" }),
  S("Z7005E", "2026-09-22", "13:00", "16:00", "workshop", "Workshop 1, kravspecifikation", { ref: "1.7", why: "Portfolio working time. Have the interview questions final before it starts." }),
  S("Z7005E", "2026-09-23", "09:15", "10:15", "lecture", "Lecture 7, interface design", { ref: "1.6" }),
  S("Z7005E", "2026-09-23", "10:30", "12:00", "interview", "System expert interview (booked slot)", { links: [["Booking page", BOOKING]], why: "45 minutes, shared with two other groups. Record it, or have one person do nothing but take notes." }),
  S("Z7005E", "2026-09-29", "09:15", "10:15", "lecture", "Lecture 8, agile development and XP", { ref: "2.1" }),
  S("Z7005E", "2026-09-29", "10:30", "12:00", "lecture", "Lecture 10, plus parts of Lectures 9 and 12", { ref: "3.1", also: ["2.2", "4.1"] }),
  S("Z7005E", "2026-09-30", "09:15", "10:15", "workshop", "Workshop 3, design principles", { ref: "3.5.6", prep: ["2.3"] }),
  S("Z7005E", "2026-09-30", "10:30", "11:45", "workshop", "Workshop 4, design patterns", { ref: "3.6.7", prep: ["3.4", "3.5", "3.6"] }),
  S("Z7005E", "2026-10-16", "09:15", "10:30", "lecture", "Lecture 14, unit testing and refactoring", { ref: "5.1" }),
  S("Z7005E", "2026-10-22", "09:15", "10:15", "lecture", "Lecture 11, sustainable system development", { ref: "3.2" }),
  S("Z7005E", "2026-10-22", "10:30", "12:00", "workshop", "Workshop 2, sustainable system development", { ref: "3.3" }),
  S("Z7005E", "2026-10-23", "09:15", "10:00", "lecture", "Lecture 13, concrete examples of quality attributes", { ref: "4.2.9" }),
  S("Z7005E", "2026-10-23", "10:15", "12:00", "workshop", "Workshop 5, software architecture design", { ref: "4.2.10" }),
  S("Z7005E", "2026-11-05", "09:15", "12:00", "seminar", "Final seminars, group presentations and demos", { ref: "6.1" }),
  S("Z7005E", "2026-11-05", "13:15", "14:00", "lecture", "Lecture 17, the software development life cycle", { ref: "5.5" }),
  S("Z7005E", "2026-11-05", "14:15", "16:00", "lecture", "Lecture 18, what good code looks like", { ref: "5.6" }),
  S("Z7005E", "2026-11-06", "09:15", "11:00", "workshop", "Workshop 6, refactoring a multi-user game", { ref: "5.7" }),
  S("Z7005E", "2026-11-30", null, null, "exam", "Oral examination, individual, booked slot", { ref: "6.3", status: "expected", why: "Some time in week 49. The booking link is published after 25 Nov." }),

  // Z0025E, from the Homepage slot table. Lecture numbers by module order until an announcement confirms them.
  S("Z0025E", "2026-09-17", "14:30", "16:00", "lecture", "Lecture 1, computer networks and the Internet", { ref: "1.3", status: "confirmed" }),
  S("Z0025E", "2026-09-28", "09:00", "10:30", "lecture", "Lecture 4, web and HTTP, P2P, video streaming", { ref: "2.4", status: "confirmed" }),
  S("Z0025E", "2026-09-30", "13:00", "14:30", "lecture", "Lecture 5, reliable data transfer and TCP", { ref: "3.2", status: "confirmed" }),
  S("Z0025E", "2026-10-02", "13:00", "15:00", "lab", "Lab 2 session, Packet Tracer skills 1 to 5", { ref: "9.5", why: "Attend the group's booked assessment session. Sign up in Canvas before Friday (announced 28 Sep)." }),
  S("Z0025E", "2026-10-05", "09:00", "10:30", "lecture", "Lecture 6, TCP flow and congestion control", { ref: "3.3", status: "expected" }),
  S("Z0025E", "2026-10-06", "09:00", "10:30", "lecture", "Lecture 8, network layer, inside a router, IP", { ref: "4.2", status: "expected" }),
  S("Z0025E", "2026-10-12", "09:00", "10:30", "lecture", "Lecture 9, NAT, IPv6, generalized forwarding", { ref: "4.3", status: "expected" }),
  S("Z0025E", "2026-10-13", "09:00", "10:30", "lecture", "Lecture 10, the control plane and routing algorithms", { ref: "5.2", status: "expected" }),
  S("Z0025E", "2026-10-16", "13:00", "15:00", "lab", "Lab 3 session, subnetting, Packet Tracer skills 6 to 7", { ref: "9.6" }),
  S("Z0025E", "2026-10-26", "09:00", "10:30", "lecture", "Lecture 11, OSPF, BGP and OpenFlow", { ref: "5.3", status: "expected" }),
  S("Z0025E", "2026-10-27", "09:00", "10:30", "lecture", "Lecture 13, the link layer", { ref: "6.2", status: "expected" }),
  S("Z0025E", "2026-10-30", "10:00", "12:00", "lab", "Lab 4 session, Packet Tracer skills 8 to 10", { ref: "9.8" }),
  S("Z0025E", "2026-11-02", "09:00", "10:30", "lecture", "Lecture 14, wireless and mobile networks", { ref: "7.2", status: "expected" }),
  S("Z0025E", "2026-11-03", "09:00", "10:30", "lecture", "Lecture 15, network security and cryptography", { ref: "8.2", status: "expected" }),
  S("Z0025E", "2026-11-06", "13:00", "15:00", "lab", "Lab 5 session, Packet Tracer skills 11 to 12", { ref: "9.9" }),
  S("Z0025E", "2026-11-09", "09:00", "10:30", "lecture", "Lecture 16, email security, TLS, IPsec, wireless", { ref: "8.3", status: "expected" }),
  S("Z0025E", "2026-11-10", "09:00", "10:30", "lecture", "Lecture, spare slot (13 slots, 12 lectures), probably review", { status: "expected" }),
  S("Z0025E", "2026-11-13", "13:00", "15:00", "lab", "Lab 6 session, Packet Tracer skills 13 to 14", { ref: "9.10" })
];

// Material placed into weeks. week: the Monday. refs expand against the inventory.
const STUDY_LP2 = [
  { week: "2026-09-14", course: "Z0025E", refs: ["#Required Software", "9.1", "0.1", "0.2", "0.3", "0.4", "0.5", "0.6", "0.7", "0.8", "1.1", "1.2", "1.3"],
    why: "Set-up week. The polls take two minutes each and show which modules will cost you time." },
  { week: "2026-09-21", course: "Z0025E", refs: ["1.4", "1.5", "1.6", "2.1", "2.3"],
    why: "Self-paced week, no lectures (announced 21 Sep). Lecture 2 and 3 are done on your own and each needs a forum post." },
  { week: "2026-09-28", course: "Z0025E", refs: ["2.5", "2.6", "3.1"], why: "Close module 2 with its quiz, read the module 3 overview before Lecture 5." },
  { week: "2026-09-28", course: "Z7005E", refs: ["2.3", "3.4", "3.5", "3.6"],
    why: "The Schema says to have watched 2.3 before Workshop 3 and 3.4 to 3.6 before Workshop 4, both on 30 Sep. It also lists them as week 42 self-study, so anything not done now goes there." },
  { week: "2026-10-05", course: "Z0025E", refs: ["3.4", "3.5", "4.1"], why: "Lecture 7 is self-paced with a forum post, then the module 3 quiz." },
  { week: "2026-10-12", course: "Z0025E", refs: ["4.4", "4.5", "5.1", "9.7"], why: "Close module 4 before Midterm 1. The subnet video helps with Lab 3." },
  { week: "2026-10-12", course: "Z7005E", refs: ["4.2"], why: "Software quality attributes. Lab 4 (15 Oct) and Lecture 13 (23 Oct) build on this block." },
  { week: "2026-10-19", course: "Z0025E", refs: ["10.1", "10.2"], why: "Midterm 1 on Friday covers modules 1 to 4. Re-do the knowledge checks in the lecture pages." },
  { week: "2026-10-26", course: "Z0025E", refs: ["5.4", "5.5", "5.6", "6.1"], why: "Lecture 12 is self-paced with a forum post." },
  { week: "2026-10-26", course: "Z7005E", refs: ["4.3"], why: "Listed by the Schema as week 44 self-study." },
  { week: "2026-11-02", course: "Z0025E", refs: ["6.3", "6.4", "7.1"] },
  { week: "2026-11-09", course: "Z0025E", refs: ["7.3", "7.4", "8.1"] },
  { week: "2026-11-16", course: "Z0025E", refs: ["8.4", "8.5", "10.4"], why: "Midterm 2 on Friday covers modules 5 to 8." },
  { week: "2026-11-16", course: "Z7005E", refs: ["5.3", "5.4"], why: "The Schema asks for these two videos before starting the home exam." }
];

// Hand-written to-dos that Canvas does not list. id must stay stable: it is the tick box key.
// level: "must" when skipping it costs the course, otherwise "nice".
const T = (id, course, date, title, why, links, level) => ({ id, course, date, title, why, links, level: level || "nice" });
const TASKS_LP2 = [
  T("t-tools", "Z0025E", "2026-09-14", "Install Wireshark and Cisco Packet Tracer 8.0", "Packet Tracer 6.3, 7.2 and 8.0 are the confirmed versions, newer builds have broken the lab files before. Needed from Lab 2.",
    [["Wireshark", "https://www.wireshark.org/"], ["Packet Tracer versions", "https://www.computernetworkingnotes.com/ccna-study-guide/download-packet-tracer-for-windows-and-linux.html"]], "must"),
  T("t-group", "Z0025E", "2026-09-14", "Form a lab group of 3 to 4 and sign up on sheet 9.2", "Lab 1 may be done alone, Labs 2 to 6 may not, so form the group once.", [["Lab sign-up sheet", SIGNUP]], "must"),
  T("t-msg", "Z7005E", "2026-09-18", "Agree a fixed group meeting slot, and who books the system expert on Monday", "The booking page holds three groups per session, so Monday morning matters.", [["Booking page", BOOKING]]),
  T("w39-book", "Z7005E", "2026-09-21", "Book the system expert slot (Josef Hallberg)", "Booking page, three groups per session. The session itself is Wednesday.", [["Booking page", BOOKING]], "must"),
  T("w39-gh", "Z7005E", "2026-09-21", "Start looking for a GitHub project for Lab 4", "Lab 4 is due 15 Oct. The Schema says to start now."),
  T("w39-prep", "Z7005E", "2026-09-21", "Draft interview questions and set up the portfolio skeleton", "Use the appendix structure, so interview answers land in the right section."),
  T("w39-writeup", "Z7005E", "2026-09-23", "Write up the interview findings the same afternoon", "Actors, user requirements, anything the expert ruled out."),
  T("w39-build", "Z7005E", "2026-09-24", "Portfolio build day", "Use cases and diagrams, cost/value/risk table with IDs and dependencies, storyboards, UI proposal, activity, module, class, sequence and state diagrams, a test plan covering white box and black box."),
  T("w39-book1", "Z0025E", "2026-09-25", "Book the Lab 1 assessment session", "Sign-up sheet 9.2. Every lab needs a booked session, not only a report.", [["Sign-up sheet", SIGNUP]], "must"),
  T("w43-rev", "Z0025E", "2026-10-19", "Revise for Midterm 1 with the quizzes already taken", "At least 75 points needed."),
  T("w44-pull", "Z7005E", "2026-10-26", "Free week: pull Lab 6 and Lab 7 forward", "Week 45 is the worst week of the course. Work done here is work you will not do then."),
  T("w46-exam", "Z7005E", "2026-11-09", "Start the home exam", "Two free weeks. Watch the two AI videos first, the Schema asks for that."),
  T("w48-book", "Z7005E", "2026-11-26", "Book the oral examination slot", "The booking link is published after the home exam deadline.", [["Schema page", "https://ltuedu.instructure.com/courses/613/pages/schema"]], "must")
];

// Which deadline a task feeds, keyed by task id. A task that feeds a deadline inherits MUST.
const TASK_FOR = {
  "t-msg": "Z7005E:3013", "w39-prep": "Z7005E:3013", "w39-writeup": "Z7005E:3013", "w39-build": "Z7005E:3013",
  "w39-gh": "Z7005E:3020", "w43-rev": "Z0025E:3030", "w44-pull": "Z7005E:3022", "w46-exam": "Z7005E:3024"
};
TASKS_LP2.forEach(t => { if (TASK_FOR[t.id]) t.for = TASK_FOR[t.id]; });

// Advice attached to Canvas deadlines, keyed "course:assignmentId".
const NOTES_LP2 = {
  "Z7005E:3013": "Keep the afternoon as buffer. Do not plan new writing for that day.",
  "Z7005E:3019": "Three days after Lab 2. Split the group so Lab 3 starts before Lab 2 is submitted.",
  "Z7005E:3020": "This is the GitHub project picked in week 39.",
  "Z7005E:3023": "Due 09:00, then the final seminars follow at 09:15.",
  "Z7005E:3024": "Individual work, the only individual grade in this course before the oral.",
  "Z0025E:3042": "Session and deadline fall on the same day, so write as you go.",
  "Z0025E:3030": "Open all day. At least 75 points needed here. If you also take Z7005E, sit it after the workshop.",
  "Z0025E:3040": "Last lab. After this, only quizzes and the second midterm remain in Z0025E.",
  "Z0025E:3031": "Again a 75 point minimum, and the combined 150 has to be there.",
  "Z0025E:quizzes": "150 of 300 points needed. With the weekly rhythm, these points are already in the bag."
};

export const TERMS = [
  {
    id: "ht26-lp2", label: "LP2", period: "Autumn 2026, week 38 to week 49",
    start: "2026-09-14", end: "2026-12-06",
    courses: ["Z7005E", "Z0025E"],
    extra: "Z0025E lab deadlines fall at 23:59, Z7005E deadlines at 17:00.",
    weekFlags: { "2026-09-14": "set up", "2026-10-05": "tight", "2026-10-19": "crunch", "2026-11-02": "worst week" },
    rhythm: [
      { html: "<strong>Mornings follow the schedule.</strong> Both courses teach in the morning and rarely collide, so keep 09:00 to 12:00 free for whichever has a session." },
      { c: "Z7005E", html: "<strong>Tuesday and Wednesday are Z7005E group days.</strong> The lectures and workshops sit there, so hold the group meeting straight after." },
      { c: "Z0025E", html: "<strong>Watch one Z0025E self-paced lecture and take its quiz in the same sitting.</strong> Never watch without taking the quiz, and post in the forum while it is fresh." },
      { html: "<strong>Friday is report day</strong> in whichever course has one due." },
      { c: "Z7005E", html: "<strong>Two hours of exercise a week.</strong> The Z7005E Schema puts it in the plan, so treat it as scheduled." },
      { html: "<strong>Check the Canvas calendar every Monday.</strong> Z7005E lists weeks 44, 46 and 47 as empty and Z0025E says to expect changes, so sessions can appear in either course." }
    ],
    sessions: SESSIONS_LP2, study: STUDY_LP2, tasks: TASKS_LP2, notes: NOTES_LP2
  },
  {
    id: "vt27-lp3", label: "LP3", period: "Spring 2027", start: "2027-01-11", end: "2027-03-21",
    courses: [], upcoming: "The courses for this study period are not in Canvas yet. They will be added here once their schedules are published.",
    weekFlags: {}, rhythm: [], sessions: [], study: [], tasks: [], notes: {}
  }
];

// Tick box ids used by earlier versions of the page, so nobody loses progress.
export const LEGACY_IDS = {
  "w39-lab1": "d:Z0025E:3041", "w40-lab1": "d:Z7005E:3013", "w40-lab2": "d:Z0025E:3042", "w41-lab2": "d:Z7005E:3015",
  "w41-lab3": "d:Z7005E:3019", "w42-lab4": "d:Z7005E:3020", "w42-lab3": "d:Z0025E:3043", "w43-lab5": "d:Z7005E:3021",
  "w43-mid1": "d:Z0025E:3030", "w44-lab4": "d:Z0025E:3044", "w45-lab6": "d:Z7005E:3022", "w45-lab7": "d:Z7005E:3023",
  "w45-lab5": "d:Z0025E:3045", "w46-lab6": "d:Z0025E:3040", "w47-mid2": "d:Z0025E:3031", "w48-exam": "d:Z7005E:3024",
  "w49-quiz": "d:Z0025E:quizzes:2026-12-02"
};
