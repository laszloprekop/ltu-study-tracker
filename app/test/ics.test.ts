// node --experimental-strip-types test/ics.test.ts
import assert from "node:assert/strict";
import { parseIcs } from "../src/lib/ics.ts";

const ics = [
  "BEGIN:VCALENDAR",
  "BEGIN:VEVENT", "UID:a", "DTSTART:20261005T083000Z", "DTEND:20261005T100000Z", "SUMMARY:PVT_GW - Lab 2",
  "DESCRIPTION:<h1>3.5.4</h1><a href=\"https://ltuedu.instructure.com/courses/613/assignments/3015\">li", " nk</a>", "END:VEVENT",
  "BEGIN:VEVENT", "UID:b", "DTSTART;TZID=Europe/Stockholm:20261008T093000", "DTEND;TZID=Europe/Stockholm:20261008T120000", "SUMMARY:Lab 3.6.9 \\, part 1", "END:VEVENT",
  "BEGIN:VEVENT", "UID:c", "DTSTART;VALUE=DATE:20261012", "SUMMARY:Study day", "END:VEVENT",
  "BEGIN:VEVENT", "UID:d", "DTSTART;TZID=Europe/Stockholm:20261001T170000", "DTEND;TZID=Europe/Stockholm:20261001T180000", "RRULE:FREQ=WEEKLY;COUNT=4", "EXDATE;TZID=Europe/Stockholm:20261015T170000", "SUMMARY:Group meeting", "END:VEVENT",
  "BEGIN:VEVENT", "UID:e", "DTSTART:20261009T080000Z", "SUMMARY:Cancelled thing", "STATUS:CANCELLED", "END:VEVENT",
  "BEGIN:VEVENT", "UID:f", "DTSTART:20261026T090000Z", "DTEND:20261026T100000Z", "SUMMARY:After the clock change", "END:VEVENT",
  "END:VCALENDAR",
].join("\r\n");
const ev = parseIcs(ics, new Date("2026-10-03T00:00:00Z"), new Date("2026-11-01T00:00:00Z"));
const by = (t: string) => ev.filter(e => e.title.startsWith(t));
assert.deepEqual([by("PVT")[0].date, by("PVT")[0].start, by("PVT")[0].end], ["2026-10-05", "10:30", "12:00"]);    // UTC to Stockholm summer time
assert.equal(by("PVT")[0].canvas, "https://ltuedu.instructure.com/courses/613/assignments/3015");               // found across a folded line
assert.deepEqual([by("Lab 3.6.9")[0].start, by("Lab 3.6.9")[0].title], ["09:30", "Lab 3.6.9 , part 1"]);
assert.deepEqual([by("Study")[0].date, by("Study")[0].start], ["2026-10-12", null]);                             // all day
assert.deepEqual(by("Group").map(e => e.date), ["2026-10-08", "2026-10-22"]);                                     // weekly x4, 1 Oct before the window, 15 Oct excluded
assert.equal(by("Cancelled").length, 0);
assert.equal(ev.find(e => e.uid === "f")!.start, "10:00");                                                      // after the clock change: UTC+1
assert.equal(parseIcs(ics, new Date("2026-10-03T00:00:00Z"), new Date("2026-10-20T00:00:00Z")).find(e => e.uid === "f"), undefined); // outside the window
console.log("ics: 9 checks passed");
