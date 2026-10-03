#!/usr/bin/env node
// Before every dev or production build:
// - tracker/shell.html: the tracker page with its /*__DATA__*/ marker kept; the app fills in the
//   Course Plan per request (from the database, else the plan built here).
// - tracker/data.json: the Course Plan as built from the committed inventory, the fallback.
// - sync/: the repo files the hourly sync runs (tools, data/plan.mjs, the template and assets), in
//   the same layout as the repo so their relative imports hold.
// - public/vendor/supabase.js: the browser build of supabase-js, served from here, not a CDN.
// Never the --private build or data/my-progress.json.
import { copyFileSync, cpSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { checkPlan, buildData, shell, readInventory } from "../../tools/lib/page.mjs";

const at = p => fileURLToPath(new URL(p, import.meta.url));

const inventory = readInventory();
const problems = checkPlan(inventory);
if (problems.length) { console.error("Build stopped:\n  " + problems.join("\n  ")); process.exit(1); }
rmSync(at("../tracker"), { recursive: true, force: true });
mkdirSync(at("../tracker"), { recursive: true });
writeFileSync(at("../tracker/shell.html"), shell());
writeFileSync(at("../tracker/data.json"), JSON.stringify(buildData(inventory)));

rmSync(at("../sync"), { recursive: true, force: true });
for (const f of ["tools/canvas-sync.mjs", "tools/lib/canvas.mjs", "tools/lib/page.mjs", "data/plan.mjs", "data/canvas-inventory.json", "src/template.html"]) {
  mkdirSync(at("../sync/" + f.replace(/[^/]+$/, "")), { recursive: true });
  copyFileSync(at("../../" + f), at("../sync/" + f));
}
cpSync(at("../../assets"), at("../sync/assets"), { recursive: true });
writeFileSync(at("../sync/package.json"), JSON.stringify({ type: "module", private: true }));

for (const f of ["favicon.svg", "favicon.ico", "apple-touch-icon.png"]) copyFileSync(at("../../assets/favicon/" + f), at("../public/" + f));
mkdirSync(at("../public/vendor"), { recursive: true });
copyFileSync(at("../node_modules/@supabase/supabase-js/dist/umd/supabase.js"), at("../public/vendor/supabase.js"));
copyFileSync(at("../node_modules/ts-fsrs/dist/index.umd.js"), at("../public/vendor/ts-fsrs.js"));
console.log("Prepared tracker/, sync/ and public/vendor/supabase.js");
