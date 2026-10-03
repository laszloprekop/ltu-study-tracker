// Reads a lab signup sheet (a link-shared Google Doc) from its plain-text export: per section the
// session day, and per 15-minute slot its time and the number of the Group that claimed it.
// Names are never kept: a claimed cell keeps only its Group number.

export type Slot = { time: string; group: number | null };
export type Section = { section: string; date: string; headingTime: string | null; slots: Slot[] };

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const HEADING = /^\s*(?:\d+\.\s*)?(lab\s*\d+)\s*[-:]\s*([a-z]{3,9})\.?\s+(\d{1,2})(?:st|nd|rd|th)?\s*(?:[-:,]\s*(\d{1,2})[:.](\d{2})\s*(am|pm)?)?/i;
const SLOT = /\((\d{1,2})[:.](\d{2})\)\s*$/;
const GROUP = /^\s*(?:lab\s*)?(?:grupp|group|g)\s*(?:#|nr\.?|no\.?)?\s*(\d{1,3})\b/i;

const two = (n: number) => String(n).padStart(2, "0");

// The sheet gives no year: the one that puts the date closest to today.
function dated(month: number, day: number, today: Date): string {
  const y = today.getFullYear();
  const best = [y - 1, y, y + 1].map(yy => new Date(Date.UTC(yy, month, day)))
    .sort((a, b) => Math.abs(a.getTime() - today.getTime()) - Math.abs(b.getTime() - today.getTime()))[0];
  return `${best.getUTCFullYear()}-${two(best.getUTCMonth() + 1)}-${two(best.getUTCDate())}`;
}

export function parseSheet(text: string, today = new Date()): Section[] {
  const out: Section[] = [];
  let cur: Section | null = null, open: Slot | null = null;
  for (const raw of text.replace(/^﻿/, "").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const h = HEADING.exec(line);
    if (h && !SLOT.test(line)) {
      const month = MONTHS.indexOf(h[2].slice(0, 3).toLowerCase());
      if (month >= 0) {
        let hh = h[4] ? Number(h[4]) : null;
        if (hh !== null && h[6]?.toLowerCase() === "pm" && hh < 12) hh += 12;
        cur = { section: h[1].replace(/\s+/g, "").replace(/^lab/i, "Lab"), date: dated(month, Number(h[3]), today), headingTime: hh === null ? null : `${two(hh)}:${h[5]}`, slots: [] };
        out.push(cur); open = null; continue;
      }
    }
    if (!cur) continue;
    const s = SLOT.exec(line);
    if (s) { open = { time: `${two(Number(s[1]))}:${s[2]}`, group: null }; cur.slots.push(open); continue; }
    if (open && open.group === null) { const g = GROUP.exec(line); if (g) open.group = Number(g[1]); }
  }
  return out;
}

const cache = new Map<string, { at: number; sections: Section[] }>();

export async function readSheet(docId: string, maxAgeMs = 5 * 60 * 1000): Promise<Section[]> {
  if (!/^[A-Za-z0-9_-]{20,}$/.test(docId)) throw new Error("bad sheet id");
  const hit = cache.get(docId);
  if (hit && Date.now() - hit.at < maxAgeMs) return hit.sections;
  const res = await fetch(`https://docs.google.com/document/d/${docId}/export?format=txt`, { redirect: "follow", signal: AbortSignal.timeout(10_000), cache: "no-store" });
  if (!res.ok) throw new Error("sheet " + res.status);
  const text = await res.text();
  if (text.length > 1_000_000) throw new Error("sheet too large");
  const sections = parseSheet(text);
  cache.set(docId, { at: Date.now(), sections });
  return sections;
}
