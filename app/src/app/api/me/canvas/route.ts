import { readFileSync } from "node:fs";
import { join } from "node:path";
import { CanvasTokenError, readStudent, validToken } from "@/lib/canvas-relay";
import { json, rateLimited, sameOrigin } from "@/lib/guard";
import { userId } from "@/lib/session";

export const dynamic = "force-dynamic";

// POST, with the Student's Canvas token in the x-canvas-token header and { courses: [ids] } in
// the body. Answers with their completion, submissions and Groups for those courses only.
export async function POST(req: Request) {
  if (!sameOrigin(req)) return json({ error: "origin" }, 403);
  if (rateLimited(req, "canvas", 12)) return json({ error: "slow down" }, 429);
  const token = req.headers.get("x-canvas-token");
  if (!validToken(token)) return json({ error: "token" }, 400);
  let ids: number[];
  try {
    const body = (await req.json()) as { courses?: unknown };
    ids = Array.isArray(body.courses) ? body.courses.filter((x): x is number => Number.isInteger(x) && x > 0 && x < 1e7).slice(0, 8) : [];
  } catch { return json({ error: "body" }, 400); }
  if (!ids.length) return json({ error: "courses" }, 400);
  try {
    const data = await readStudent(token, ids);
    // Signed in too: keep the Groups Canvas just named, as verified (release 4, Answer Cards).
    // Written with the sync role; a Student can never set their own Group here.
    const uid = await userId(req);
    if (uid) await recordGroups(uid, data.groups, ids).catch(() => {});
    return json(data);
  } catch (e) {
    if (e instanceof CanvasTokenError) return json({ error: "token" }, 401);
    return json({ error: "canvas" }, 502);
  }
}

// The tracker's course codes by Canvas id, from the plan built into the image.
let codes: Record<number, string> | null = null;
function codeOf(canvasId: number): string | undefined {
  if (!codes) {
    const plan = (JSON.parse(readFileSync(join(process.cwd(), "tracker", "data.json"), "utf8")) as { plan: { COURSES: Record<string, { canvasId?: number }> } }).plan;
    codes = Object.fromEntries(Object.entries(plan.COURSES).filter(([, c]) => c.canvasId).map(([k, c]) => [c.canvasId!, k]));
  }
  return codes[canvasId];
}
async function recordGroups(uid: string, groups: { courseId: number; number: number | null }[], ids: number[]) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, jwt = process.env.SYNC_JWT;
  if (!url || !anon || !jwt) return;
  const out: Record<string, number> = {};
  for (const g of groups) { const code = codeOf(g.courseId); if (code && g.number && ids.includes(g.courseId)) out[code] = g.number; }
  if (!Object.keys(out).length) return;
  await fetch(`${url}/rest/v1/rpc/record_groups`, {
    method: "POST", headers: { apikey: anon, authorization: `Bearer ${jwt}`, "content-type": "application/json" },
    body: JSON.stringify({ student: uid, groups: out }), signal: AbortSignal.timeout(5000),
  });
}
