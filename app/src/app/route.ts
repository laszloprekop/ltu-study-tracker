import { supabaseOrigin, trackerHtml } from "@/lib/tracker-page";

export const dynamic = "force-dynamic";

export function GET() {
  const sb = supabaseOrigin();
  // The page keeps its scripts and styles inline (it is also a single-file artifact), so scripts
  // need 'unsafe-inline'. Everything else is narrowed: data only to Supabase, no framing, no plugins.
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https:",
    "connect-src 'self'" + (sb ? " " + sb : ""),
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ].join("; ");
  return new Response(trackerHtml(), {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "content-security-policy": csp,
      "x-content-type-options": "nosniff",
      "referrer-policy": "strict-origin-when-cross-origin",
      "permissions-policy": "camera=(), microphone=(), geolocation=()",
    },
  });
}
