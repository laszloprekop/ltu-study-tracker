import { existsSync } from "node:fs";
import { join } from "node:path";

export const dynamic = "force-dynamic";

export function GET() {
  const page = ["shell.html", "data.json"].every(f => existsSync(join(process.cwd(), "tracker", f)));
  return Response.json({ ok: page, page }, { status: page ? 200 : 500 });
}
