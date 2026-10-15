#!/usr/bin/env node
// Tests the Narvaro report draft (the "Narvaro Report" block in src/template.html): the three styles in
// English and Swedish, the sheet's layout against the programme's template, and the .xlsx file itself.
//   node tools/test-narvaro.mjs
// With --write <dir> it also writes one .xlsx per style there, to open in Excel, Numbers or Sheets.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import assert from "node:assert/strict";
import { COURSES, PROGRAMME } from "../data/plan.mjs";

const src = readFileSync(fileURLToPath(new URL("../src/template.html", import.meta.url)), "utf8");
const a = src.indexOf("/* ---------- Narvaro Report"), b = src.indexOf("/* ---------- Cards", a);
if (a < 0 || b < 0) throw new Error("no Narvaro Report block in src/template.html");
const esc = s => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const TEACHERS = { "josef-hallberg": { name: "Josef Hallberg" }, "chen-wei-yang": { name: "Chen-Wei Yang" } };
const iso = d => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
const addDays = (x, n) => { const d = new Date(x + "T00:00:00"); d.setDate(d.getDate() + n); return iso(d); };
const isoWeek = x => { const d = new Date(x + "T00:00:00Z"); d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7)); const y = new Date(Date.UTC(d.getUTCFullYear(), 0, 1)); return Math.ceil(((d - y) / 864e5 + 1) / 7); };
const nv = new Function("P", "COURSES", "TEACHERS", "esc", "addDays", "isoWeek",
  src.slice(a, b) + "; return { narvaroLines, narvaroTeachers, narvaroModel, narvaroGrid, narvaroXlsx, narvaroHtml, narvaroPlain, narvaroDayRows, crc32 };")(
  { PROGRAMME }, COURSES, TEACHERS, esc, addDays, isoWeek);

let n = 0;
const test = (name, fn) => { fn(); n++; console.log("ok  " + name); };

// Friday 16 Oct 2026 as the Course Plan has it, with Lab 4 ticked on Thursday and two quizzes ticked that day.
const fri = [
  { kind: "session", skind: "lecture", code: "Z7005E", time: "09:15", end: "10:30", title: "Lecture 14, unit testing and refactoring" },
  { kind: "session", skind: "lab", code: "Z0025E", time: "13:00", end: "15:00", title: "Lab 3 session, subnetting, Packet Tracer skills 6 to 7" },
  { kind: "handin", akind: "handin", code: "Z0025E", time: "23:59", title: "Lab 3 report", done: false }
];
const thu = [
  { kind: "handin", akind: "handin", code: "Z7005E", time: "17:00", title: "Lab 4, Understanding software design", done: true },
  { kind: "material", code: "Z0025E", title: "4.4 Module 4 Quiz", done: true },
  { kind: "material", code: "Z0025E", title: "4.5 End of Module 4", done: true },
  { kind: "cal", code: "", time: "15:00", end: "16:00", title: "Group meeting" }
];
const tue = [
  { kind: "session", skind: "lecture", code: "Z7005E", time: "09:15", end: "10:15", title: "Lecture 8, agile development and XP" },
  { kind: "session", skind: "lecture", code: "Z7005E", time: "10:30", end: "12:00", title: "Lecture 10, plus parts of Lectures 9 and 12" },
  { kind: "task", code: "Z0025E", title: "Book a Lab 3 assessment slot on sheet 9.2", done: true }
];

