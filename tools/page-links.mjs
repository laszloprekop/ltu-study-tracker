#!/usr/bin/env node
// Read-only probe: what links and module mentions a Canvas page body carries. Used on 2026-09-30 to
// decide whether page bodies could yield relations for the map (they cannot, see
// docs/canvas-data-map.md, "Relations"). Run it again when a course changes shape.
//
//   node tools/page-links.mjs 614 "Midterm 1 Instructions" 613 Schema
//
// Arguments come in pairs: Canvas course id, then a title fragment of a module item.
import { get, getAll, strip } from "./lib/canvas.mjs";

const args = process.argv.slice(2);
if (args.length < 2 || args.length % 2) { console.error('Usage: node tools/page-links.mjs <courseId> "<title fragment>" [...]'); process.exit(2); }
const pairs = []; for (let i = 0; i < args.length; i += 2) pairs.push([Number(args[i]), args[i + 1]]);

const modules = {};
for (const [cid, title] of pairs) {
  modules[cid] = modules[cid] || await getAll(`/courses/${cid}/modules?include[]=items&per_page=50`);
  const it = modules[cid].flatMap(m => m.items).find(i => i.title.replace(/^[^\p{L}]*[\d.]+\s*/u, "").toLowerCase().includes(title.toLowerCase()));
  if (!it) { console.log(`\n## ${cid} "${title}": no module item with that title`); continue; }
  const body = it.type === "Page" ? (await get(`/courses/${cid}/pages/${it.page_url}`)).body
    : it.type === "Discussion" ? (await get(`/courses/${cid}/discussion_topics/${it.content_id}`)).message : "";
  const links = [...String(body || "").matchAll(/href="([^"]+)"/g)].map(m => m[1].replace("https://ltuedu.instructure.com", ""));
  const text = strip(body || "");
  console.log(`\n## ${cid} ${it.title}  (${text.split(" ").length} words, ${links.length} links)`);
  const byKind = {};
  for (const l of links) {
    const k = /\/modules\/items\//.test(l) ? "module item" : /\/modules\//.test(l) ? "module" : /\/pages\//.test(l) ? "page" : /\/files\//.test(l) ? "file"
      : /\/assignments\//.test(l) ? "assignment" : /\/quizzes\//.test(l) ? "quiz" : /\/discussion/.test(l) ? "discussion" : "external";
    (byKind[k] = byKind[k] || []).push(l);
  }
  for (const [k, ls] of Object.entries(byKind)) console.log(`  ${k}: ${ls.length}  e.g. ${ls.slice(0, 3).join(" , ")}`);
  const hits = text.match(/[^.]*\b(Module|Modul|Lecture|Föreläsning|Chapter|Del)\s*\d[^.]*\./g) || [];
  hits.slice(0, 8).forEach(h => console.log("  > " + h.trim().slice(0, 200)));
}
