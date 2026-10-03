// node --experimental-strip-types test/signup-sheet.test.ts
// The layout is the real export's (one cell per line); every name is made up.
import assert from "node:assert/strict";
import { parseSheet } from "../src/lib/signup-sheet.ts";

const text = `﻿[Z0025E] Lab Signup Sheet
ZOOM LINK: https://ltu-se.zoom.us/j/1
1. Lab2 - Oct 2nd - 13:00pm
Time
Group \\# and Name (First name + Last Name)
Status (Green = Complete)
0 - 15 minutes (13:00)
Grupp 7:Ada Example Bo Example
16 - 30 minutes (13:15)
Grupp 2:
Cy Example
31 - 45 minutes (13:30)
Group 5:Di Example
106 - 120 minutes (14:45)
Group 8:
Ed Example
121 - 135 minutes (15:00)

1. Lab3 - Oct 16th - 13:00am
Time
0 - 15 minutes (09:00)
16 - 30 minutes (09:15)
Lab group 4 Fi Example
31 - 45 minutes (09:30)
`;
const today = new Date("2026-10-03T12:00:00Z");
const [lab2, lab3] = parseSheet(text, today);
assert.equal(lab2.section, "Lab2"); assert.equal(lab2.date, "2026-10-02"); assert.equal(lab2.headingTime, "13:00");
assert.deepEqual(lab2.slots.map(s => [s.time, s.group]), [["13:00", 7], ["13:15", 2], ["13:30", 5], ["14:45", 8], ["15:00", null]]);
assert.equal(lab3.date, "2026-10-16"); assert.equal(lab3.headingTime, "13:00"); // the sheet's own heading, kept to show the disagreement
assert.deepEqual(lab3.slots.map(s => [s.time, s.group]), [["09:00", null], ["09:15", 4], ["09:30", null]]);
assert.ok(!JSON.stringify(parseSheet(text, today)).includes("Example"), "no names in the result");
// a sheet read in late December still dates a January session in the next year
assert.equal(parseSheet("Lab1 - Jan 9th - 10:00\n0 - 15 minutes (10:00)", new Date("2026-12-20T00:00:00Z"))[0].date, "2027-01-09");
console.log("signup sheet: 9 checks passed");
