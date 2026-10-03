// Reads a Student's own Canvas data with the token they send, for that one request (ADR 0001).
// The token is never stored, logged or returned. GET only, to the paths in ALLOWED.

const BASE = "https://ltuedu.instructure.com/api/v1";
const ALLOWED = [
  /^\/courses\/\d+\/modules$/,
  /^\/courses\/\d+\/students\/submissions$/,
  /^\/users\/self\/groups$/,
  /^\/users\/self$/,
];

export class CanvasTokenError extends Error {}

export function validToken(t: string | null): t is string {
  return !!t && t.length <= 200 && /^\d+~[A-Za-z0-9]{20,}$/.test(t);
}

async function getAll(path: string, token: string): Promise<unknown[]> {
  if (!ALLOWED.some(re => re.test(path.split("?")[0]))) throw new Error("path not allowed");
  let url: string | null = BASE + path + (path.includes("?") ? "&" : "?") + "per_page=100";
  const out: unknown[] = [];
  for (let page = 0; url && page < 20; page++) {
    if (!url.startsWith(BASE + "/")) throw new Error("unexpected next page");
    const res: Response = await fetch(url, { headers: { authorization: "Bearer " + token }, signal: AbortSignal.timeout(15_000), cache: "no-store" });
    if (res.status === 401) throw new CanvasTokenError("token");
    if (!res.ok) throw new Error("canvas " + res.status);
    const body = await res.json();
    out.push(...(Array.isArray(body) ? body : [body]));
    const next = (res.headers.get("link") ?? "").split(",").find(p => p.includes('rel="next"'));
    url = next ? next.slice(next.indexOf("<") + 1, next.indexOf(">")) : null;
  }
  return out;
}

type Item = { id: number; completion_requirement?: { type: string; completed?: boolean } };
type Module = { items?: Item[] };
type Submission = { assignment_id: number; workflow_state?: string; submitted_at?: string | null; late?: boolean; missing?: boolean; excused?: boolean };
type Group = { course_id?: number; name?: string };

export type Completion = {
  // module item id -> its requirement and whether Canvas counts it as met
  items: Record<string, { type: string; completed: boolean }>;
  // assignment id -> what Canvas has of the Student's hand-in (no scores, no grades)
  submissions: Record<string, { submitted: boolean; late: boolean; missing: boolean; excused: boolean }>;
};

export async function readStudent(token: string, courseIds: number[]) {
  const me = (await getAll("/users/self", token))[0] as { id?: number } | undefined;
  if (!me?.id) throw new CanvasTokenError("token");
  const courses: Record<string, Completion> = {};
  for (const id of courseIds) {
    const modules = (await getAll(`/courses/${id}/modules?include[]=items`, token)) as Module[];
    const subs = (await getAll(`/courses/${id}/students/submissions?student_ids[]=self`, token)) as Submission[];
    const items: Completion["items"] = {};
    for (const m of modules) for (const it of m.items ?? []) if (it.completion_requirement) items[it.id] = { type: it.completion_requirement.type, completed: !!it.completion_requirement.completed };
    const submissions: Completion["submissions"] = {};
    for (const s of subs) {
      const submitted = !!s.submitted_at || ["submitted", "graded", "pending_review"].includes(s.workflow_state ?? "");
      submissions[s.assignment_id] = { submitted, late: !!s.late, missing: !!s.missing, excused: !!s.excused };
    }
    courses[id] = { items, submissions };
  }
  const groups = ((await getAll("/users/self/groups", token)) as Group[])
    .filter(g => g.course_id && courseIds.includes(g.course_id))
    .map(g => ({ courseId: g.course_id!, name: g.name ?? "", number: groupNumber(g.name ?? "") }));
  return { courses, groups, readAt: new Date().toISOString() };
}

// "Lab Group 8", "Projektgrupp 8", "Grupp 8", "G8", "#8" -> 8
export function groupNumber(name: string): number | null {
  const m = /(?:grupp|group|\bg|#)\s*(\d{1,3})\b/i.exec(name) ?? /\b(\d{1,3})\b/.exec(name);
  return m ? Number(m[1]) : null;
}