test("detailed: one line per activity, with topic, time and whether a hand-in went in", () => {
  assert.deepEqual(nv.narvaroLines(fri, "detailed", "en"), [
    "Z7005E PVT: Lecture 14 (unit testing and refactoring), 09:15–10:30",
    "Z0025E NET: Lab 3 session (subnetting, Packet Tracer skills 6 to 7), 13:00–15:00",
    "Z0025E NET: Lab 3 report, due 23:59"]);
  assert.deepEqual(nv.narvaroLines(thu, "detailed", "en"), [
    "Z7005E PVT: Lab 4 (Understanding software design), submitted",
    "Group meeting, 15:00–16:00",
    "Z0025E NET: Self-study: 4.4 Module 4 Quiz; 4.5 End of Module 4"]);
});
test("detailed in Swedish: the frame is translated, titles stay", () => {
  assert.deepEqual(nv.narvaroLines(fri, "detailed", "sv"), [
    "Z7005E PVT: Föreläsning 14 (unit testing and refactoring), 09:15–10:30",
    "Z0025E NET: Redovisning Lab 3 (subnetting, Packet Tracer skills 6 to 7), 13:00–15:00",
    "Z0025E NET: Lab 3 report, inlämning senast 23:59"]);
});
test("compact: one line per day, courses by their Swedish names, numbers merged", () => {
  assert.deepEqual(nv.narvaroLines(fri, "compact", "en"), ["Programvaruteknik: lecture 14; Datorkommunikation: Lab 3 session, work on Lab 3"]);
  assert.deepEqual(nv.narvaroLines(tue, "compact", "en"), ["Programvaruteknik: lectures 8 and 10; Datorkommunikation: Book a Lab 3 assessment slot on sheet 9.2"]);
  assert.deepEqual(nv.narvaroLines(tue, "compact", "sv"), ["Programvaruteknik: föreläsning 8 och 10; Datorkommunikation: Book a Lab 3 assessment slot on sheet 9.2"]);
  assert.deepEqual(nv.narvaroLines(thu, "compact", "sv"), ["Programvaruteknik: inlämning Lab 4; Datorkommunikation: självstudier; Group meeting"]);
});
test("short: a few words per day", () => {
  assert.deepEqual(nv.narvaroLines(fri, "short", "en"), ["Programvaruteknik lecture + Datorkommunikation lab and hand-in"]);
  assert.deepEqual(nv.narvaroLines(fri, "short", "sv"), ["Programvaruteknik föreläsning + Datorkommunikation labb och inlämning"]);
  assert.deepEqual(nv.narvaroLines(thu, "short", "en"), ["Programvaruteknik hand-in + Datorkommunikation self-study + group work"]);
});
test("a day with nothing on it says self-study and group work", () => {
  for (const style of ["detailed", "compact", "short"]) {
    assert.deepEqual(nv.narvaroLines([], style, "en"), ["Self-study and group work"]);
    assert.deepEqual(nv.narvaroLines([], style, "sv"), ["Självstudier, grupparbeten"]);
  }
});
test("teachers: with their courses in Detailed, names only otherwise", () => {
  const t = { courses: ["Z7005E", "Z0025E"] };
  assert.equal(nv.narvaroTeachers(t, "detailed"), "Programvaruteknik Z7005E: Josef Hallberg, Datorkommunikation Z0025E: Chen-Wei Yang");
  assert.equal(nv.narvaroTeachers(t, "compact"), "Josef Hallberg, Chen-Wei Yang");
});

