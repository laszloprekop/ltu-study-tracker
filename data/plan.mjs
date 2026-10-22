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
// sv: the course's Swedish name, as the programme knows it; the Närvaro Report uses it.
export const COURSES = {
  Z7005E: {
    name: "Programvaruteknik", sv: "Programvaruteknik", prefix: "PVT", color: 1, canvasId: 613, zoom: ZOOM_SE,
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
    name: "Computer Networks", sv: "Datorkommunikation", prefix: "NET", color: 2, canvasId: 614, zoom: ZOOM_NET,
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
  S("Z7005E", "2026-09-23", "10:30", "12:00", "interview", "System expert interview (booked slot)", { links: [["Booking page", BOOKING]], why: "30 minutes, shared with two other groups. Record it, or have one person do nothing but take notes." }),
  S("Z7005E", "2026-09-29", "09:15", "10:15", "lecture", "Lecture 8, agile development and XP", { ref: "2.1" }),
  S("Z7005E", "2026-09-29", "10:30", "12:00", "lecture", "Lecture 10, plus parts of Lectures 9 and 12", { ref: "3.1", also: ["2.2", "4.1"] }),
  S("Z7005E", "2026-09-30", "09:15", "10:15", "workshop", "Workshop 3, design principles", { ref: "3.5.6", prep: ["2.3"] }),
  S("Z7005E", "2026-09-30", "10:30", "11:45", "workshop", "Workshop 4, design patterns", { ref: "3.6.7", prep: ["3.4", "3.5", "3.6"] }),
  S("Z7005E", "2026-10-16", "09:15", "10:30", "lecture", "Lecture 14, unit testing and refactoring", { ref: "5.1" }),
  // On 22 Oct the course moved the sessions of 22 and 23 Oct to week 45 and made Lecture 13 a
  // recording to watch before Workshop 5. The Schema's week 43 still lists the 22 Oct ones; its
  // week 45 and the message to the course say they moved.
  S("Z7005E", "2026-11-02", "13:00", "14:40", "workshop", "Workshop 5, software architecture design", { ref: "4.2.10", prep: ["4.2.9"], why: "Moved from 23 Oct. Lecture 13 is not held live: watch the short recording that covers it (4.2.9, about 18 minutes) before the workshop." }),
  S("Z7005E", "2026-11-05", "09:15", "12:00", "seminar", "Final seminars, group presentations and demos", { ref: "6.1" }),
  S("Z7005E", "2026-11-05", "13:20", "14:20", "lecture", "Lecture 18, what good code looks like", { ref: "5.6" }),
  S("Z7005E", "2026-11-05", "14:30", "15:00", "lecture", "Lecture 11, sustainable system development", { ref: "3.2", why: "Moved from 22 Oct." }),
  S("Z7005E", "2026-11-05", "15:10", "16:00", "lecture", "Lecture 17, the software development life cycle", { ref: "5.5" }),
  S("Z7005E", "2026-11-06", "09:15", "10:25", "workshop", "Workshop 6, refactoring a multi-user game", { ref: "5.7" }),
  S("Z7005E", "2026-11-06", "10:30", "12:00", "workshop", "Workshop 2, sustainable system development", { ref: "3.3", why: "Moved from 22 Oct." }),
  S("Z7005E", "2026-11-30", null, null, "exam", "Oral examination, individual, booked slot", { ref: "6.3", status: "expected", why: "Some time in week 49. The booking link is published after 25 Nov." }),

  // Z0025E, from the Homepage slot table. Lecture numbers by module order until an announcement confirms them.
  S("Z0025E", "2026-09-17", "14:30", "16:00", "lecture", "Lecture 1, computer networks and the Internet", { ref: "1.3", status: "confirmed" }),
  S("Z0025E", "2026-09-28", "09:00", "10:30", "lecture", "Lecture 4, web and HTTP, P2P, video streaming", { ref: "2.4", status: "confirmed" }),
  S("Z0025E", "2026-09-30", "13:00", "14:30", "lecture", "Lecture 5, reliable data transfer and TCP", { ref: "3.2", status: "confirmed" }),
  S("Z0025E", "2026-10-02", "13:00", "15:00", "lab", "Lab 2 session, Packet Tracer skills 1 to 5", { ref: "9.5", why: "Attend the group's booked assessment session. Sign up in Canvas before Friday (announced 28 Sep)." }),
  S("Z0025E", "2026-10-05", "09:00", "10:30", "lecture", "Lecture 6, TCP flow and congestion control", { ref: "3.3", status: "confirmed" }),
  S("Z0025E", "2026-10-06", "09:00", "10:30", "lecture", "Lecture 8, network layer, inside a router, IP", { ref: "4.2", status: "confirmed" }),
  S("Z0025E", "2026-10-12", "09:00", "10:30", "lecture", "Lecture 9, NAT, IPv6, generalized forwarding", { ref: "4.3", status: "confirmed" }),
  S("Z0025E", "2026-10-13", "09:00", "10:30", "lecture", "Lecture 10, the control plane and routing algorithms", { ref: "5.2", status: "confirmed" }),
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
  { week: "2026-10-12", course: "Z7005E", refs: ["4.2"], why: "Software quality attributes. Lab 4 (15 Oct) and Workshop 5 (2 Nov) build on this block." },
  { week: "2026-10-19", course: "Z0025E", refs: ["10.1", "10.2"], why: "No lectures this week (announced 19 Oct). Midterm 1 on Friday covers modules 1 to 4: open book, individual, any time during the day. What to practise is in Midterm 1 prep at the top of the week." },
  { week: "2026-10-26", course: "Z0025E", refs: ["5.4", "5.5", "5.6", "6.1"], why: "Lecture 12 is self-paced with a forum post." },
  { week: "2026-10-26", course: "Z7005E", refs: ["4.3", "4.2.9"], why: "4.3 is listed by the Schema as week 44 self-study. 4.2.9 is the short recording of Lecture 13, to watch before Workshop 5 on Monday 2 Nov." },
  { week: "2026-11-02", course: "Z0025E", refs: ["6.3", "6.4", "7.1"] },
  { week: "2026-11-09", course: "Z0025E", refs: ["7.3", "7.4", "8.1"] },
  { week: "2026-11-16", course: "Z0025E", refs: ["8.4", "8.5", "10.4"], why: "Midterm 2 on Friday covers modules 5 to 8." },
  { week: "2026-11-16", course: "Z7005E", refs: ["5.3", "5.4"], why: "The Schema asks for these two videos before starting the home exam." }
];

// Hand-written to-dos that Canvas does not list. id must stay stable: it is the tick box key.
// level: "must" when skipping it costs the course, otherwise "nice".
const T = (id, course, date, title, why, links, level) => ({ id, course, date, title, why, links, level: level || "nice" });
// The textbook's (Kurose and Ross) Knowledge Checks and interactive problems, which the Z0025E lecture pages link.
const KC = (chapter, section) => `https://gaia.cs.umass.edu/kurose_ross/knowledgechecks/problem.php?c=${chapter}&s=${section}`;
const IA = name => `https://gaia.cs.umass.edu/kurose_ross/interactive/${name}.php`;
const TASKS_LP2 = [
  T("t-tools", "Z0025E", "2026-09-14", "Install Wireshark and Cisco Packet Tracer 8.0", "Packet Tracer 6.3, 7.2 and 8.0 are the confirmed versions, newer builds have broken the lab files before. Needed from Lab 2.",
    [["Wireshark", "https://www.wireshark.org/"], ["Packet Tracer versions", "https://www.computernetworkingnotes.com/ccna-study-guide/download-packet-tracer-for-windows-and-linux.html"]], "must"),
  T("t-group", "Z0025E", "2026-09-14", "Form a lab group of 3 to 4 and sign up on sheet 9.2", "Lab 1 is graded individually. Labs 2 to 6 are meant for groups of 3 to 4 (9.1), though each lab assignment also allows working alone, so form the group once.", [["Lab sign-up sheet", SIGNUP]], "must"),
  T("t-msg", "Z7005E", "2026-09-18", "Agree a fixed group meeting slot, and who books the system expert on Monday", "The booking page holds three groups per session, so Monday morning matters.", [["Booking page", BOOKING]]),
  T("w39-book", "Z7005E", "2026-09-21", "Book the system expert slot (Josef Hallberg)", "Booking page, three groups per session. The session itself is Wednesday.", [["Booking page", BOOKING]], "must"),
  T("w39-gh", "Z7005E", "2026-09-21", "Start looking for a GitHub project for Lab 4", "Lab 4 is due 15 Oct. The Schema says to start now."),
  T("w39-prep", "Z7005E", "2026-09-21", "Draft interview questions and set up the portfolio skeleton", "Use the appendix structure, so interview answers land in the right section."),
  T("w39-writeup", "Z7005E", "2026-09-23", "Write up the interview findings the same afternoon", "Actors, user requirements, anything the expert ruled out."),
  T("w39-build", "Z7005E", "2026-09-24", "Portfolio build day", "Use cases and diagrams, cost/value/risk table with IDs and dependencies, storyboards, UI proposal, activity, module, class, sequence and state diagrams, a test plan covering white box and black box."),
  T("w42-book3", "Z0025E", "2026-10-12", "Book a Lab 3 assessment slot on sheet 9.2", "Session Friday 16 Oct, 13:00 to 15:00. 8 slots of 15 minutes for 8 groups.", [["Sign-up sheet", SIGNUP]], "must"),
  T("w44-book4", "Z0025E", "2026-10-26", "Book a Lab 4 assessment slot on sheet 9.2", "Session Friday 30 Oct from 10:00. 8 slots for 8 groups.", [["Sign-up sheet", SIGNUP]], "must"),
  T("w45-book5", "Z0025E", "2026-11-02", "Book a Lab 5 assessment slot on sheet 9.2", "Session Friday 6 Nov from 13:00. 8 slots for 8 groups.", [["Sign-up sheet", SIGNUP]], "must"),
  T("w46-book6", "Z0025E", "2026-11-09", "Book a Lab 6 assessment slot on sheet 9.2", "Session Friday 13 Nov from 13:00. 8 slots for 8 groups.", [["Sign-up sheet", SIGNUP]], "must"),
  T("w43-rev", "Z0025E", "2026-10-19", "Revise for Midterm 1 with the quizzes already taken", "At least 75 points needed."),
  T("w44-pull", "Z7005E", "2026-10-26", "Free week: pull Lab 6 and Lab 7 forward", "Week 45 is the worst week of the course. Work done here is work you will not do then."),
  T("w46-exam", "Z7005E", "2026-11-09", "Start the home exam", "Two free weeks. Watch the two AI videos first, the Schema asks for that."),
  T("w48-book", "Z7005E", "2026-11-26", "Book the oral examination slot", "The booking link is published after the home exam deadline.", [["Schema page", "https://ltuedu.instructure.com/courses/613/pages/schema"]], "must")
];

// Which deadline a task feeds, keyed by task id. A task that feeds a deadline inherits MUST.
const TASK_FOR = {
  "t-msg": "Z7005E:3013", "w39-prep": "Z7005E:3013", "w39-writeup": "Z7005E:3013", "w39-build": "Z7005E:3013",
  "w39-gh": "Z7005E:3020", "w42-book3": "Z0025E:3043", "w44-book4": "Z0025E:3044", "w45-book5": "Z0025E:3045", "w46-book6": "Z0025E:3040", "w43-rev": "Z0025E:3030", "w44-pull": "Z7005E:3022", "w46-exam": "Z7005E:3024"
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
  "Z0025E:3030": "Open all day in the Midterms module, open book. At least 75 points needed here. Z7005E has no sessions this week: it moved them to week 45 to leave time for this.",
  "Z0025E:3040": "Last lab. After this, only quizzes and the second midterm remain in Z0025E.",
  "Z0025E:3031": "Again a 75 point minimum, and the combined 150 has to be there.",
  "Z0025E:quizzes": "150 of 300 points needed. With the weekly rhythm, these points are already in the bag."
};

// What an assessment tests, keyed "course:assignmentId", as refs. The page already applies a rule
// (needsOf in the template): an assessment needs the other items in its own section, or the items
// before it in a module without sections. That covers every module quiz and the Z7005E labs that
// sit inside their section. Entries here are added on top, for what the structure cannot say.
// Sources: the Midterm instruction pages ("Reviewed the Module 1-4 Study Guides"), the Z7005E
// Schema ("innan du borjar med tentan: 5.3, 5.4"), the Lab 3 subnet page in Module 9.
const NEEDS_LP2 = {
  "Z0025E:3030": ["1", "2", "3", "4"],          // Midterm 1
  "Z0025E:3031": ["5", "6", "7", "8"],          // Midterm 2
  "Z0025E:3043": ["4.2", "4.3"],                // Lab 3, subnetting: the IP lectures (9.7 comes from the rule)
  "Z7005E:3024": ["5.3", "5.4"]                 // Home exam: the two AI videos the Schema asks for. What else it tests is not stated in Canvas.
};

// Exam prep by topic (CONTEXT.md, Prep Plan): what to practise for one exam, module by module and
// topic by topic, each with its own tick. A topic is a textbook section: its Knowledge Check, the
// textbook problems the lecture pages give for it, and its Cards (cards: a pattern on the card's
// question, among the Cards made from the module's pages). material, quiz and cyu are refs: the
// pages to read, the module quiz, the lecture pages whose Check Your Understanding questions to redo.
// Tick ids come from these: t:<course>-kc-<topic key>, t:<course>-ia-<problem id>, t:<course>-cyu-<ref
// number>, and the quiz's own module item. Never rename a topic key or a problem id.
// Source: the Week 6 announcement (19 Oct) and 10.1 Midterm Overview; the topics follow the textbook
// sections the Knowledge Checks are written for, and the problems sit where the lecture pages put them.
const PB = (title, id) => ({ title, id, url: IA(id) });
const PREP_LP2 = [
  { for: "Z0025E:3030", course: "Z0025E", week: "2026-10-19", title: "Midterm 1 prep",
    why: "Modules 1 to 4, open book, any time on Friday. The Midterm Overview (10.1) calls the Knowledge Checks the base of the midterm question bank: know why each wrong option is wrong, not only which one is right. Solve each problem before opening its solution.",
    modules: [
      { n: "1", title: "Internet foundations", material: ["1.1", "1.3", "1.4", "1.6"], quiz: "1.5", cyu: ["1.3", "1.4"], topics: [
        { key: "1.1", title: "What is the Internet?", check: KC(1, 1), cards: "What is the Internet|main components|network protocol" },
        { key: "1.2", title: "The network edge", check: KC(1, 2), cards: "Network Edge|access network|edge versus" },
        { key: "1.3", title: "The network core", check: KC(1, 3), problems: [PB("Circuit Switching", "circuit_switching")],
          cards: "Network Core|circuit|store-and-forward|end system to another|edge versus" },
        { key: "1.4", title: "Delay, loss and throughput", check: KC(1, 4),
          problems: [PB("One-hop Transmission Delay", "one-hop-delay"), PB("Queuing Delay", "qdelay"), PB("End-to-End Delay", "end-end-delay"), PB("End-to-End Throughput", "end-end-throughput-simple")],
          cards: "Performance|delay|throughput|queu|traceroute" },
        { key: "1.5", title: "Protocol layers and their service models", check: KC(1, 5), cards: "Protocol Layers|layer|encapsulation" },
        { key: "1.6", title: "Networks under attack", check: KC(1, 6), cards: "Under Attack|security|sniffing|spoofing" }
      ] },
      { n: "2", title: "Application layer", material: ["2.1", "2.3", "2.4", "2.6"], quiz: "2.5", cyu: ["2.3", "2.4"], topics: [
        { key: "2.1", title: "Principles of network applications", check: KC(2, 1),
          cards: "Principles of Network Applications|client-server versus|right process|from the transport layer|TCP service versus UDP service|application-layer protocol" },
        { key: "2.2", title: "The Web and HTTP", check: KC(2, 2),
          problems: [PB("HTTP GET", "http-get"), PB("HTTP RESPONSE", "http-response"), PB("Browser Cache", "browser_caching")],
          cards: "HTTP|cookie|web cache|conditional GET|status codes|browser" },
        { key: "2.3", title: "Email: SMTP and IMAP", check: KC(2, 3), problems: [PB("Electronic Mail and SMTP", "smtp")], cards: "e-?mail|SMTP|IMAP" },
        { key: "2.4", title: "DNS", check: KC(2, 4), problems: [PB("DNS Basics", "dns"), PB("DNS: Iterative vs Recursive Query", "dns_query")], cards: "DNS" },
        { key: "2.5", title: "Peer-to-peer file distribution", problems: [PB("Client-server vs P2P file distribution delays", "CS_vs_P2P_download")], cards: "P2P|peer-to-peer" },
        { key: "2.6", title: "Video streaming and CDNs", check: KC(2, 6), cards: "video|DASH|CDN" },
        { key: "2.7", title: "Socket programming", check: KC(2, 7), cards: "socket" }
      ] },
      { n: "3", title: "Transport layer", material: ["3.1", "3.2", "3.3", "3.4@Discussion", "3.5"], quiz: "3.4@Assignment", cyu: ["3.2", "3.3", "3.4@Discussion"], topics: [
        { key: "3.1", title: "Transport-layer services", check: KC(3, 1), cards: "Transport-layer Services|transport layer give|would you pick UDP" },
        { key: "3.2", title: "Multiplexing and demultiplexing", check: KC(3, 2),
          problems: [PB("UDP Mux and Demux", "UDP_Mux_Demux"), PB("TCP Mux and Demux", "TCP_Mux_Demux")], cards: "multiplexing|Mux|demultiplex" },
        { key: "3.3", title: "UDP", check: KC(3, 3), problems: [PB("Internet Checksum", "internet_checksum")],
          cards: "Connectionless Transport|Internet Checksum|UDP segment header|UDP's lack|would you pick UDP" },
        { key: "3.4", title: "Principles of reliable data transfer", check: KC(3, 4), problems: [PB("rdt 3.0", "rdt30")],
          cards: "reliable data transfer|rdt|Go-Back-N|stop-and-wait" },
        { key: "3.5", title: "TCP: segments, timers, reliability", check: KC(3, 5),
          problems: [PB("TCP sequence and ACK numbers, with segment loss", "tcp_segloss"), PB("TCP RTT and timeout", "TCP_RTT"), PB("TCP retransmissions", "tcp_retrans")],
          cards: "Connection-oriented Transport|TCP sequence|TCP RTT|TCP retransmissions|three-way handshake|three messages|segment was lost|reliable, in-order|flow control stop" },
        { key: "3.6", title: "Principles of congestion control", check: KC(3, 6),
          cards: "Principles of Congestion Control|congestion happen|Flow control versus congestion|network is congested" },
        { key: "3.7", title: "TCP congestion control", check: KC(3, 7), problems: [PB("TCP congestion window evolution", "tcp_evolution")],
          cards: "TCP Congestion Control|congestion window|CUBIC|AIMD|duplicate ACK|throughput a TCP" },
        { key: "3.8", title: "Evolution of the transport layer: QUIC", check: KC(3, 8), cards: "Evolution of Transport|QUIC" }
      ] },
      { n: "4", title: "Network layer: data plane", material: ["4.1", "4.2", "4.3", "4.5"], quiz: "4.4", cyu: ["4.2", "4.3"], topics: [
        { key: "4.1", title: "Network layer overview", check: KC(4, 1), cards: "network layer|forwarding and routing|control plane|best-effort" },
        { key: "4.2", title: "Inside a router", check: KC(4, 2), problems: [PB("Packet Scheduling", "scheduling")],
          cards: "router has|router's|input port|output port|switching fabric|head-of-the-line|scheduling|WFQ|FCFS|tail drop|TCAM|longest prefix|neutrality|components does a router|arriving at a router" },
        { key: "4.3", title: "IP: addressing, DHCP, NAT, IPv6", check: KC(4, 3),
          problems: [PB("Subnet Addressing", "subnet_addressing"), PB("Network Address Translation", "nat"), PB("IPv6 Tunneling and Encapsulation", "ip_tunneling")],
          cards: "IPv4|IPv6|IP address|subnet|CIDR|DHCP|\\bNAT\\b|tunnel|address block|aggregation|TTL|IP protocol" },
        { key: "4.4", title: "Generalized forwarding and OpenFlow", check: KC(4, 4), problems: [PB("OpenFlow Flow Tables", "openflow")],
          cards: "Generalized Forwarding|match\\+action|OpenFlow|flow table" },
        { key: "4.5", title: "Middleboxes and the IP hourglass", check: KC(4, 5),
          cards: "middlebox|whitebox|NFV|end-to-end argument|hourglass|thin waist|RFC 1958|intelligence in the telephone" }
      ] }
    ] }
];

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
    sessions: SESSIONS_LP2, study: STUDY_LP2, tasks: TASKS_LP2, notes: NOTES_LP2, needs: NEEDS_LP2, prep: PREP_LP2
  },
  {
    id: "vt27-lp3", label: "LP3", period: "Spring 2027", start: "2027-01-11", end: "2027-03-21",
    courses: [], upcoming: "The courses for this study period are not in Canvas yet. They will be added here once their schedules are published.",
    weekFlags: {}, rhythm: [], sessions: [], study: [], tasks: [], notes: {}, needs: {}, prep: []
  }
];

