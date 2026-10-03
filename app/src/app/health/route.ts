import { existsSync } from "node:fs";
import { join } from "node:path";

export const dynamic = "force-dynamic";

export function GET() {
  const page = existsSync(join(process.cwd(), "tracker", "index.html"));
  return Response.json({ ok: page, page }, { status: page ? 200 : 500 });
}