const draft = (style, days) => ({ mon: "2026-10-12", style, teachers: nv.narvaroTeachers({ courses: ["Z7005E", "Z0025E"] }, style), days });
const cell = (g, r, c) => (g.rows[r] || []).find(x => x.c === c);
test("one line a day: the sheet is the template cell for cell", () => {
  const g = nv.narvaroGrid(nv.narvaroModel(draft("compact", ["a", "b", "c", "d", "e"]), "A Student"));
  assert.equal(cell(g, 1, 0).v, "Närvarorapportering Programmerare Fullstack");
  assert.deepEqual([cell(g, 3, 0).v, cell(g, 3, 1).v, cell(g, 3, 6).v, cell(g, 3, 12).v, cell(g, 3, 13).v], ["Namn:", "A Student", "Lärare:", "Vecka:", 42]);
  assert.deepEqual([6, 8, 10, 12, 14].map(r => cell(g, r, 0).v), ["Måndag:", "Tisdag:", "Onsdag:", "Torsdag:", "Fredag:"]);
  assert.deepEqual([6, 8, 10, 12, 14].map(r => cell(g, r, 1).v), ["a", "b", "c", "d", "e"]);
  assert.deepEqual([17, 18, 19, 21, 22, 23].map(r => cell(g, r, 0).s), ["note", "note", "note", "note", "note", "mark"]);
  assert.match(cell(g, 19, 0).v, /senast fredag förmiddag/);
  assert.equal(g.last, 23);
});
test("several lines a day: under one another, the notes move down", () => {
  const g = nv.narvaroGrid(nv.narvaroModel(draft("detailed", ["a1\na2\na3", "", "c", "d", "e1\ne2"]), ""));
  assert.equal(cell(g, 6, 0).v, "Måndag 2026-10-12");
  assert.deepEqual([6, 7, 8].map(r => cell(g, r, 1).v), ["a1", "a2", "a3"]);
  assert.equal(cell(g, 10, 0).v, "Tisdag 2026-10-13");
  assert.equal(cell(g, 10, 1), undefined);
  assert.deepEqual([cell(g, 16, 0).v, cell(g, 16, 1).v, cell(g, 17, 1).v], ["Fredag 2026-10-16", "e1", "e2"]);
  assert.equal(cell(g, 20, 0).s, "note");
  assert.equal(cell(g, 3, 7).s, "fieldwrap");
});

