import { readFileSync } from "node:fs";
import { join } from "node:path";

// The tracker page is the same file the claude.ai artifact publishes. It reaches storage only
// through window.claude.use("db") and use("user"); public/bridge.js provides both on top of
// Supabase, so the page itself needs no change to run here.

let cached: string | null = null;

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

export function trackerHtml(): string {
  if (cached && process.env.NODE_ENV === "production") return cached;
  const body = readFileSync(join(process.cwd(), "tracker", "index.html"), "utf8");
  const cfg = config();
  // JSON.stringify plus "<" escaping keeps the values from closing the script tag.
  const cfgJs = JSON.stringify(cfg).replace(/</g, "\\u003c");
  const head =
    '<!doctype html><html lang="en"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">' +
    "<script>window.TRACKER_CONFIG=" + cfgJs + ";</script>" +
    (cfg ? '<script src="/vendor/supabase.js"></script><script src="/bridge.js"></script>' : "") +
    "</head><body>";
  cached = head + body + "</body></html>";
  return cached;
}
