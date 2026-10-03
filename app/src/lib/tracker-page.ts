import { readFileSync } from "node:fs";
import { join } from "node:path";

// The tracker page is the same file the claude.ai artifact publishes. It reaches storage only
// through window.claude.use("db") and use("user"); public/bridge.js provides both on top of
// Supabase, so the page itself needs no change to run here. Its DATA (the Course Plan) comes from
// the database row the hourly sync writes, else from the plan built into the image.

const MARKER = "/*__DATA__*/";
const PLAN_TTL_MS = 5 * 60 * 1000;

function config() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  // Only https (or localhost in development) is accepted as the Supabase address.
  const ok = /^https:\/\/[a-z0-9.-]+$/i.test(url) || /^http:\/\/localhost(:\d+)?$/.test(url);
  return ok && anonKey ? { supabaseUrl: url, anonKey } : null;
}

export function supabaseOrigin(): string | null {
  const c = config();
  return c ? new URL(c.supabaseUrl).origin : null;
}

const read = (f: string) => readFileSync(join(process.cwd(), "tracker", f), "utf8");
let shellHtml: string | null = null;
let builtIn: unknown = null;
let fromDb: { data: unknown; at: number } | null = null;

// The synced plan, read with the public anon key (the row is readable by anyone, see the
// course_plan policy). Cached for a few minutes; any failure falls back to the plan built in.
async function coursePlan(): Promise<unknown> {
  const c = config();
  if (fromDb && Date.now() - fromDb.at < PLAN_TTL_MS) return fromDb.data;
  if (c) {
    try {
      const res = await fetch(`${c.supabaseUrl}/rest/v1/course_plan?id=eq.current&select=data`, {
        headers: { apikey: c.anonKey, authorization: `Bearer ${c.anonKey}` },
        signal: AbortSignal.timeout(4000),
        cache: "no-store",
      });
      if (res.ok) {
        const rows = (await res.json()) as { data: unknown }[];
        if (rows[0]?.data) { fromDb = { data: rows[0].data, at: Date.now() }; return rows[0].data; }
      }
    } catch { /* fall back below */ }
  }
  builtIn ??= JSON.parse(read("data.json"));
  return builtIn;
}

// Same escaping as tools/lib/page.mjs dataJs: ASCII only and no "</script".
function dataJs(data: unknown): string {
  return JSON.stringify(data)
    .replace(/<\/script/gi, "<\\/script")
    .replace(/[\u007f-￿]/g, ch => "\\u" + ch.charCodeAt(0).toString(16).padStart(4, "0"));
}

export async function trackerHtml(): Promise<string> {
  if (!shellHtml || process.env.NODE_ENV !== "production") shellHtml = read("shell.html");
  const cfg = config();
  const data = await coursePlan();
  const head =
    '<!doctype html><html lang="en"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">' +
    "<script>window.TRACKER_CONFIG=" + JSON.stringify(cfg).replace(/</g, "\\u003c") + ";</script>" +
    (cfg ? '<script src="/vendor/supabase.js"></script><script src="/bridge.js"></script>' : "") +
    "</head><body>";
  // A replacer function, so "$" sequences in the data are never read as replacement patterns.
  return head + shellHtml.replace(MARKER, () => "const DATA = " + dataJs(data) + ";") + "</body></html>";
}
