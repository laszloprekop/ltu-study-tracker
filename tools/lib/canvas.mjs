// Shared Canvas API client for the tools. Read-only.
import { readFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

export const BASE = "https://ltuedu.instructure.com";
export const TZ = "Europe/Stockholm";
const ENV_FILE = fileURLToPath(new URL("../../.env", import.meta.url));

// The token comes from, in order: $CANVAS_TOKEN, a CANVAS_TOKEN= line in .env (git-ignored),
// or the macOS Keychain item "ltu-canvas-token". It is never printed.
export function token() {
  if (process.env.CANVAS_TOKEN) return process.env.CANVAS_TOKEN.trim();
  if (existsSync(ENV_FILE)) {
    const m = /^\s*CANVAS_TOKEN\s*=\s*["']?([^"'\r\n]+?)["']?\s*$/m.exec(readFileSync(ENV_FILE, "utf8"));
    if (m) return m[1];
  }
  try {
    return execFileSync("security", ["find-generic-password", "-s", "ltu-canvas-token", "-w"],
      { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    console.error("No Canvas token. Put CANVAS_TOKEN=... in .env, set CANVAS_TOKEN,\n" +
      "or store it in the Keychain with:\n  security add-generic-password -a \"$USER\" -s ltu-canvas-token -w");
    process.exit(2);
  }
}

const headers = () => ({ Authorization: "Bearer " + token() });

// GET one object.
export async function get(path) {
  const res = await fetch(BASE + "/api/v1" + path, { headers: headers() });
  if (res.status === 401) throw new Error("Canvas refused the token (401). It may be expired or mistyped.");
  if (!res.ok) throw new Error(`Canvas ${res.status} for ${path}`);
  return res.json();
}

// GET every page of a list endpoint, following the Link header.
export async function getAll(path) {
  let url = BASE + "/api/v1" + path + (path.includes("?") ? "&" : "?") + "per_page=100";
  const out = [];
  while (url) {
    const res = await fetch(url, { headers: headers() });
    if (res.status === 401) throw new Error("Canvas refused the token (401). It may be expired or mistyped.");
    if (!res.ok) throw new Error(`Canvas ${res.status} for ${path}`);
    out.push(...await res.json());
    const next = (res.headers.get("link") || "").split(",").find(p => p.includes('rel="next"'));
    url = next ? next.slice(next.indexOf("<") + 1, next.indexOf(">")) : null;
  }
  return out;
}

// Date and time of a Canvas timestamp in Stockholm, as {date: "2026-09-28", time: "17:00"}.
export function local(iso) {
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23"
  }).formatToParts(new Date(iso)).map(x => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, time: `${p.hour}:${p.minute}` };
}

// Plain text of a Canvas HTML body.
export function strip(html) {
  return String(html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, " ").trim();
}
