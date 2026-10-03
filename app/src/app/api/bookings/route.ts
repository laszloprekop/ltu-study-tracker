import { readFileSync } from "node:fs";
import { join } from "node:path";
import { json, rateLimited, sameOrigin } from "@/lib/guard";
import { userId } from "@/lib/session";
import { readSheet } from "@/lib/signup-sheet";

export const dynamic = "force-dynamic";

type Booking = { id: string; course: string; for: string; sheet: string; section: string; task: string };
let defs: Booking[] | null = null;
function bookings(): Booking[] {
  defs ??= ((JSON.parse(readFileSync(join(process.cwd(), "tracker", "data.json"), "utf8")) as { plan: { BOOKINGS?: Booking[] } }).plan.BOOKINGS) ?? [];
  return defs;
}

// GET /api/bookings?groups=Z0025E:8  (signed-in only). Per Booking: the session day, its slot
// times, how many are free, and which slot (if any) the named Group holds. Never any names, and
// never which other Group holds which slot.
export async function GET(req: Request) {
  if (!sameOrigin(req)) return json({ error: "origin" }, 403);
  if (rateLimited(req, "bookings", 30)) return json({ error: "slow down" }, 429);
  if (!(await userId(req))) return json({ error: "sign in" }, 401);
  const groups: Record<string, number> = {};
  for (const pair of (new URL(req.url).searchParams.get("groups") ?? "").split(",")) {
    const m = /^([A-Z]\d{4}E):(\d{1,2})$/.exec(pair.trim());
    if (m) groups[m[1]] = Number(m[2]);
  }
  const out = [];
  for (const b of bookings()) {
    let sections;
    try { sections = await readSheet(b.sheet); } catch { out.push({ id: b.id, task: b.task, for: b.for, error: "sheet" }); continue; }
    const s = sections.find(x => x.section.toLowerCase() === b.section.toLowerCase());
    if (!s) { out.push({ id: b.id, task: b.task, for: b.for, error: "section" }); continue; }
    const g = groups[b.course];
    const mine = g ? s.slots.find(x => x.group === g)?.time ?? null : null;
    out.push({
      id: b.id, task: b.task, for: b.for, date: s.date, headingTime: s.headingTime,
      times: s.slots.map(x => x.time), free: s.slots.filter(x => x.group === null).length,
      group: g ?? null, mine,
    });
  }
  return json({ bookings: out, readAt: new Date().toISOString() });
}
