#!/usr/bin/env node
// Builds ltu-study-tracker.html from src/template.html, data/plan.mjs and data/canvas-inventory.json.
// With --private, data/my-progress.json (your own Canvas completion state) is included and the output is
// ltu-study-tracker.private.html, git-ignored, never the shared page. The pieces live in tools/lib/page.mjs,
// which the app's hourly sync uses too.

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { checkPlan, buildData, shell, withData, readInventory } from "./lib/page.mjs";

const root = p => fileURLToPath(new URL("../" + p, import.meta.url));
const inventory = readInventory();
const problems = checkPlan(inventory);
if (problems.length) { console.error("Build stopped:\n  " + problems.join("\n  ")); process.exit(1); }

const isPrivate = process.argv.includes("--private");
let progress = null;
if (isPrivate) {
  if (!existsSync(root("data/my-progress.json"))) { console.error("No data/my-progress.json. Run: npm run progress"); process.exit(1); }
  progress = JSON.parse(readFileSync(root("data/my-progress.json"), "utf8"));
}
let html;
try { html = withData(shell(), buildData(inventory, progress)); } catch (e) { console.error(e.message); process.exit(1); }
const outName = isPrivate ? "ltu-study-tracker.private.html" : "ltu-study-tracker.html";
// A page whose script does not parse shows nothing at all, and no test loads it: stop the build instead.
for (const m of html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)) {
  try { new Function(m[1]); } catch (e) { throw new Error("The page script has a syntax error (" + e.message + "). Look for an unescaped quote in src/template.html."); }
}
writeFileSync(root(outName), html);
const kb = Math.round(Buffer.byteLength(html) / 1024);
console.log(`Wrote ${outName} (${kb} KB)${isPrivate ? " with your Canvas completion state. Do not share this file." : ""}`);
