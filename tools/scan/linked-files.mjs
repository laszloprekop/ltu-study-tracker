// List (and with --download, save) every course file linked from a dump-course.mjs dump's pages, assignments and discussions: node tools/scan/linked-files.mjs <courseId> <dumpDir> [--download]
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { get } from "../lib/canvas.mjs";

const [course, dir, flag] = process.argv.slice(2);
const read = n => existsSync(`${dir}/${n}.json`) ? JSON.parse(readFileSync(`${dir}/${n}.json`, "utf8")) : [];
const sources = [
  ...read("pages").map(p => [`page ${p.title}`, p.body]),
  ...read("assignments").map(a => [`assignment ${a.name}`, a.description]),
  ...read("discussions").map(d => [`discussion ${d.title}`, d.message]),
  ...read("announcements").map(d => [`announcement ${d.title}`, d.message]),
];
const seen = new Map();
for (const [where, html] of sources)
  for (const m of String(html || "").matchAll(/\/courses\/(\d+)\/files\/(\d+)/g)) {
    const key = `${m[1]}/${m[2]}`;
    if (!seen.has(key)) seen.set(key, { course: m[1], id: m[2], where: new Set() });
    seen.get(key).where.add(where);
  }
const out = [];
if (flag === "--download") mkdirSync(`${dir}/files`, { recursive: true });
for (const f of seen.values()) {
  let meta;
  try { meta = await get(`/courses/${f.course}/files/${f.id}`); } catch (e) { meta = { error: e.message }; }
  const row = { course: f.course, id: f.id, name: meta.display_name, size: meta.size, type: meta["content-type"],
    updated: meta.updated_at, locked: meta.locked || meta.locked_for_user || !meta.url, error: meta.error, where: [...f.where] };
  out.push(row);
  if (flag === "--download" && meta.url && f.course === course) {
    const res = await fetch(meta.url);
    if (res.ok) writeFileSync(`${dir}/files/${f.id}-${meta.display_name}`, Buffer.from(await res.arrayBuffer()));
  }
}
writeFileSync(`${dir}/linked-files.json`, JSON.stringify(out, null, 1));
for (const r of out) console.log([r.course, r.id, r.name, r.size, r.locked ? "LOCKED" : "", r.error || "", r.where.length + " refs"].join(" | "));