// Bookings (release 2): sessions that happen only once a Group claims a slot. The app reads the
// sheet's slots at request time, keeps no names, and shows the Booking's stage on its task row.
// section is the sheet's heading prefix ("Lab3 - Oct 16th - ..."); task is the TASKS_LP2 id.
const SIGNUP_DOC = "1S9Bi-W6wMoTd7FH7IqcS04B09B25Hml7PrTGBL33xuM";
export const BOOKINGS = [
  { id: "Z0025E:lab3", course: "Z0025E", for: "Z0025E:3043", sheet: SIGNUP_DOC, section: "Lab3", task: "w42-book3" },
  { id: "Z0025E:lab4", course: "Z0025E", for: "Z0025E:3044", sheet: SIGNUP_DOC, section: "Lab4", task: "w44-book4" },
  { id: "Z0025E:lab5", course: "Z0025E", for: "Z0025E:3045", sheet: SIGNUP_DOC, section: "Lab5", task: "w45-book5" },
  { id: "Z0025E:lab6", course: "Z0025E", for: "Z0025E:3040", sheet: SIGNUP_DOC, section: "Lab6", task: "w46-book6" }
];

// Disagreements (CONTEXT.md): two sources in a Course giving different values for one fact. Each is
// tied to a row: "d:<course>:<assignment id>" or a session "s:<course>:<date>:<start>". For a
// deadline, the page uses the earliest value not yet past until settled names the source to trust.
// From the teacher reports in docs/reports/; source URLs are Canvas pages or files.
// Read again on 2026-10-12: the Z0025E ones are gone (9.1 Lab Overview, the Lab Signup Sheet and
// L00 Course Introduction.pdf were corrected); the Z7005E ones below still stand.
export const DISAGREEMENTS = [
  { about: "d:Z7005E:3024", fact: "deadline", values: [
    { source: "Canvas assignment and the Schema", date: "2026-11-25", time: "17:00" },
    { source: "HomeExam2025.pdf", date: "2026-12-08", time: "09:00", url: "https://ltuedu.instructure.com/courses/613/files/38058" }] },
  { about: "d:Z7005E:3021", fact: "deadline", values: [
    { source: "Canvas assignment and the Schema", date: "2026-10-21", time: "17:00" },
    { source: "Laboration 5 text", says: "deadline 24 September, 17:00" }] },
  { about: "s:Z7005E:2026-11-06:10:30", fact: "length", values: [
    { source: "Schema", says: "10:30 to 12:00" },
    { source: "Workshop 2 page (3.3)", says: "about 3 hours of steps" }] }
];

