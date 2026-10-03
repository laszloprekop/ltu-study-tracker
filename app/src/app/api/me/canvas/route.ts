import { CanvasTokenError, readStudent, validToken } from "@/lib/canvas-relay";
import { json, rateLimited, sameOrigin } from "@/lib/guard";

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
    return json(await readStudent(token, ids));
  } catch (e) {
    if (e instanceof CanvasTokenError) return json({ error: "token" }, 401);
    return json({ error: "canvas" }, 502);
  }
}
