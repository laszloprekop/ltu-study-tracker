#!/usr/bin/env node
// Before every dev or production build: build the shared tracker page from the repo (never the
// --private build, which holds the Maintainer's Canvas progress) and copy it, with the browser
// build of supabase-js, to where the app serves them from.
import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const at = p => fileURLToPath(new URL(p, import.meta.url));
execFileSync(process.execPath, [at("../../tools/build.mjs")], { stdio: "inherit" });

const page = at("../../ltu-study-tracker.html");
if (/"private":true/.test(readFileSync(page, "utf8"))) throw new Error("Refusing to serve a private build.");
mkdirSync(at("../tracker"), { recursive: true });
copyFileSync(page, at("../tracker/index.html"));

mkdirSync(at("../public/vendor"), { recursive: true });
copyFileSync(at("../node_modules/@supabase/supabase-js/dist/umd/supabase.js"), at("../public/vendor/supabase.js"));
console.log("Prepared tracker/index.html and public/vendor/supabase.js");
