// Building the tracker page, shared by tools/build.mjs (the Maintainer's machine, the artifact) and
// the hourly Course Plan sync in the app (app/scripts/sync.mjs).
//   checkPlan(inventory)            refs in data/plan.mjs that match nothing in Canvas
//   buildData(inventory, progress)  the DATA object the page reads
//   shell()                         the page with the /*__DATA__*/ marker still in it
//   version()                       the page's version, from git
//   withData(html, data)            the marker replaced by DATA
import { readFileSync, readdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { TEACHERS, COURSES, TERMS, LEGACY_IDS, MOVED_TO, BOOKINGS, DISAGREEMENTS, PROGRAMME } from "../../data/plan.mjs";

const root = p => fileURLToPath(new URL("../../" + p, import.meta.url));
export const MARKER = "/*__DATA__*/";
const VERSION_MARKER = "__VERSION__";

// The version in the footer and in bug reports, from git: the latest tag of the form v1.0 gives the
// first two numbers, the commits since that tag the third (git describe). The built page is
// committed together with its source, so a build with changes not yet committed counts the commit
// they are about to become; the app's build in CI starts from that commit and so gets the same
// number. A new tag (v1.1, v2.0) starts the count again.
export function version() {
  const git = (...args) => execFileSync("git", args, { cwd: root("."), encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  let described;
  try { described = git("describe", "--tags", "--long", "--match", "v[0-9]*"); }
  catch { throw new Error("No version tag (like v1.0) in the git history here, so the page has no version. In a shallow clone, fetch the history and tags first (git fetch --unshallow --tags)."); }
  const m = /^v(\d+)\.(\d+)-(\d+)-g[0-9a-f]+$/.exec(described);
  if (!m) throw new Error("A version tag must be two numbers, as in v1.0; git describe says " + described);
  const pending = !process.env.CI && git("status", "--porcelain", "--", ".", ":(exclude)ltu-study-tracker.html") !== "";
  return m[1] + "." + m[2] + "." + (Number(m[3]) + (pending ? 1 : 0));
}

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
  const sessionKeys = new Set(TERMS.flatMap(t => t.sessions.map(x => `s:${x.course}:${x.date}:${x.start || ""}`)));
  for (const d of DISAGREEMENTS) {
    const [kind, code, id] = d.about.split(":");
    if (kind === "d" && !isAssignment(code, id)) problems.push(`disagreement about ${d.about}: no such assignment`);
    if (kind === "s" && !sessionKeys.has(d.about)) problems.push(`disagreement about ${d.about}: no such session`);
    if (!["d", "s"].includes(kind) || (d.values || []).length < 2) problems.push(`disagreement about ${d.about}: needs a d: or s: id and two values`);
  }
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
  return { built: new Date().toISOString(), private: !!progress, plan: { TEACHERS: teachers(), COURSES, TERMS, LEGACY_IDS, MOVED_TO, BOOKINGS, DISAGREEMENTS, PROGRAMME }, inventory, progress };
}

export function shell() {
  const template = readFileSync(root("src/template.html"), "utf8");
  // The page must stay ASCII (see the JSON escaping below), so a stray typed character stops the build.
  const stray = /[^\x00-\x7e]/.exec(template);
  if (stray) throw new Error(`src/template.html has a non-ASCII character on line ${template.slice(0, stray.index).split("\n").length}: use a \\uXXXX escape or an HTML entity.`);
  if (!template.includes(MARKER)) throw new Error("src/template.html has no /*__DATA__*/ marker");
  if (template.split(VERSION_MARKER).length !== 2) throw new Error("src/template.html must have " + VERSION_MARKER + " exactly once");
  // Two functions of one name: the later silently replaces the earlier, so stop the build.
  const names = [...template.matchAll(/^function (\w+)\(/gm)].map(m => m[1]);
  const twice = names.filter((n, i) => names.indexOf(n) !== i);
  if (twice.length) throw new Error(`src/template.html defines these functions twice: ${[...new Set(twice)].join(", ")}`);
  // Every icon the page names must exist, or it renders as an empty box.
  const have = new Set(readdirSync(root("assets/icons")).filter(f => f.endsWith(".svg")).map(f => f.slice(0, -4)));
  const named = new Set([...template.matchAll(/\bic\("([a-z-]+)"/g), ...template.matchAll(/#i-([a-z-]+)/g)].map(m => m[1]));
  const missing = [...named].filter(n => !have.has(n));
  if (missing.length) throw new Error(`src/template.html names icons that are not in assets/icons: ${missing.join(", ")} (add them to tools/fetch-icons.sh)`);
  // Phosphor duotone icons as one hidden sprite; the page uses them with <use href="#i-name">.
  const iconDir = root("assets/icons");
  const symbols = readdirSync(iconDir).filter(f => f.endsWith(".svg")).sort().map(f => {
    const inner = readFileSync(iconDir + "/" + f, "utf8").replace(/^[\s\S]*?<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");
    return `<symbol id="i-${f.slice(0, -4)}" viewBox="0 0 256 256">${inner}</symbol>`;
  }).join("");
  const sprite = `<svg xmlns="http://www.w3.org/2000/svg" style="display:none" aria-hidden="true">${symbols}</svg>`;
  return "<!-- Generated by tools/build.mjs from src/template.html, data/plan.mjs and data/canvas-inventory.json. Do not edit. -->\n" +
    template.replace("<!--__ICONS__-->", sprite).replace(VERSION_MARKER, version());
}

// ASCII only, so the file reads correctly whatever charset a server claims, and no "</script".
export function dataJs(data) {
  return JSON.stringify(data).replace(/<\/script/gi, "<\\/script").replace(/[\u007f-￿]/g, ch => "\\u" + ch.charCodeAt(0).toString(16).padStart(4, "0"));
}
export function withData(html, data) { return html.replace(MARKER, "const DATA = " + dataJs(data) + ";"); }
