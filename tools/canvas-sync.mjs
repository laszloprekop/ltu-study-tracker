#!/usr/bin/env node
// Read-only Canvas tools for the study tracker.
//
//   node tools/canvas-sync.mjs courses        list your Canvas courses with their ids
//   node tools/canvas-sync.mjs inventory      write data/canvas-inventory.json (modules, items, deadlines, announcements)
//   node tools/canvas-sync.mjs check          compare the committed inventory with Canvas and report every difference
//   node tools/canvas-sync.mjs announcements  print the announcements Canvas has for each course
//
// The token comes from $CANVAS_TOKEN, .env or the Keychain (see tools/lib/canvas.mjs). Never printed.

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { get, getAll, local, strip } from "./lib/canvas.mjs";
import { COURSES } from "../data/plan.mjs";

const INVENTORY = fileURLToPath(new URL("../data/canvas-inventory.json", import.meta.url));

// ---------- classification ----------

// Titles carry a number ("3.5.4") and often an emoji that says what the item is.
function parseTitle(raw) {
  const t = raw.replace(/\s+/g, " ").trim();
  const m = /^[^\p{L}\p{N}]*(\d+(?:\.\d+)*)?\s*(.*)$/u.exec(t);
  const number = m && m[1] ? m[1] : null;
  const title = (m ? m[2] : t).replace(/[\p{Extended_Pictographic}️‍]+/gu, "").replace(/\s+/g, " ").trim();
  return { number, title };
}

function kindOf(item, a) {
  const t = item.title;
  if (item.type === "Assignment") {
    if (/quiz/i.test(t)) return "quiz";
    if (/midterm|tenta|exam/i.test(t)) return "exam";
    return "handin";
  }
  if (item.type === "Discussion") {
    if (/🔎/.test(t)) return "poll";
    if (/🧠|▶️/.test(t)) return "selfpaced";
    return "discussion";
  }
  if (item.type === "Page") {
    if (/🖥/.test(t)) return "session";       // a scheduled Zoom lecture or workshop, page holds recording and slides
    if (/🏋/.test(t) || /exercise|övning/i.test(t)) return "exercise";
    if (/solution/i.test(t)) return "solutions";
    if (/🎓/.test(t) || /^lecture \d/i.test(t)) return "lecture";
    if (/📖/.test(t) || /overview/i.test(t)) return "overview";
    if (/🏁/.test(t) || /^end of/i.test(t) || /summary|wrap-up/i.test(t)) return "wrapup";
    if (/📋/.test(t) || /instructions/i.test(t)) return "instructions";
    if (/▶️/.test(t) || /^video/i.test(t)) return "video";
    return "reading";
  }
  if (item.type === "ExternalUrl") return "link";
  if (item.type === "File") return "file";
  return "other";
}

// Rough minutes, so a day can be planned. Words at 180/min, a video at about 10 min.
function minutes(kind, words, videos) {
  if (kind === "quiz") return 20;
  if (kind === "poll") return 2;
  if (["exam", "handin", "session", "link", "file", "other"].includes(kind)) return null;
  // Lecture pages carry embedded knowledge checks, so they read slower than plain text.
  const wpm = ["lecture", "selfpaced"].includes(kind) ? 110 : 180;
  const m = Math.round((words || 0) / wpm + (videos || 0) * 12);
  return m ? Math.max(5, Math.round(m / 5) * 5) : null;
}

