#!/usr/bin/env node
// Compares the study tracker page with Canvas, read-only.
//
//   node tools/canvas-sync.mjs courses   list your Canvas courses with their ids (find new ones here)
//   node tools/canvas-sync.mjs check     compare every deadline row in the page with Canvas (default)
//
// The token comes from, in order: $CANVAS_TOKEN, a CANVAS_TOKEN= line in the .env file beside the page
// (git-ignored), or the macOS Keychain item "ltu-canvas-token":
//   security add-generic-password -a "$USER" -s ltu-canvas-token -w
// The script never prints it.

import { readFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const BASE = "https://ltuedu.instructure.com";
const PAGE = fileURLToPath(new URL("../ltu-study-tracker.html", import.meta.url));
const TZ = "Europe/Stockholm";
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const ENV_FILE = fileURLToPath(new URL("../.env", import.meta.url));

function token() {
  if (process.env.CANVAS_TOKEN) return process.env.CANVAS_TOKEN.trim();
  if (existsSync(ENV_FILE)) {
    const m = /^\s*CANVAS_TOKEN\s*=\s*["']?([^"'\r\n]+?)["']?\s*$/m.exec(readFileSync(ENV_FILE, "utf8"));
    if (m) return m[1];
  }
  try {
    return execFileSync("security", ["find-generic-password", "-s", "ltu-canvas-token", "-w"],
      { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    console.error("No Canvas token. Put CANVAS_TOKEN=... in the .env file beside the page, set CANVAS_TOKEN,\n" +
      "or store it in the Keychain with:\n" +
      "  security add-generic-password -a \"$USER\" -s ltu-canvas-token -w");
    process.exit(2);
  }
}

// GET every page of a Canvas list endpoint, following the Link header.
async function getAll(path) {
  const auth = { Authorization: "Bearer " + token() };
  let url = BASE + "/api/v1" + path + (path.includes("?") ? "&" : "?") + "per_page=100";
  const out = [];
  while (url) {
    const res = await fetch(url, { headers: auth });
    if (res.status === 401) throw new Error("Canvas refused the token (401). It may be expired or mistyped.");
    if (!res.ok) throw new Error(`Canvas ${res.status} for ${path}`);
    out.push(...await res.json());
    const next = (res.headers.get("link") || "").split(",").find(p => p.includes('rel="next"'));
    url = next ? next.slice(next.indexOf("<") + 1, next.indexOf(">")) : null;
  }
  return out;
}

// Run the page's data block (everything before the "Page" marker) and take COURSES and TERMS out of it.
function loadPage() {
  const html = readFileSync(PAGE, "utf8");
  const script = html.slice(html.indexOf("<script>") + 8, html.indexOf("/* ---------- Page ---------- */"));
  const ctx = {};
  vm.runInNewContext(script + "\nthis.out = {COURSES, TERMS};", ctx);
  return ctx.out;
}

// Date and time of a Canvas timestamp in Stockholm, as "2026-09-28" and "17:00".
function local(iso) {
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23"
  }).formatToParts(new Date(iso)).map(x => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, time: `${p.hour}:${p.minute}` };
}

// A row's day label ("Mon 28", "Fri 2 Oct") read against its week's Monday. Null for "This week" and the like.
function rowDate(label, weekStart) {
  const m = /(\d{1,2})(?:\s+([A-Z][a-z]{2}))?/.exec(label);
  if (!m) return null;
  const start = new Date(weekStart + "T12:00:00Z");
  let month = m[2] ? MONTHS.indexOf(m[2]) : start.getUTCMonth();
  let year = start.getUTCFullYear();
  if (!m[2] && Number(m[1]) < start.getUTCDate()) month += 1;
  if (month > 11) { month -= 12; year += 1; }
  return `${year}-${String(month + 1).padStart(2, "0")}-${m[1].padStart(2, "0")}`;
}

function rowTime(text) {
  const m = /due (\d{2}:\d{2})/.exec(text) || /close[s]? (\d{2}:\d{2})/.exec(text);
  return m ? m[1] : null;
}

async function courses() {
  const list = await getAll("/courses?include[]=term");
  list.sort((a, b) => String(b.start_at || b.term?.start_at).localeCompare(String(a.start_at || a.term?.start_at)));
  for (const c of list) {
    if (!c.id || c.access_restricted_by_date) continue;
    const term = c.term?.name || "";
    const span = [c.start_at, c.end_at].map(d => d ? d.slice(0, 10) : "?").join(" to ");
    console.log(`${String(c.id).padEnd(6)} ${(c.course_code || "").padEnd(22)} ${c.name}  [${term}] ${span}`);
  }
}

async function check() {
  const { COURSES, TERMS } = loadPage();
  let problems = 0;

  for (const term of TERMS) {
    if (!term.weeks.length) continue;
    console.log(`\n== ${term.label}, ${term.period}`);
    const first = term.weeks[0].start;
    const lastWeek = term.weeks[term.weeks.length - 1].start;
    const end = new Date(new Date(lastWeek + "T12:00:00Z").getTime() + 7 * 864e5).toISOString().slice(0, 10);

    for (const code of term.courses) {
      const canvas = COURSES[code].canvas;
      const id = canvas && /\/courses\/(\d+)/.exec(canvas)?.[1];
      if (!id) { console.log(`\n${code}: not in Canvas yet, skipped`); continue; }

      const assignments = await getAll(`/courses/${id}/assignments`);
      const byId = new Map(assignments.map(a => [String(a.id), a]));
      const seen = new Set();
      const lines = [];

      for (const week of term.weeks) {
        for (const row of week.rows) {
          if (row.c !== code || !row.deadline) continue;
          const date = rowDate(row.d, week.start);
          const time = rowTime(row.t);
          const ids = (row.links || [])
            .map(l => new RegExp(`/courses/${id}/assignments/(\\d+)$`).exec(l[1])?.[1]).filter(Boolean);
          // A row linking to the whole assignments list covers everything due at its date and time.
          const coversList = (row.links || []).some(l => l[1] === `${canvas}/assignments`);
          const targets = ids.length ? ids.map(i => byId.get(i) || { id: i, missing: true })
            : coversList ? assignments.filter(a => a.due_at && local(a.due_at).date === date) : [];

          if (!targets.length) { lines.push(`  ?  ${row.d.padEnd(10)} ${row.t}  (no Canvas assignment linked, not checked)`); continue; }
          for (const a of targets) {
            seen.add(String(a.id));
            if (a.missing) { problems++; lines.push(`  X  ${row.d.padEnd(10)} ${row.t}  -> assignment ${a.id} is gone from Canvas`); continue; }
            if (!a.due_at) { lines.push(`  ?  ${row.d.padEnd(10)} ${row.t}  -> "${a.name}" has no due date in Canvas`); continue; }
            const due = local(a.due_at);
            const wrong = [];
            if (date && due.date !== date) wrong.push(`date ${due.date}`);
            if (time && due.time !== time) wrong.push(`time ${due.time}`);
            if (wrong.length) { problems++; lines.push(`  X  ${row.d.padEnd(10)} ${row.t}  -> Canvas says ${wrong.join(", ")} ("${a.name}")`); }
            else lines.push(`  ok ${row.d.padEnd(10)} ${row.t}${ids.length ? "" : `  ("${a.name}")`}`);
          }
        }
      }

      const unlisted = assignments.filter(a => !seen.has(String(a.id)) && a.due_at &&
        local(a.due_at).date >= first && local(a.due_at).date < end);
      for (const a of unlisted) {
        problems++;
        const due = local(a.due_at);
        lines.push(`  +  ${due.date} ${due.time}  "${a.name}" is due in Canvas but not in the page`);
      }
      console.log(`\n${code} ${COURSES[code].name} (Canvas ${id})`);
      console.log(lines.join("\n"));
    }
  }
  console.log(problems ? `\n${problems} difference(s) to look at.` : "\nThe page matches Canvas.");
}

const cmd = process.argv[2] || "check";
const run = { courses, check }[cmd];
if (!run) { console.error(`Unknown command "${cmd}". Use: courses | check`); process.exit(2); }
run().catch(e => { console.error(e.message); process.exit(1); });