// Where the tracker has moved (release 1, step 6). null keeps the claude.ai page as it is. Set it to
// the app's https address once a real sign-in there has been tested: the artifact then shows a move
// banner, and locks ticking after a Student exports, until they unlock it. The app ignores it.
// The programme the courses belong to, from its information sheet ("Så här går det till fullstack
// programmeringsutbildning 2026", Arbetsförmedlingen). Names stay Swedish as the programme has them.
export const PROGRAMME = {
  name: "Programmering mot fullstack",
  kind: "Arbetsmarknadsutbildning, a commissioned course",
  by: "Arbetsförmedlingen, Luleå tekniska universitet and Lexicon",
  start: "2026-04-13", end: "2027-03-18",
  parts: [
    { title: "Test och kartläggning", en: "Testing and assessment", who: "Lexicon", start: "2026-04-13", end: "2026-04-24", length: "2 weeks" },
    { title: "IT-påbyggnad mot fullstack", en: "IT top-up towards full stack", who: "Lexicon", start: "2026-04-27", end: "2026-09-16", length: "18 weeks", note: "Summer break 20 to 31 July 2026" },
    { title: "Teoristudier", en: "Theory studies, the courses on this page", who: "Luleå tekniska universitet", start: "2026-09-17", end: "2027-02-17", length: "21 weeks" },
    { title: "Arbetsplatsförlagt lärande (APL)", en: "Workplace learning", who: "A workplace, mostly in northern Sweden", start: "2027-02-18", end: "2027-03-18", length: "29 days or more" }
  ],
  note: "Full time, daytime, Monday to Friday. The theory parts are remote.",
  // The Närvaro Report: what each weekday held, sent by Friday noon, on the programme's own template
  // ("Närvarorapportering Programmerare (1).xlsx", from the programme's coordinator). The week view
  // shows it every Friday and drafts it from the week. notes: the template's lines under the days,
  // word for word; mark: the line the template highlights in yellow.
  narvaro: {
    title: "Närvarorapportering Programmerare Fullstack",
    due: "12:00",
    notes: [
      ["Vid veckodagarna skriver ni vad ni gjort under dagen(tex vilken kurs eller uppgift). ",
        "Fyll även i det gulmarkerade(Ert namn, lärarens namn och vecka). ",
        "Närvarorapporten mejlar ni till mig jeanette.rudstrom@ltubusiness.se senast fredag förmiddag!"],
      ["När ni är sjuk eller hemma för vård av barn anmäler ni det  till samma mejladress innan eller senast samma morgon.",
        "Det är viktigt att ni gör det på förmiddagen så det blir inrapporterat och ni får ersättning.",
        { mark: "OBS! frånvarorapporteringen måste göras varje dag du är sjuk eller hemma för vård av barn" }]
    ]
  }
};