function countVideos(html) {
  const srcs = new Set([...String(html || "").matchAll(/<(?:iframe|video)[^>]+src="([^"]+)"/gi)].map(m => m[1]));
  const yt = (String(html || "").match(/https?:\/\/(?:www\.)?(?:youtube\.com\/watch|youtu\.be\/)[^"'\s<]+/gi) || []);
  yt.forEach(u => srcs.add(u));
  return srcs.size;
}

// ---------- inventory ----------

async function courseInventory(code, course) {
  const id = course.canvasId;
  const modules = await getAll(`/courses/${id}/modules?include[]=items`);
  const assignments = await getAll(`/courses/${id}/assignments`);
  const byAssignment = new Map(assignments.map(a => [a.id, a]));
  const out = { canvasId: id, url: `https://ltuedu.instructure.com/courses/${id}`, modules: [], assignments: [], announcements: [] };

  for (const m of modules) {
    const mod = { id: m.id, position: m.position, name: parseTitle(m.name).title, url: `${out.url}/modules/${m.id}`, items: [] };
    let section = null;
    for (const it of m.items || []) {
      if (it.type === "SubHeader") { section = parseTitle(it.title).title; continue; }
      const { number, title } = parseTitle(it.title);
      const row = { id: it.id, number, title, type: it.type, kind: kindOf(it), section, url: it.html_url, indent: it.indent || 0 };
      if (it.type === "ExternalUrl") row.external = it.external_url;
      let body = null;
      if (it.type === "Page") body = (await get(`/courses/${id}/pages/${it.page_url}`)).body;
      else if (it.type === "Discussion") body = (await get(`/courses/${id}/discussion_topics/${it.content_id}`)).message;
      else if (it.type === "Assignment") {
        const a = byAssignment.get(it.content_id);
        if (a) {
          body = a.description; row.assignmentId = a.id; row.points = a.points_possible;
          row.submission = (a.submission_types || []).join("/");
          if (a.due_at) { const l = local(a.due_at); row.due = l.date; row.dueTime = l.time; }
          a.__moduleItem = row;
        }
      }
      if (typeof body === "string") {
        const text = strip(body);
        row.words = text.split(" ").filter(Boolean).length;
        row.videos = countVideos(body);
        row.files = new Set([...body.matchAll(/\/files\/(\d+)/g)].map(x => x[1])).size;
        const est = /(?:tidsåtgång|estimated time)[:\s~]*(\d+)\s*(h|timmar|hours|min)/i.exec(text) || /\[(\d+)\s*(min|h)\]/i.exec(it.title);
        if (est) row.statedMinutes = /^h|timmar|hours/i.test(est[2]) ? Number(est[1]) * 60 : Number(est[1]);
      }
      row.minutes = row.statedMinutes || minutes(row.kind, row.words, row.videos);
      mod.items.push(row);
    }
    out.modules.push(mod);
  }

  for (const a of assignments) {
    const { number, title } = parseTitle(a.name);
    const l = a.due_at ? local(a.due_at) : null;
    out.assignments.push({
      id: a.id, number, title, points: a.points_possible, submission: (a.submission_types || []).join("/"),
      due: l ? l.date : null, dueTime: l ? l.time : null, url: a.html_url,
      moduleItemUrl: a.__moduleItem ? a.__moduleItem.url : null, section: a.__moduleItem ? a.__moduleItem.section : null,
      kind: kindOf({ type: "Assignment", title: a.name })
    });
  }
  out.assignments.sort((x, y) => String(x.due || "9").localeCompare(String(y.due || "9")) || (x.number || "").localeCompare(y.number || "", undefined, { numeric: true }));

  const ann = await getAll(`/announcements?context_codes[]=course_${id}&start_date=2020-01-01&end_date=2030-01-01`);
  for (const x of ann) {
    const posted = x.posted_at ? local(x.posted_at) : null;
    out.announcements.push({ id: x.id, title: parseTitle(x.title).title, posted: posted ? posted.date : null, url: x.html_url, text: strip(x.message).slice(0, 600) });
  }
  out.announcements.sort((a, b) => String(a.posted).localeCompare(String(b.posted)));
  return out;
}

async function buildInventory() {
  const inv = { generatedAt: new Date().toISOString(), courses: {} };
  for (const [code, course] of Object.entries(COURSES)) {
    if (!course.canvasId) continue;
    process.stderr.write(`${code} ... `);
    inv.courses[code] = await courseInventory(code, course);
    const c = inv.courses[code];
    process.stderr.write(`${c.modules.length} modules, ${c.modules.reduce((n, m) => n + m.items.length, 0)} items, ${c.assignments.length} assignments, ${c.announcements.length} announcements\n`);
  }
  return inv;
}

async function inventory() {
  const inv = await buildInventory();
  writeFileSync(INVENTORY, JSON.stringify(inv, null, 1) + "\n");
  console.log(`Wrote ${INVENTORY}`);
}

// ---------- check: committed inventory vs live Canvas ----------

function diffCourse(code, oldC, newC) {
  const lines = [];
  const oldA = new Map(oldC.assignments.map(a => [a.id, a]));
  const newA = new Map(newC.assignments.map(a => [a.id, a]));
  for (const [id, a] of newA) {
    const o = oldA.get(id);
    if (!o) { lines.push(`  +  new assignment "${a.title}" due ${a.due || "no date"}`); continue; }
    const changed = [];
    if (o.due !== a.due || o.dueTime !== a.dueTime) changed.push(`due ${o.due || "-"} ${o.dueTime || ""} -> ${a.due || "-"} ${a.dueTime || ""}`);
    if (o.points !== a.points) changed.push(`points ${o.points} -> ${a.points}`);
    if (o.title !== a.title) changed.push(`title "${o.title}" -> "${a.title}"`);
    if (changed.length) lines.push(`  X  ${a.title}: ${changed.join("; ")}`);
  }
  for (const [id, o] of oldA) if (!newA.has(id)) lines.push(`  -  assignment "${o.title}" is gone from Canvas`);
  const oldItems = new Map(oldC.modules.flatMap(m => m.items).map(i => [i.id, i]));
  const newItems = new Map(newC.modules.flatMap(m => m.items).map(i => [i.id, i]));
  for (const [id, i] of newItems) if (!oldItems.has(id)) lines.push(`  +  new module item ${i.number || ""} "${i.title}" (${i.kind})`);
  for (const [id, o] of oldItems) if (!newItems.has(id)) lines.push(`  -  module item ${o.number || ""} "${o.title}" removed`);
  const oldAnn = new Set(oldC.announcements.map(a => a.id));
  for (const a of newC.announcements) if (!oldAnn.has(a.id)) lines.push(`  !  new announcement ${a.posted}: "${a.title}"\n     ${a.text.slice(0, 200)}`);
  return lines;
}

async function check() {
  if (!existsSync(INVENTORY)) { console.error("No data/canvas-inventory.json yet. Run: npm run inventory"); process.exit(1); }
  const old = JSON.parse(readFileSync(INVENTORY, "utf8"));
  const live = await buildInventory();
  let total = 0;
  for (const code of Object.keys(live.courses)) {
    const lines = old.courses[code] ? diffCourse(code, old.courses[code], live.courses[code]) : [`  +  course ${code} is new to the inventory`];
    console.log(`\n${code} ${COURSES[code].name}`);
    console.log(lines.length ? lines.join("\n") : "  ok  no changes");
    total += lines.length;
  }
  console.log(total ? `\n${total} difference(s). Run "npm run inventory" then "npm run build" to take them in.` : "\nInventory matches Canvas.");
}

// ---------- small commands ----------

async function courses() {
  const list = await getAll("/courses?include[]=term");
  list.sort((a, b) => String(b.start_at || "").localeCompare(String(a.start_at || "")));
  for (const c of list) {
    if (!c.id || c.access_restricted_by_date) continue;
    const span = [c.start_at, c.end_at].map(d => d ? d.slice(0, 10) : "?").join(" to ");
    console.log(`${String(c.id).padEnd(6)} ${(c.course_code || "").padEnd(22)} ${c.name}  [${c.term?.name || ""}] ${span}`);
  }
}

async function announcements() {
  for (const [code, course] of Object.entries(COURSES)) {
    if (!course.canvasId) continue;
    const ann = await getAll(`/announcements?context_codes[]=course_${course.canvasId}&start_date=2020-01-01&end_date=2030-01-01`);
    console.log(`\n${code}: ${ann.length} announcement(s)`);
    for (const a of ann) console.log(`  ${(a.posted_at || "").slice(0, 10)}  ${a.title}\n     ${strip(a.message).slice(0, 300)}`);
  }
}

const cmd = process.argv[2] || "check";
const run = { courses, inventory, check, announcements }[cmd];
if (!run) { console.error(`Unknown command "${cmd}". Use: courses | inventory | check | announcements`); process.exit(2); }
run().catch(e => { console.error(e.message); process.exit(1); });
