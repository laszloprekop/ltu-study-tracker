#!/usr/bin/env node
// Card coverage: for each dated assessment, how many shared Cards its Card Set holds and which of
// the items it tests have none. Reads the Cards from the tracker database over SSH (read only).
//   node tools/cards/coverage.mjs [-v]      -v lists every item with its Card count
// needsOf and expand are copies of the ones in src/template.html; keep them the same.
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { readInventory } from "../lib/page.mjs";
import { TERMS } from "../../data/plan.mjs";

const INV = readInventory();
const r = spawnSync(fileURLToPath(new URL("../db.sh", import.meta.url)), ["-qtA"], { encoding: "utf8",
  input: "select coalesce(json_agg(json_build_object('course', course, 'sources', sources)), '[]'::json) from public.card where kind <> 'answer';" });
if (r.status !== 0) { console.error("Could not read the cards:", (r.stderr || "").split("\n")[0]); process.exit(1); }
const cards = JSON.parse(r.stdout);
const t = TERMS.find(x => x.id === "ht26-lp2");
const items = code => INV.courses[code].modules.flatMap(m => m.items);
const isMaterial = i => i.kind !== "handin" && i.kind !== "exam" && i.kind !== "link";
function expand(code, ref) {
  const all = items(code);
  if (ref[0] === "#") { const s = ref.slice(1).toLowerCase(); return all.filter(i => i.title.toLowerCase().indexOf(s) === 0); }
  const [num, type] = ref.split("@");
  return all.filter(i => {
    if (!i.number || (type && i.type !== type)) return false;
    if (i.number === num) return true;
    return i.number.indexOf(num + ".") === 0 && i.kind !== "handin" && i.kind !== "session" && i.kind !== "link";
  });
}
function needsOf(code, aid) {
  const it = items(code).find(i => i.assignmentId === aid); if (!it) return [];
  const mod = INV.courses[code].modules.find(m => m.items.indexOf(it) >= 0), at = mod.items.indexOf(it), seen = {}, out = [];
  const add = i => { if (i !== it && isMaterial(i) && !seen[i.id]) { seen[i.id] = 1; out.push(i); } };
  if (it.due && !it.unlisted) {
    const same = it.section ? mod.items.filter(i => i !== it && i.section === it.section) : [];
    if (same.length) same.forEach(add);
    else mod.items.forEach((i, k) => { if (k < at && !(i.section && mod.items.some(x => x !== it && x.assignmentId && x.section === i.section))) add(i); });
  }
  ((t.needs || {})[code + ":" + aid] || []).forEach(r => expand(code, r).forEach(add));
  return out;
}
const bySrc = {};
for (const c of cards) for (const s of c.sources || []) bySrc[s] = (bySrc[s] || 0) + 1;
const verbose = process.argv.includes("-v");
for (const code of t.courses) {
  console.log("\n== " + code + " (" + cards.filter(c => c.course === code).length + " cards) ==");
  const as = INV.courses[code].assignments.filter(a => a.due).sort((a, b) => a.due.localeCompare(b.due));
  for (const a of as) {
    const need = needsOf(code, a.id), direct = "d:" + code + ":" + a.id;
    const set = cards.filter(c => (c.sources || []).some(s => s === direct || need.some(i => s === "m:" + code + ":" + i.id)));
    const bare = need.filter(i => !bySrc["m:" + code + ":" + i.id]);
    console.log(`${a.due.slice(0, 10)}  ${String(a.id).padEnd(5)} ${a.title.slice(0, 46).padEnd(46)} cards ${String(set.length).padStart(3)}   items ${need.length - bare.length}/${need.length} covered`);
    if (verbose) for (const i of need) console.log(`      ${bySrc["m:" + code + ":" + i.id] ? String(bySrc["m:" + code + ":" + i.id]).padStart(3) : "  -"}  ${(i.number || "").padEnd(6)} ${i.kind.padEnd(8)} ${i.title.slice(0, 70)}`);
  }
}
