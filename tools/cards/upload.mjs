#!/usr/bin/env node
// Uploads drafted Cards (release 4) to the tracker database over SSH, as the Maintainer, marked
// AI-drafted and unchecked: each is shared only after a classmate Checks it (CONTEXT.md, Check).
//   node tools/cards/upload.mjs data/cards/<file>.json [--dry-run]
// The file: { cards: [{ course, sources: ["4.2", ...] (Canvas item numbers or "d:<assignment id>"), prompt, answer, kind? }] }
// kind is concept (default) or question. Answer Cards are never uploaded: ADR 0002.
// A card whose prompt is already in the database for its course is skipped, so a file can be sent again.
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { readInventory } from "../lib/page.mjs";

const [file] = process.argv.slice(2).filter(a => !a.startsWith("--")), dry = process.argv.includes("--dry-run");
if (!file) { console.error("Usage: node tools/cards/upload.mjs <file.json> [--dry-run]"); process.exit(2); }
const inv = readInventory(), { cards } = JSON.parse(readFileSync(file, "utf8"));
const problems = [], rows = [];
for (const [n, c] of cards.entries()) {
  const kind = c.kind || "concept", course = inv.courses[c.course];
  if (!["concept", "question"].includes(kind)) { problems.push(`card ${n + 1}: kind ${kind} cannot be uploaded`); continue; }
  if (!course) { problems.push(`card ${n + 1}: unknown course ${c.course}`); continue; }
  const items = course.modules.flatMap(m => m.items);
  const sources = (c.sources || []).map(s => {
    if (s.startsWith("d:")) return course.assignments.some(a => String(a.id) === s.slice(2)) ? `d:${c.course}:${s.slice(2)}` : null;
    const it = items.find(i => i.number === s); return it ? `m:${c.course}:${it.id}` : null;
  });
  if (!sources.length || sources.includes(null)) { problems.push(`card ${n + 1}: a source matches nothing (${c.sources})`); continue; }
  if (!c.prompt || c.prompt.length < 3 || c.prompt.length > 2000 || (c.answer || "").length > 4000) { problems.push(`card ${n + 1}: prompt or answer length`); continue; }
  rows.push({ kind, course: c.course, sources, prompt: c.prompt, answer: c.answer || "" });
}
if (problems.length) { console.error("Upload stopped:\n  " + problems.join("\n  ")); process.exit(1); }
const q = s => { let tag = "c"; while (s.includes("$" + tag + "$")) tag += "x"; return `$${tag}$${s}$${tag}$`; };
const sql = ["\\set ON_ERROR_STOP 1", "begin;"].concat(rows.map(r =>
  `insert into public.card (kind, prompt, answer, sources, course, owner, ai_drafted) select ${q(r.kind)}, ${q(r.prompt)}, ${q(r.answer)}, array[${r.sources.map(q).join(",")}], ${q(r.course)}, (select user_id from public.app_maintainer limit 1), true where not exists (select 1 from public.card where course = ${q(r.course)} and prompt = ${q(r.prompt)}) and exists (select 1 from public.app_maintainer);`
)).concat(["commit;", "select count(*) || ' cards in the database' from public.card;"]).join("\n");
if (dry) { console.log(`${rows.length} cards checked, nothing sent (dry run).`); process.exit(0); }
const r = spawnSync("ssh", ["-o", "BatchMode=yes", "root@157.90.168.58", "docker exec -i supabase-db-aqhq0ki76r5bniaurku9xpzf psql -U postgres -qtA"], { input: sql, encoding: "utf8" });
if (r.status !== 0) { console.error("Upload failed:", (r.stderr || "").split("\n")[0]); process.exit(1); }
console.log(`${rows.length} cards checked and sent. ${r.stdout.trim().split("\n").pop()}`);
