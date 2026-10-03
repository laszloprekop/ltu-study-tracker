// Who is asking: checks a Supabase access token with Supabase's own auth service (GoTrue), so a
// forged or expired token is refused. Results are kept for a minute to spare GoTrue.

const seen = new Map<string, { at: number; id: string | null }>();

export async function userId(req: Request): Promise<string | null> {
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!token || token.length > 4000 || !url || !anon) return null;
  const hit = seen.get(token);
  if (hit && Date.now() - hit.at < 60_000) return hit.id;
  let id: string | null = null;
  try {
    const res = await fetch(`${url}/auth/v1/user`, { headers: { apikey: anon, authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(5000), cache: "no-store" });
    if (res.ok) id = ((await res.json()) as { id?: string }).id ?? null;
  } catch { id = null; }
  if (seen.size > 2000) seen.clear();
  seen.set(token, { at: Date.now(), id });
  return id;
}