export const MOVED_TO = "https://ltu-studytracker.dentaku.se";

// Tick box ids used by earlier versions of the page, so nobody loses progress.
export const LEGACY_IDS = {
  "w39-lab1": "d:Z0025E:3041", "w40-lab1": "d:Z7005E:3013", "w40-lab2": "d:Z0025E:3042", "w41-lab2": "d:Z7005E:3015",
  "w41-lab3": "d:Z7005E:3019", "w42-lab4": "d:Z7005E:3020", "w42-lab3": "d:Z0025E:3043", "w43-lab5": "d:Z7005E:3021",
  "w43-mid1": "d:Z0025E:3030", "w44-lab4": "d:Z0025E:3044", "w45-lab6": "d:Z7005E:3022", "w45-lab7": "d:Z7005E:3023",
  "w45-lab5": "d:Z0025E:3045", "w46-lab6": "d:Z0025E:3040", "w47-mid2": "d:Z0025E:3031", "w48-exam": "d:Z7005E:3024",
  "w49-quiz": "d:Z0025E:quizzes:2026-12-02",
  // The Midterm 1 revision tasks of 20 Oct, one per module and kind, became Midterm 1 prep's items:
  // a tick on one becomes a tick on each item it stood for.
  "t:w43-m1-review": ["t:z0025e-cyu-1.3", "t:z0025e-cyu-1.4"],
  "t:w43-m1-kc": ["t:z0025e-kc-1.1", "t:z0025e-kc-1.2", "t:z0025e-kc-1.3", "t:z0025e-kc-1.4", "t:z0025e-kc-1.5", "t:z0025e-kc-1.6"],
  "t:w43-m1-prob": ["t:z0025e-ia-circuit_switching", "t:z0025e-ia-one-hop-delay", "t:z0025e-ia-qdelay", "t:z0025e-ia-end-end-delay", "t:z0025e-ia-end-end-throughput-simple"],
  "t:w43-m2-review": ["t:z0025e-cyu-2.3", "t:z0025e-cyu-2.4"],
  "t:w43-m2-kc": ["t:z0025e-kc-2.1", "t:z0025e-kc-2.2", "t:z0025e-kc-2.3", "t:z0025e-kc-2.4", "t:z0025e-kc-2.6", "t:z0025e-kc-2.7"],
  "t:w43-m2-prob": ["t:z0025e-ia-dns", "t:z0025e-ia-dns_query", "t:z0025e-ia-smtp", "t:z0025e-ia-http-get", "t:z0025e-ia-http-response", "t:z0025e-ia-browser_caching", "t:z0025e-ia-CS_vs_P2P_download"],
  "t:w43-m3-review": ["t:z0025e-cyu-3.2", "t:z0025e-cyu-3.3", "t:z0025e-cyu-3.4"],
  "t:w43-m3-kc": ["t:z0025e-kc-3.1", "t:z0025e-kc-3.2", "t:z0025e-kc-3.3", "t:z0025e-kc-3.4", "t:z0025e-kc-3.5", "t:z0025e-kc-3.6", "t:z0025e-kc-3.7", "t:z0025e-kc-3.8"],
  "t:w43-m3-prob": ["t:z0025e-ia-rdt30", "t:z0025e-ia-tcp_segloss", "t:z0025e-ia-TCP_RTT", "t:z0025e-ia-tcp_retrans", "t:z0025e-ia-tcp_evolution", "t:z0025e-ia-internet_checksum", "t:z0025e-ia-UDP_Mux_Demux", "t:z0025e-ia-TCP_Mux_Demux"],
  "t:w43-m4-review": ["t:z0025e-cyu-4.2", "t:z0025e-cyu-4.3"],
  "t:w43-m4-kc": ["t:z0025e-kc-4.1", "t:z0025e-kc-4.2", "t:z0025e-kc-4.3", "t:z0025e-kc-4.4", "t:z0025e-kc-4.5"],
  "t:w43-m4-prob": ["t:z0025e-ia-scheduling", "t:z0025e-ia-subnet_addressing", "t:z0025e-ia-nat", "t:z0025e-ia-ip_tunneling", "t:z0025e-ia-openflow"]
};