// Reads a stored zip back: every entry's name, data and whether its CRC matches.
function unzip(buf) {
  const v = new DataView(buf.buffer, buf.byteOffset, buf.byteLength), out = {};
  let eocd = buf.length - 22; while (v.getUint32(eocd, true) !== 0x06054b50) eocd--;
  let at = v.getUint32(eocd + 16, true);
  for (let i = 0; i < v.getUint16(eocd + 10, true); i++) {
    assert.equal(v.getUint32(at, true), 0x02014b50);
    const crc = v.getUint32(at + 16, true), size = v.getUint32(at + 24, true), nl = v.getUint16(at + 28, true), off = v.getUint32(at + 42, true);
    const name = new TextDecoder().decode(buf.subarray(at + 46, at + 46 + nl));
    assert.equal(v.getUint32(off, true), 0x04034b50);
    const start = off + 30 + v.getUint16(off + 26, true) + v.getUint16(off + 28, true), data = buf.subarray(start, start + size);
    out[name] = { text: new TextDecoder().decode(data), crcOk: nv.crc32(data) === crc };
    at += 46 + nl + v.getUint16(at + 30, true) + v.getUint16(at + 32, true);
  }
  return out;
}
test("crc32 matches the standard check value", () => {
  assert.equal(nv.crc32(new TextEncoder().encode("123456789")), 0xCBF43926);
});
test("the .xlsx is a zip of the five parts Excel needs, CRCs right, cells inline", () => {
  const g = nv.narvaroGrid(nv.narvaroModel(draft("detailed", ["Z0025E NET: Lecture 9 (NAT & IPv6) <now>", "", "", "", ""]), "A Student"));
  const files = unzip(nv.narvaroXlsx(g, "vecka42"));
  assert.deepEqual(Object.keys(files).sort(), ["[Content_Types].xml", "_rels/.rels", "xl/_rels/workbook.xml.rels", "xl/styles.xml", "xl/workbook.xml", "xl/worksheets/sheet1.xml"]);
  assert.ok(Object.values(files).every(f => f.crcOk));
  const sheet = files["xl/worksheets/sheet1.xml"].text;
  assert.match(files["xl/workbook.xml"].text, /<sheet name="vecka42"/);
  assert.match(sheet, /<c r="B6" s="0" t="inlineStr"><is><t xml:space="preserve">Z0025E NET: Lecture 9 \(NAT &amp; IPv6\) &lt;now&gt;<\/t><\/is><\/c>/);
  assert.match(sheet, /<c r="N3" s="3"><v>42<\/v><\/c>/);
  assert.match(sheet, /<mergeCell ref="H3:K3"\/>/);
  assert.match(sheet, /<col min="1" max="1" width="24"/);
});
test("the copied table has the same cells, the teachers spanning H to K", () => {
  const m = nv.narvaroModel(draft("compact", ["a", "b", "c", "d", "e"]), "A Student"), g = nv.narvaroGrid(m), html = nv.narvaroHtml(g);
  assert.equal((html.match(/<tr/g) || []).length, 23);
  assert.match(html, /<td colspan="4" style="background:#ffff00;white-space:nowrap">Josef Hallberg, Chen-Wei Yang<\/td>/);
  assert.match(nv.narvaroPlain(m), /^Närvarorapportering Programmerare Fullstack\n\nNamn: A Student\nLärare: Josef Hallberg, Chen-Wei Yang\nVecka: 42\n\nMåndag:\ta\n/);
});
test("Copy Day/Activity: the shape Google Sheets copies a day column beside an activity column", () => {
  // week 41 of the sheet it was made for, as Sheets copied it (B to H: the day, the activity merged C:H)
  const week = [
    ["Z0025E NET: Lecture 6 (TCP flow control and congestion control)", "Z7005E PVT: Group task - Lab 2 Evaluating software design with SOLID principles, finished and submitted"],
    ["Z0025E NET: Lecture 8 (network layer, inside a router and IP format)", "Z7005E PVT: Group task - Lab 3 Identifying design patterns in real-world projects"],
    ["Z7005E PVT: Group task - Lab 3 Identifying design patterns, continued", "Z0025E NET: Self paced learning - Lecture 7 (transport-layer services, multiplexing and UDP) with forum post"],
    ["Z7005E PVT: Group task - Lab 3 Identifying design patterns, finished and submitted", "Z0025E NET: Self paced learning - Module 3 quiz, Module 4 overview"],
    ["Z7005E PVT: Self paced learning - Software quality attributes (module 4.2)", "Z7005E PVT: Group task - Lab 4 Understanding software design, started (due Thu 15 Oct)"]];
  const names = ["Måndag", "Tisdag", "Onsdag", "Torsdag", "Fredag"], T = "\t";
  const want = week.map((lines, i) => '"' + names[i] + "\n2026-10-0" + (5 + i) + '"' + T + lines[0] + T.repeat(5) + "\n" + T + lines[1] + T.repeat(5) + "\n" + T.repeat(6)).join("\n");
  const m = nv.narvaroModel({ mon: "2026-10-05", style: "compact", teachers: "", days: week.map(l => l.join("\n")) }, "");
  assert.equal(nv.narvaroDayRows(m), want);
});
test("Copy Day/Activity: an empty day keeps its row, a quote is quoted", () => {
  const m = nv.narvaroModel({ mon: "2026-10-12", style: "short", teachers: "", days: ["", 'Read "Clean Code"\twith tabs', "c", "d", "e"] }, "");
  const rows = nv.narvaroDayRows(m).split("\n");
  assert.equal(rows[0], '"Måndag');
  assert.equal(rows[1], '2026-10-12"' + "\t" + "\t".repeat(5));
  assert.equal(rows[4], '2026-10-13"\t"Read ""Clean Code"" with tabs"' + "\t".repeat(5));
});
console.log(n + " passed");

const w = process.argv.indexOf("--write");
if (w > 0) {
  const dir = process.argv[w + 1]; mkdirSync(dir, { recursive: true });
  const days = { detailed: [fri, tue, [], thu, fri], compact: [fri, tue, [], thu, fri], short: [fri, tue, [], thu, fri] };
  for (const style of Object.keys(days)) for (const lang of ["en", "sv"]) {
    const d = draft(style, days[style].map(x => nv.narvaroLines(x, style, lang).join("\n"))), m = nv.narvaroModel(d, "A Student"), g = nv.narvaroGrid(m);
    writeFileSync(join(dir, `narvaro-${style}-${lang}.xlsx`), nv.narvaroXlsx(g, "vecka42"));
    writeFileSync(join(dir, `narvaro-${style}-${lang}.html`), nv.narvaroHtml(g));
  }
  console.log("wrote 6 .xlsx and 6 .html files to " + dir);
}
