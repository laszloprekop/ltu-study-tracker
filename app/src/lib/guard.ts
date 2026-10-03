// Checks shared by the app's API routes: same-origin requests only, and a simple per-address
// rate limit kept in memory (one container, so in-memory is enough).

const hits = new Map<string, number[]>();

export function clientAddress(req: Request): string {
  return (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "local";
}

export function sameOrigin(req: Request): boolean {
  const site = req.headers.get("sec-fetch-site");
  if (site) return site === "same-origin";
  const origin = req.headers.get("origin"), host = req.headers.get("host");
  return !!origin && !!host && new URL(origin).host === host;
}

export function rateLimited(req: Request, key: string, max: number, windowMs = 60_000): boolean {
  const id = key + ":" + clientAddress(req), now = Date.now();
  const recent = (hits.get(id) ?? []).filter(t => now - t < windowMs);
  recent.push(now);
  hits.set(id, recent);
  if (hits.size > 5000) for (const [k, v] of hits) if (now - v[v.length - 1] > windowMs) hits.delete(k);
  return recent.length > max;
}

export function json(body: unknown, status = 200): Response {
  return Response.json(body, { status, headers: { "cache-control": "no-store" } });
}
