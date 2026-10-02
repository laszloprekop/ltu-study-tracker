// Read-only dump of one Canvas course (modules, items, pages, assignments, discussions, announcements, quizzes, files, tabs) to a directory: node tools/scan/dump-course.mjs <courseId> <outDir>
import { mkdirSync, writeFileSync } from "node:fs";
import { get, getAll } from "../lib/canvas.mjs";

const [course, out] = process.argv.slice(2);
if (!course || !out) { console.error("usage: dump-course.mjs <courseId> <outDir>"); process.exit(1); }
mkdirSync(out, { recursive: true });
const save = (name, data) => writeFileSync(`${out}/${name}.json`, JSON.stringify(data, null, 1));
const tryGet = async (fn, path) => { try { return await fn(path); } catch (e) { return { error: String(e.message) }; } };
const C = `/courses/${course}`;

save("course", await tryGet(get, `${C}?include[]=syllabus_body&include[]=term`));
save("front_page", await tryGet(get, `${C}/front_page`));
save("tabs", await tryGet(getAll, `${C}/tabs`));
const modules = await tryGet(getAll, `${C}/modules?include[]=items&include[]=content_details`);
save("modules", modules);
const pagesList = await tryGet(getAll, `${C}/pages`);
const pages = [];
if (Array.isArray(pagesList)) for (const p of pagesList) pages.push(await tryGet(get, `${C}/pages/${encodeURIComponent(p.url)}`));
// The pages list can be disabled for students; fall back to each Page module item.
if (!pages.length && Array.isArray(modules)) for (const m of modules) for (const it of m.items || [])
  if (it.type === "Page") pages.push({ module_item: it.id, ...(await tryGet(get, `${C}/pages/${it.page_url}`)) });
save("pages", pages);

save("assignments", await tryGet(getAll, `${C}/assignments?include[]=overrides`));
save("assignment_groups", await tryGet(getAll, `${C}/assignment_groups`));
save("discussions", await tryGet(getAll, `${C}/discussion_topics`));
save("announcements", await tryGet(getAll, `/announcements?context_codes[]=course_${course}&start_date=2026-01-01&end_date=2027-12-31`));
save("quizzes", await tryGet(getAll, `${C}/quizzes`));
save("files", await tryGet(getAll, `${C}/files`));
save("folders", await tryGet(getAll, `${C}/folders`));
save("groups", await tryGet(getAll, `${C}/groups`));
save("group_categories", await tryGet(getAll, `${C}/group_categories`));
save("calendar_events", await tryGet(getAll, `/calendar_events?context_codes[]=course_${course}&all_events=true`));
save("appointment_groups", await tryGet(getAll, `/appointment_groups?context_codes[]=course_${course}&include_past_appointments=true`));
save("external_tools", await tryGet(getAll, `${C}/external_tools?include_parents=true`));
// File module items one by one (the files list endpoint may be 403).
const fileMeta = [];
if (Array.isArray(modules)) for (const m of modules) for (const it of m.items || [])
  if (it.type === "File") fileMeta.push({ item: it.id, title: it.title, meta: await tryGet(get, `${C}/files/${it.content_id}`) });
save("file_items", fileMeta);
console.log("done", out);
