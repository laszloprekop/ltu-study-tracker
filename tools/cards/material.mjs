#!/usr/bin/env node
// Downloads what a module teaches, as text, for drafting Cards: every page, discussion and assignment
// in the module (headings, lists and the Check Your Understanding questions kept), the slide PDFs and
// lecture transcripts they link, the captions of embedded YouTube lectures, the textbook's Knowledge Checks
// and interactive problems the pages link (gaia.cs.umass.edu), and per module the overview's Learning
// Objectives and Study Guide.
//   node tools/cards/material.mjs <course code> <module number>...      e.g. Z0025E 1 2 3
// Output: cache/course-material/<code>/m<N>/ (git-ignored: this is LTU's course material and the
// repo is public; only Cards written in our own words, naming their Sources, are committed).
// Read-only against Canvas. Needs pdftotext (poppler) for the slides and uvx for YouTube captions
// (tools/cards/yt-transcript.py, with youtube-transcript-api).
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { get, getAll } from "../lib/canvas.mjs";
import { readInventory } from "../lib/page.mjs";

const [code, ...mods] = process.argv.slice(2);
const inv = readInventory(), course = inv.courses[code];
if (!course || !mods.length) { console.error("Usage: node tools/cards/material.mjs <course code> <module number>..."); process.exit(2); }
const root = fileURLToPath(new URL("../../cache/course-material/", import.meta.url));
const C = `/courses/${course.canvasId}`;

// HTML to readable text: headings as ##, list items as "- ", revealed answers kept, links reduced to their text.
function text(html) {
  return String(html || "")
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, "")
    .replace(/<h([1-6])[^>]*>/gi, (_, n) => "\n\n" + "#".repeat(Math.min(6, Number(n) + 1)) + " ")
    .replace(/<\/h[1-6]>/gi, "\n")
    .replace(/<li[^>]*>/gi, "\n- ")
    .replace(/<(br|\/p|\/div|\/tr|\/details|summary)[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}
const slug = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);

