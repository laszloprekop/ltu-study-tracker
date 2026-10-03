// Fetches a Calendar Link without letting it reach anything but a calendar provider: https only,
// a fixed list of hosts, every resolved address public (no loopback, private or link-local
// networks, so a link cannot reach the server's own services), no redirects off the list, a size
// and time limit. The link itself is never logged.
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

const HOSTS = [
  /^calendar\.google\.com$/,
  /^outlook\.office365\.com$/, /^outlook\.live\.com$/, /^outlook\.office\.com$/,
  /^p\d+-caldav\.icloud\.com$/, /^[a-z0-9-]+\.icloud\.com$/,
  /^ltuedu\.instructure\.com$/,
  /^cloud\.timeedit\.net$/,
];
const MAX_BYTES = 3_000_000;

export function allowedHost(url: string): boolean {
  try { const u = new URL(url); return u.protocol === "https:" && !u.username && !u.password && (!u.port || u.port === "443") && HOSTS.some(re => re.test(u.hostname)); }
  catch { return false; }
}

function publicAddress(ip: string): boolean {
  if (isIP(ip) === 4) {
    const [a, b] = ip.split(".").map(Number);
    return !(a === 0 || a === 10 || a === 127 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224);
  }
  const v = ip.toLowerCase();
  return !(v === "::" || v === "::1" || v.startsWith("fc") || v.startsWith("fd") || v.startsWith("fe80") || v.startsWith("::ffff:"));
}

export async function fetchCalendar(url: string): Promise<string> {
  let target = url;
  for (let hop = 0; hop < 4; hop++) {
    if (!allowedHost(target)) throw new Error("calendar host not allowed");
    const addrs = await lookup(new URL(target).hostname, { all: true });
    if (!addrs.length || !addrs.every(a => publicAddress(a.address))) throw new Error("calendar host not public");
    const res = await fetch(target, { redirect: "manual", signal: AbortSignal.timeout(8000), cache: "no-store", headers: { accept: "text/calendar, text/plain;q=0.5" } });
    if (res.status >= 300 && res.status < 400) { const loc = res.headers.get("location"); if (!loc) throw new Error("calendar redirect"); target = new URL(loc, target).toString(); continue; }
    if (!res.ok) throw new Error("calendar " + res.status);
    const reader = res.body?.getReader(); if (!reader) return "";
    const chunks: Uint8Array[] = []; let size = 0;
    for (;;) { const { done, value } = await reader.read(); if (done) break; size += value.length; if (size > MAX_BYTES) { await reader.cancel(); throw new Error("calendar too large"); } chunks.push(value); }
    return new TextDecoder().decode(Buffer.concat(chunks));
  }
  throw new Error("calendar redirects");
}
