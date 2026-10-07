#!/usr/bin/env node
// Checks drafted Cards before an upload: length, the answer marks the page renders, and duplicates
// against every other file in data/cards/ (which mirrors the database).
//   node tools/cards/lint.mjs [file.json ...]      no file: every file; the limits apply to files from 2026-10-07 on
// Limits: prompt 120 characters, answer 600 (a card is at most twice as tall as wide; longer text scrolls).
// A pair of prompts in one course sharing most of their words is listed as a possible duplicate: read
// both and decide, the check only points.
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const dir = fileURLToPath(new URL("../../data/cards/", import.meta.url));
const all = readdirSync(dir).filter(f => f.endsWith(".json")).sort();
const picked = process.argv.slice(2).map(f => f.split("/").pop());
const strict = f => (picked.length ? picked.includes(f) : f >= "2026-10-07");
const STOP = new Set("a an the of to in on for and or is are does do what which how why when it its that this with from by as at be can between versus difference name two three four five six one say says mean means work works used use".split(" "));
const words = s => new Set(s.toLowerCase().replace(/[^a-z0-9åäö/ ]+/g, " ").split(/\s+/).filter(w => w.length > 1 && !STOP.has(w)).map(w => w.replace(/(ies|es|s)$/, "")));
const cards = [], problems = [];
for (const f of all) for (const [n, c] of JSON.parse(readFileSync(dir + f, "utf8")).cards.entries()) cards.push({ f, n: n + 1, ...c, w: words(c.prompt) });
for (const c of cards.filter(c => strict(c.f))) {
  const at = `${c.f} #${c.n} "${c.prompt.slice(0, 50)}"`, lines = c.answer.split("\n");
  if (c.prompt.length > 120) problems.push(`${at}: prompt ${c.prompt.length} characters`);
  if (c.answer.length > 600) problems.push(`${at}: answer ${c.answer.length} characters`);
  if ((c.prompt + c.answer).includes("—")) problems.push(`${at}: em dash`);
  if (!/^Key: \S/.test(lines[lines.length - 1])) problems.push(`${at}: the last line is not "Key: ..."`);
  if (lines.filter(l => /^\s*key:/i.test(l)).length !== 1) problems.push(`${at}: not exactly one Key line`);
  if (/^\s*([-*]|\d+[.)])\s/.test(lines[0])) problems.push(`${at}: the first line is a list item, not the answer`);
  if (lines.some(l => !l.trim())) problems.push(`${at}: empty line`);
  if (lines.some(l => /^#|^\s{2,}[-*]\s|^\s*\|.*\|\s*$|\]\(http/.test(l))) problems.push(`${at}: heading, nested list, table or link`);
  if ((c.answer.match(/\*\*/g) || []).length % 2 || (c.answer.match(/`/g) || []).length % 2) problems.push(`${at}: unbalanced ** or \``);
  if (!c.sources || !c.sources.length || c.sources.length > 2) problems.push(`${at}: ${c.sources ? c.sources.length : 0} sources`);
}
const pairs = [];
for (let i = 0; i < cards.length; i++) for (let j = i + 1; j < cards.length; j++) {
  const a = cards[i], b = cards[j];
  if (a.course !== b.course || !(strict(a.f) || strict(b.f))) continue;
  if (a.prompt.trim().toLowerCase() === b.prompt.trim().toLowerCase()) { problems.push(`same prompt: ${a.f} #${a.n} and ${b.f} #${b.n}: "${a.prompt}"`); continue; }
  const both = [...a.w].filter(x => b.w.has(x)).length, score = both / Math.min(a.w.size, b.w.size);
  if (both >= 2 && score >= 0.75) pairs.push([score, `  ${a.f.slice(11, -5)} #${a.n}: ${a.prompt}\n  ${b.f.slice(11, -5)} #${b.n}: ${b.prompt}`]);
}
const n = cards.filter(c => strict(c.f)).length;
if (pairs.length) console.log(`Possible duplicates (${pairs.length}), closest first:\n` + pairs.sort((p, q) => q[0] - p[0]).map(p => p[1]).join("\n\n") + "\n");
if (problems.length) { console.error(`${problems.length} problems in ${n} cards:\n  ` + problems.join("\n  ")); process.exit(1); }
console.log(`${n} cards checked: lengths and marks are fine.`);