for (const n of mods) {
  const mod = course.modules.find(m => m.items.some(i => i.number && i.number.split(".")[0] === n));
  if (!mod) { console.error(`${code}: no module ${n}`); continue; }
  const dir = `${root}${code}/m${n}/`; mkdirSync(dir + "files", { recursive: true });
  const items = await getAll(`${C}/modules/${mod.id}/items`);
  const byId = new Map(mod.items.map(i => [i.id, i]));
  const index = [`# ${code} ${mod.name}`, "", `Read ${new Date().toISOString().slice(0, 10)} from Canvas by tools/cards/material.mjs.`, ""];
  const fileIds = new Map(), videos = new Map(), exercises = new Map();
  for (const it of items) {
    const inv = byId.get(it.id); if (!inv || !inv.number) continue;
    let body = "", title = it.title;
    try {
      if (it.type === "Page") body = (await get(`${C}/pages/${it.page_url}`)).body;
      else if (it.type === "Discussion") body = (await get(`${C}/discussion_topics/${it.content_id}`)).message;
      else if (it.type === "Assignment") body = (await get(`${C}/assignments/${it.content_id}`)).description;
      else continue;
    } catch (e) { index.push(`- ${inv.number} ${title}: could not read (${e.message})`); continue; }
    const t = text(body), name = `${inv.number}-${slug(title)}.md`;
    // external links (Knowledge Checks, interactive problems, videos) keep their address
    const links = [...String(body).matchAll(/<a\s[^>]*href="(https?:\/\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)].map(m => [m[1].replace(/&amp;/g, "&"), text(m[2]).replace(/\s+/g, " ")]).filter(([u]) => !/instructure\.com|canvas\.ltu\.se/.test(u));
    for (const [u, x] of links) if (/gaia\.cs\.umass\.edu\/kurose_ross\/(knowledgechecks|interactive)\//.test(u) && !exercises.has(u)) exercises.set(u, { from: inv.number, title: x });
    const linkList = links.length ? "\n## Links\n\n" + [...new Map(links.map(l => [l[0], l])).values()].map(([u, x]) => `- ${x || "(no text)"}: ${u}`).join("\n") + "\n" : "";
    writeFileSync(dir + name, `# ${inv.number} ${title}\n\n${inv.url}\n\n${t}\n${linkList}`);
    for (const m of String(body).matchAll(/\/files\/(\d+)/g)) if (!fileIds.has(m[1])) fileIds.set(m[1], inv.number);
    for (const m of String(body).matchAll(/(?:title="([^"]*)"[^>]*?)?(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch\?v=|embed\/))([\w-]{11})/g)) if (!videos.has(m[2])) videos.set(m[2], { from: inv.number, title: m[1] || "" });
    index.push(`- ${inv.number} ${title} (${it.type}, ${t.split(/\s+/).length} words): ${name}`);
    // the overview carries what the module says matters: keep it at the top of the index
    if (inv.kind === "overview") {
      const keep = t.match(/#+ *Learning Objectives[\s\S]*?(?=\n#+ *Learning activities|$)/i), guide = t.match(/#+ *Study Guide[\s\S]*?(?=\n#+ *Support|$)/i);
      writeFileSync(dir + "objectives.md", `# ${code} Module ${n}: what the overview says matters\n\nFrom ${inv.number} ${title}, ${inv.url}\n\n${keep ? keep[0] : "(no Learning Objectives section)"}\n\n${guide ? guide[0] : "(no Study Guide section)"}\n`);
    }
  }
  index.push("", "## Linked files", "");
  for (const [id, from] of fileIds) {
    let f; try { f = await get(`/files/${id}`); } catch (e) { index.push(`- ${id} (from ${from}): not readable (${e.message})`); continue; }
    const type = f["content-type"] || "", base = `${dir}files/${id}-${slug(f.display_name)}`;
    if (!/pdf|text\/plain/.test(type) || !f.url) { index.push(`- ${id} ${f.display_name} (from ${from}, ${type}): skipped`); continue; }
    const out = base + (type.includes("pdf") ? ".pdf" : ".txt");
    if (!existsSync(out)) { const res = await fetch(f.url); if (!res.ok) { index.push(`- ${id} ${f.display_name}: download ${res.status}`); continue; } writeFileSync(out, Buffer.from(await res.arrayBuffer())); }
    if (type.includes("pdf")) execFileSync("pdftotext", ["-layout", out, base + ".txt"]);
    index.push(`- ${id} ${f.display_name} (from ${from}, ${type.includes("pdf") ? "slides" : "transcript"}): files/${base.split("/").pop()}.txt`);
  }
  // the textbook's exercises: Knowledge Checks (multiple choice per section) and interactive problems with solutions
  index.push("", "## Knowledge Checks and interactive problems", "");
  for (const [u, v] of exercises) {
    const q = /[?&]c=(\d+)&s=(\d+)/.exec(u), out = `${dir}files/` + (q ? `kc-${q[1]}-${q[2]}.txt` : `ia-${slug(u.split("/").pop().replace(/\.php.*$/, ""))}.txt`);
    if (!existsSync(out)) {
      const res = await fetch(u).catch(() => null);
      if (!res || !res.ok) { index.push(`- ${v.title} (from ${v.from}): not readable, ${u}`); continue; }
      writeFileSync(out, text((await res.text()).replace(/^[\s\S]*?<body[^>]*>/i, "")));
    }
    index.push(`- ${v.title} (from ${v.from}, ${q ? "Knowledge Check" : "interactive problem"}): files/${out.split("/").pop()}, ${u}`);
  }
  index.push("", "## YouTube captions", "");
  const script = fileURLToPath(new URL("./yt-transcript.py", import.meta.url));
  for (const [id, v] of videos) {
    const out = `${dir}files/yt-${id}.txt`;
    if (!existsSync(out)) {
      try { writeFileSync(out, execFileSync("uvx", ["--with", "youtube-transcript-api", "python", script, id], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], maxBuffer: 1 << 24 })); }
      catch { index.push(`- ${id} ${v.title} (from ${v.from}): no English captions`); continue; }
    }
    index.push(`- ${id} ${v.title} (from ${v.from}, captions): files/yt-${id}.txt`);
  }
  writeFileSync(dir + "index.md", index.join("\n") + "\n");
  console.log(`${code} module ${n}: ${items.length} items, ${fileIds.size} linked files, ${videos.size} YouTube videos, ${exercises.size} textbook exercises -> ${dir}`);
}
