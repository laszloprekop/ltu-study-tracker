import { createHash } from "node:crypto";
import { fetchCalendar } from "@/lib/calendar-fetch";
import { json, rateLimited, sameOrigin } from "@/lib/guard";
import { parseIcs, type CalEvent } from "@/lib/ics";
import { userId } from "@/lib/session";

export const dynamic = "force-dynamic";

const cache = new Map<string, { at: number; text: string }>();
const TTL = 10 * 60 * 1000;

// GET /api/me/calendar (signed-in only): the events of the coming weeks from the Student's own
// Calendar Links. The links are read with the Student's session, so the row-level rule decides
// whose they are; the response never contains a link, only its label.
export async function GET(req: Request) {
  if (!sameOrigin(req)) return json({ error: "origin" }, 403);
  if (rateLimited(req, "calendar", 20)) return json({ error: "slow down" }, 429);
  if (!(await userId(req))) return json({ error: "sign in" }, 401);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!, anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const res = await fetch(`${url}/rest/v1/calendar_link?select=id,url,label&order=created_at`, {
    headers: { apikey: anon, authorization: req.headers.get("authorization")! }, cache: "no-store", signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) return json({ error: "links" }, 502);
  const links = (await res.json()) as { id: string; url: string; label: string }[];
  const from = new Date(Date.now() - 86400000), to = new Date(Date.now() + 70 * 86400000);
  const out: (CalEvent & { link: string; label: string; assignment: { courseId: number; id: number } | null })[] = [];
  const status: { id: string; label: string; ok: boolean; error?: string; events?: number }[] = [];
  for (const l of links.slice(0, 5)) {
    const key = createHash("sha256").update(l.url).digest("hex");
    try {
      let hit = cache.get(key);
      if (!hit || Date.now() - hit.at > TTL) { hit = { at: Date.now(), text: await fetchCalendar(l.url) }; cache.set(key, hit); }
      const evs = parseIcs(hit.text, from, to, 400);
      for (const e of evs) {
        const a = e.canvas ? /courses\/(\d+)\/assignments\/(\d+)/.exec(e.canvas) : null;
        out.push({ ...e, link: l.id, label: l.label, assignment: a ? { courseId: +a[1], id: +a[2] } : null });
      }
      status.push({ id: l.id, label: l.label, ok: true, events: evs.length });
    } catch (e) {
      const msg = String((e as Error).message || "");
      status.push({ id: l.id, label: l.label, ok: false, error: /not allowed/.test(msg) ? "not a supported calendar address" : /not public/.test(msg) ? "address refused" : "could not be read" });
    }
  }
  if (cache.size > 500) cache.clear();
  out.sort((a, b) => (a.date + (a.start ?? "")).localeCompare(b.date + (b.start ?? "")));
  return json({ events: out, links: status, readAt: new Date().toISOString() });
}
