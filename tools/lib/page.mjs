// Building the tracker page, shared by tools/build.mjs (the Maintainer's machine, the artifact) and
// the hourly Course Plan sync in the app (app/scripts/sync.mjs).
//   checkPlan(inventory)            refs in data/plan.mjs that match nothing in Canvas
//   buildData(inventory, progress)  the DATA object the page reads
//   shell()                         the page with the /*__DATA__*/ marker still in it
//   withData(html, data)            the marker replaced by DATA
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { TEACHERS, COURSES, TERMS, LEGACY_IDS, MOVED_TO, BOOKINGS } from "../../data/plan.mjs";

const root = p => fileURLToPath(new URL("../../" + p, import.meta.url));
export const MARKER = "/*__DATA__*/";

export function readInventory() { return JSON.parse(readFileSync(root("data/canvas-inventory.json"), "utf8")); }

// Fail on refs that match nothing: a silent miss would hide work from the page.
export function checkPlan(inventory) {
  const itemsOf = code => (inventory.courses[code]?.modules || []).flatMap(m => m.items);
  const refMatches = (code, ref) => {
    const items = itemsOf(code);
    if (ref.startsWith("#")) return items.filter(i => i.title.toLowerCase().startsWith(ref.slice(1).toLowerCase()));
    const [num, type] = ref.split("@");
    return items.filter(i => i.number && (i.number === num || i.number.startsWith(num + ".")) && (!type || i.type === type));
  };
  const isAssignment = (code, id) => (inventory.courses[code]?.assignments || []).some(a => String(a.id) === id);
  const problems = [];
  for (const term of TERMS) {
    for (const s of term.study) for (const r of s.refs) if (!refMatches(s.course, r).length) problems.push(`${term.id} study ${s.week} ${s.course} ref "${r}" matches nothing`);
    for (const s of term.sessions) {
      for (const r of [s.ref, ...(s.also || []), ...(s.prep || [])].filter(Boolean)) if (!refMatches(s.course, r).length) problems.push(`${term.id} session ${s.date} ${s.course} ref "${r}" matches nothing`);
      if (!term.courses.includes(s.course)) problems.push(`${term.id} session ${s.date} names course ${s.course}, not in the term`);
    }
    for (const key of Object.keys(term.notes)) {
      const [code, id] = key.split(":");
      if (id !== "quizzes" && !isAssignment(code, id)) problems.push(`${term.id} note ${key} names no Canvas assignment`);
    }
    for (const [key, refs] of Object.entries(term.needs || {})) {
      const [code, id] = key.split(":");
      if (!isAssignment(code, id)) problems.push(`${term.id} needs ${key} names no Canvas assignment`);
      for (const r of refs) if (!refMatches(code, r).length) problems.push(`${term.id} needs ${key} ref "${r}" matches nothing`);
    }
    const ids = new Set();
    for (const t of term.tasks) {
      if (ids.has(t.id)) problems.push(`duplicate task id ${t.id}`); ids.add(t.id);
      if (t.for) { const [code, id] = t.for.split(":"); if (!isAssignment(code, id)) problems.push(`task ${t.id} is for ${t.for}, which is no Canvas assignment`); }
    }
  }
  for (const [code, c] of Object.entries(COURSES)) for (const o of c.optional || []) for (const r of o.refs) if (!refMatches(code, r).length) problems.push(`${code} optional ref "${r}" matches nothing`);
  const taskIds = new Set(TERMS.flatMap(t => t.tasks.map(x => x.id)));
  for (const b of BOOKINGS) {
    const [code, id] = b.for.split(":");
    if (!isAssignment(code, id)) problems.push(`booking ${b.id} is for ${b.for}, which is no Canvas assignment`);
    if (!taskIds.has(b.task)) problems.push(`booking ${b.id} names task ${b.task}, which does not exist`);
    if (!/^[A-Za-z0-9_-]{20,}$/.test(b.sheet)) problems.push(`booking ${b.id} has no valid sheet id`);
  }
  return problems;
}

// Teacher photos are inlined as data URIs, because the published page cannot load images from elsewhere.
function teachers() {
  const out = {};
  for (const [key, t] of Object.entries(TEACHERS)) out[key] = { ...t, photo: t.photo ? "data:image/jpeg;base64," + readFileSync(root(t.photo)).toString("base64") : null };
  return out;
}

// progress is the Maintainer's own Canvas completion state: only ever for a --private build.
export function buildData(inventory, progress = null) {
  if (MOVED_TO !== null && !/^https:\/\/[a-z0-9.-]+\/?$/i.test(MOVED_TO)) throw new Error("MOVED_TO in data/plan.mjs must be null or an https address");
  return { built: new Date().toISOString(), private: !!progress, plan: { TEACHERS: teachers(), COURSES, TERMS, LEGACY_IDS, MOVED_TO, BOOKINGS }, inventory, progress };
}

export function shell() {
  const template = readFileSync(root("src/template.html"), "utf8");
  // The page must stay ASCII (see the JSON escaping below), so a stray typed character stops the build.
  const stray = /[^\x00-\x7e]/.exec(template);
  if (stray) throw new Error(`src/template.html has a non-ASCII character on line ${template.slice(0, stray.index).split("\n").length}: use a \\uXXXX escape or an HTML entity.`);
  if (!template.includes(MARKER)) throw new Error("src/template.html has no /*__DATA__*/ marker");
  // Phosphor duotone icons as one hidden sprite; the page uses them with <use href="#i-name">.
  const iconDir = root("assets/icons");
  const symbols = readdirSync(iconDir).filter(f => f.endsWith(".svg")).sort().map(f => {
    const inner = readFileSync(iconDir + "/" + f, "utf8").replace(/^[\s\S]*?<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");
    return `<symbol id="i-${f.slice(0, -4)}" viewBox="0 0 256 256">${inner}</symbol>`;
  }).join("");
  const sprite = `<svg xmlns="http://www.w3.org/2000/svg" style="display:none" aria-hidden="true">${symbols}</svg>`;
  return "<!-- Generated by tools/build.mjs from src/template.html, data/plan.mjs and data/canvas-inventory.json. Do not edit. -->\n" +
    template.replace("<!--__ICONS__-->", sprite);
}

// ASCII only, so the file reads correctly whatever charset a server claims, and no "</script".
export function dataJs(data) {
  return JSON.stringify(data).replace(/<\/script/gi, "<\\/script").replace(/[\u007f-￿]/g, ch => "\\u" + ch.charCodeAt(0).toString(16).padStart(4, "0"));
}
export function withData(html, data) { return html.replace(MARKER, "const DATA = " + dataJs(data) + ";"); }
