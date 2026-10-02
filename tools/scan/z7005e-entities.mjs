// Read-only: parse Z7005E (course 613) Schema page, assignments and pages into dated entity kinds (sessions, deadlines, prep, bookings, group work, effort) as JSON on stdout.
// Usage: node tools/scan/z7005e-entities.mjs [courseId]   (default 613). Prints no person data beyond what the course pages state publicly.
import { get, getAll, strip } from "../lib/canvas.mjs";

const COURSE = process.argv[2] || "613";
const C = `/courses/${COURSE}`;
const MONTHS = { januari: 1, februari: 2, mars: 3, april: 4, maj: 5, juni: 6, juli: 7, augusti: 8, september: 9, oktober: 10, november: 11, december: 12 };
const YEAR = 2026;
const iso = (d, m) => `${YEAR}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

// Schema HTML to lines, keeping each <li>/<p> as one line and each link as "[text](href)".
function lines(html) {
  return String(html)
    .replace(/<a [^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g, (_, h, t) => `[${strip(t)}](${h.replace(/&amp;/g, "&")})`)
    .replace(/<\/?(li|p|h\d|br|ul)[^>]*>/g, "\n")
    .split("\n").map(l => strip(l)).filter(Boolean);
}

const links = l => [...l.matchAll(/\[([^\]]*)\]\(([^)]+)\)/g)].map(m => ({ text: m[1], href: m[2] }));
const refOf = t => (t.match(/(?:Del|Modul)?\s*(\d+(?:\.\d+)*)/) || [])[1] || null;

const schema = await get(`${C}/pages/schema`);
const out = { course: COURSE, scannedAt: new Date().toISOString(), schemaUpdatedAt: schema.updated_at, sessions: [], deadlines: [], prep: [], selfStudy: [], todoOnDate: [], unscheduled: [] };

let day = null, section = null;
for (const l of lines(schema.body)) {
  const dayM = l.match(/^(Måndag|Tisdag|Onsdag|Torsdag|Fredag|Lördag|Söndag)\s+(\d{1,2})\s+([a-zåäö]+)$/i);
  if (dayM) { day = iso(+dayM[2], MONTHS[dayM[3].toLowerCase()]); continue; }
  if (/^(Självstudier|Inlämningar|Schemalagda sessioner)$/i.test(l) || /^Viktigt att göra/i.test(l)) {
    section = l; const d = l.match(/(\d{1,2})\s+([a-zåäö]+)$/i); if (d && MONTHS[d[2]]) day = iso(+d[1], MONTHS[d[2]]); continue;
  }
  // Session: "09:15: ..." or "10:30 - 11:45: ..."
  const s = l.match(/^(\d{1,2}:\d{2})(?:\s*-\s*(\d{1,2}:\d{2}))?:\s*(.+)$/);
  if (s && day) {
    const ls = links(s[3].split(/att ha tittat på innan/)[0]).filter(x => !/zoom\.us/.test(x.href));
    const prep = s[3].match(/att ha tittat på innan:\s*(.+?)\)?$/);
    const kind = /Workshop/i.test(s[3]) ? "workshop" : /intervju/i.test(s[3]) ? "interview" : /seminar/i.test(s[3]) ? "seminar" : /Föreläsning/i.test(s[3]) ? "lecture" : "other";
    out.sessions.push({ date: day, start: s[1], end: s[2] || null, kind, refs: ls.map(x => refOf(x.text)).filter(Boolean), zoom: (s[3].match(/https:\/\/ltu-se\.zoom\.us\/\S+?(?=[\s)\]])/) || [])[0] || null, booking: /boka/i.test(s[3]), text: s[3].replace(/\]\([^)]*\)/g, "]") });
    if (prep) out.prep.push({ before: { date: day, start: s[1] }, watch: prep[1].replace(/\]\([^)]*\)/g, "]") });
    continue;
  }
  // Deadline in the week list: "Måndag 28 september (17:00): inlämning av [Grupp] [..](..)" or "Vecka 40 28/9 (17:00) - [Grupp] ..."
  const d1 = l.match(/^(?:[A-Za-zåäöÅÄÖ]+dag)\s+(\d{1,2})\s+([a-zåäö]+)\s+\((\d{1,2}:\d{2})\)\s*:\s*inlämning av\s*\[(Grupp|Individuell)\]\s*(.+)$/i);
  const d2 = l.match(/^Vecka\s+(\d+)\s+(\d{1,2})\/(\d{1,2})\s+\((\d{1,2}:\d{2})\)\s*-\s*\[(Grupp|Individuell)\]\s*(.+)$/i);
  if (d1 || d2) {
    const [date, time, who, rest] = d1 ? [iso(+d1[1], MONTHS[d1[2].toLowerCase()]), d1[3], d1[4], d1[5]] : [iso(+d2[2], +d2[3]), d2[4], d2[5], d2[6]];
    const a = links(rest).find(x => /assignments\/\d+/.test(x.href));
    out.deadlines.push({ date, time, group: /grupp/i.test(who), assignmentId: a ? +a.href.match(/assignments\/(\d+)/)[1] : null, source: d1 ? "week-list" : "summary-list" });
    continue;
  }
  if (/^Självstudier/i.test(section || "") || /^(Vecka \d+|När du har tid)/i.test(l) && /\[/.test(l)) {
    const w = l.match(/^(Vecka \d+|När du har tid[^:]*):\s*(.+)$/i);
    if (w) { out.selfStudy.push({ when: w[1], what: w[2].replace(/\]\([^)]*\)/g, "]") }); continue; }
  }
  if (/^Viktigt att göra/i.test(section || "") && !/^Vecka/.test(l)) { out.todoOnDate.push({ date: day, what: l.replace(/\]\([^)]*\)/g, "]") }); continue; }
  if (/^Vecka \d+\s+\w/i.test(l) && /(bokning|muntlig|doodle)/i.test(l)) out.unscheduled.push({ text: l });
  if (/^Muntliga examinationer$/i.test(l)) out.unscheduled.push({ text: l });
}

// Assignments: group flag, stated effort, booking links and "before" phrases in their prose.
const BOOK = /(doodle\.com|boka|book a?t? ?(a )?time|sign-?up)/i;
out.assignments = (await getAll(`${C}/assignments`)).map(a => {
  const text = strip(a.description);
  const eff = text.match(/Tidsåtgång:\s*~?\s*(\d+)\s*timm/i);
  const hrefs = [...String(a.description).matchAll(/href="([^"]+)"/g)].map(m => m[1].replace(/&amp;/g, "&"));
  return {
    id: a.id, name: a.name, due: a.due_at, grading: a.grading_type, group: a.group_category_id != null,
    effortHours: eff ? +eff[1] : null,
    bookings: hrefs.filter(h => /doodle\.com/.test(h)),
    crossRefs: hrefs.map(h => (h.match(/courses\/\d+\/assignments\/(\d+)/) || [])[1]).filter(Boolean).map(Number),
    dateMentions: [...text.matchAll(/\b(deadline|due|senast)[^.]{0,40}?(\d{1,2}\s+(?:januari|februari|mars|april|maj|juni|juli|augusti|september|oktober|november|december|January|February|March|April|May|June|July|August|September|October|November|December))/gi)].map(m => m[0]),
    beforePhrases: [...text.matchAll(/[^.]{0,80}\b(before|innan|prerequisite|at least one day)\b[^.]{0,80}/gi)].map(m => m[0].trim()),
    bookingPhrases: text.split(/(?<=[.!?])\s+/).filter(s => BOOK.test(s)).slice(0, 3)
  };
});

console.log(JSON.stringify(out, null, 1));
