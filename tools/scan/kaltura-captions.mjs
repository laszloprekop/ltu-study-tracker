// Captions of the Kaltura videos embedded in a course's Canvas pages, as plain text: node tools/scan/kaltura-captions.mjs <courseId> <outDir> <number prefix>...
//   node tools/scan/kaltura-captions.mjs 613 cache/course-material/Z7005E/captions 4.2 3.6
// Takes the Page items whose number in data/canvas-inventory.json starts with a prefix, reads each
// page from Canvas (read-only), and for every embedded video asks the Kaltura host named in the embed
// for its English captions, with the same anonymous widget session the player itself uses. The
// Canvas token is never sent to Kaltura. One file per video, named <number>-<heading>-<entry>.txt.
// The output is course material: keep it under cache/ (git-ignored), never commit it.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { get, strip } from "../lib/canvas.mjs";

const [course, out, ...prefixes] = process.argv.slice(2);
if (!course || !out || !prefixes.length) { console.error("usage: kaltura-captions.mjs <courseId> <outDir> <number prefix>..."); process.exit(1); }
mkdirSync(out, { recursive: true });

const inv = JSON.parse(readFileSync(fileURLToPath(new URL("../../data/canvas-inventory.json", import.meta.url)), "utf8"));
const entry = Object.values(inv.courses).find(c => (c.modules || []).some(m => (m.items || []).some(i => String(i.url).includes(`/courses/${course}/`))));
if (!entry) { console.error(`course ${course} is not in data/canvas-inventory.json`); process.exit(1); }
const items = entry.modules.flatMap(m => m.items || []).filter(i => i.type === "Page" && prefixes.some(p => String(i.number || "").startsWith(p)));

const sessions = new Map();
async function kaltura(host, partner, service, action, params) {
  const key = host + partner;
  if (!sessions.has(key)) {
    const r = await (await fetch(`${host}/api_v3/service/session/action/startWidgetSession?format=1&widgetId=_${partner}`)).json();
    if (!r.ks) throw new Error("Kaltura gave no widget session: " + JSON.stringify(r).slice(0, 200));
    sessions.set(key, r.ks);
  }
  const body = new URLSearchParams({ format: "1", ks: sessions.get(key), ...params });
  return fetch(`${host}/api_v3/service/${service}/action/${action}`, { method: "POST", body });
}
// SRT to running text: drop the counters and the time lines, join the rest.
const srt = s => s.split(/\r?\n/).filter(l => l.trim() && !/^\d+$/.test(l.trim()) && !l.includes("-->")).join(" ").replace(/\s+/g, " ").trim();
const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);

const modItems = await get(`/courses/${course}/modules?include[]=items&per_page=100`);
const pageUrl = new Map(modItems.flatMap(m => m.items || []).filter(i => i.page_url).map(i => [i.id, i.page_url]));
const index = [];
for (const it of items) {
  if (!pageUrl.has(it.id)) continue;
  const body = (await get(`/courses/${course}/pages/${pageUrl.get(it.id)}`)).body || "";
  // Walk the page in order, so each video takes the heading above it.
  let heading = "";
  for (const m of body.matchAll(/<h\d[^>]*>([\s\S]*?)<\/h\d>|src="(https:\/\/[^"/]+)\/p\/(\d+)\/[^"]*?entry_id=(\w+)/g)) {
    if (m[1] != null) { heading = strip(m[1]); continue; }
    const [, , host, partner, id] = m;
    const list = await (await kaltura(host, partner, "caption_captionasset", "list", { "filter[entryIdEqual]": id })).json();
    const cap = (list.objects || []).find(c => c.languageCode === "en") || (list.objects || [])[0];
    const name = `${it.number}-${slug(heading || it.title)}-${id}`;
    if (!cap) { index.push(`- ${it.number} ${heading || it.title} (${id}): no captions`); continue; }
    const text = srt(await (await kaltura(host, partner, "caption_captionasset", "serve", { captionAssetId: cap.id })).text());
    writeFileSync(`${out}/${name}.txt`, `${it.number} ${it.title}\n${heading}\n${cap.language}${cap.accuracy ? `, machine captions, stated accuracy ${cap.accuracy}%` : ""}\n\n${text}\n`);
    index.push(`- ${it.number} ${heading || it.title} (${id}, ${text.split(" ").length} words): ${name}.txt`);
  }
}
console.log(index.join("\n"));
