#!/usr/bin/env node
// The hourly Course Plan sync (release 1, step 4). Runs inside the app container, started by a
// Coolify scheduled task:  node scripts/sync.mjs
// It acts as the database role tracker_sync (SYNC_JWT): reads the Sync Token from Vault, builds the
// inventory from Canvas with GET requests to an allowlist of paths only, checks data/plan.mjs
// against it, and stores the Course Plan. If the check fails, nothing is stored and the last good
// plan stays. It prints counts, never the token or Canvas content.
//   --dry-run  on the Maintainer's machine: the tools' usual token (Keychain or .env), no Vault,
//              nothing stored; checks that the allowlist covers what the inventory reads.
import { buildInventory } from "../sync/tools/canvas-sync.mjs";
import { useToken, restrictTo } from "../sync/tools/lib/canvas.mjs";
import { checkPlan, buildData } from "../sync/tools/lib/page.mjs";

const dry = process.argv.includes("--dry-run");
const url = process.env.NEXT_PUBLIC_SUPABASE_URL, anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, jwt = process.env.SYNC_JWT;
if (!dry && (!url || !anon || !jwt)) { console.error("sync: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY and SYNC_JWT must be set"); process.exit(2); }

async function rpc(name, body) {
  const res = await fetch(`${url}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: { apikey: anon, authorization: `Bearer ${jwt}`, "content-type": "application/json" },
    body: JSON.stringify(body || {}),
  });
  if (!res.ok) throw new Error(`sync: ${name} failed with ${res.status}`);
  return res.json();
}

const started = Date.now();
try {
  if (!dry) {
    const token = await rpc("sync_canvas_token");
    if (!token) throw new Error("sync: no Sync Token in Vault (run tools/set-sync-token.sh)");
    useToken(token);
  }
  // Exactly what buildInventory reads, nothing else.
  restrictTo([
    /^\/courses\/\d+\/modules$/,
    /^\/courses\/\d+\/assignments$/,
    /^\/courses\/\d+\/pages\/[^/]+$/,
    /^\/courses\/\d+\/discussion_topics\/\d+$/,
    /^\/announcements$/,
  ]);
  const inventory = await buildInventory();
  const problems = checkPlan(inventory);
  if (problems.length) {
    console.error(`sync: plan check failed, last good Course Plan kept:\n  ${problems.join("\n  ")}`);
    process.exit(1);
  }
  const plan = buildData(inventory);
  const at = dry ? "(dry run, not stored)" : await rpc("store_course_plan", { plan });
  const n = Object.values(inventory.courses).map(c => `${c.assignments.length} assignments, ${c.announcements.length} announcements`).join(" | ");
  console.log(`sync: stored Course Plan at ${at} (${n}) in ${Math.round((Date.now() - started) / 1000)} s`);
} catch (e) {
  console.error(e.message || String(e));
  process.exit(1);
}
