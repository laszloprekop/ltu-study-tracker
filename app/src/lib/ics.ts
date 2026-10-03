// A small iCal (RFC 5545) reader for Calendar Links: VEVENTs with their start and end in Stockholm
// time, summary, location and the first Canvas link in the description. Handles UTC, TZID and
// all-day dates, and the common recurrences (DAILY and WEEKLY with INTERVAL, COUNT, UNTIL, BYDAY;
// EXDATE). Anything it cannot read is left out rather than guessed.

export type CalEvent = { uid: string; date: string; start: string | null; end: string | null; title: string; location: string; canvas: string | null };

const TZ = "Europe/Stockholm";
const two = (n: number) => String(n).padStart(2, "0");

function unfold(text: string): string[] { return text.replace(/\r\n?/g, "\n").replace(/\n[ \t]/g, "").split("\n"); }
function unescape(v: string): string { return v.replace(/\\n/gi, " ").replace(/\\([,;\\])/g, "$1").trim(); }

// A wall-clock time in a zone, as a UTC instant.
function zoned(y: number, mo: number, d: number, h: number, mi: number, tz: string): Date {
  const guess = Date.UTC(y, mo - 1, d, h, mi);
  const parts = (at: number) => Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).formatToParts(new Date(at)).map(p => [p.type, p.value]));
  const p = parts(guess), asUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute);
  return new Date(guess - (asUtc - guess));
}

type When = { at: Date; allDay: boolean };
function parseWhen(params: string, value: string): When | null {
  const m = /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?(Z)?)?$/.exec(value.trim());
  if (!m) return null;
  const [y, mo, d] = [+m[1], +m[2], +m[3]];
  if (!m[4] || /VALUE=DATE(?!-)/i.test(params) && !m[4]) return { at: new Date(Date.UTC(y, mo - 1, d, 12)), allDay: true };
  const h = +m[4], mi = +m[5];
  if (m[7]) return { at: new Date(Date.UTC(y, mo - 1, d, h, mi)), allDay: false };
  let tz = /TZID=([^;:]+)/i.exec(params)?.[1]?.replace(/^"|"$/g, "") ?? TZ;
  try { new Intl.DateTimeFormat("en", { timeZone: tz }); } catch { tz = TZ; }
  return { at: zoned(y, mo, d, h, mi, tz), allDay: false };
}

function local(at: Date) {
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone: TZ, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).formatToParts(at).map(x => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, time: `${p.hour}:${p.minute}` };
}

const DAYS = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];

export function parseIcs(text: string, from: Date, to: Date, max = 500): CalEvent[] {
  const out: CalEvent[] = [];
  let ev: Record<string, { params: string; value: string }[]> | null = null;
  for (const line of unfold(text)) {
    if (/^BEGIN:VEVENT/i.test(line)) { ev = {}; continue; }
    if (/^END:VEVENT/i.test(line)) { if (ev) expand(ev); ev = null; if (out.length >= max) break; continue; }
    if (!ev) continue;
    const m = /^([A-Z-]+)((?:;[^:]*)?):(.*)$/i.exec(line);
    if (m) (ev[m[1].toUpperCase()] ??= []).push({ params: m[2], value: m[3] });
  }
  function expand(e: Record<string, { params: string; value: string }[]>) {
    const s = e.DTSTART?.[0] && parseWhen(e.DTSTART[0].params, e.DTSTART[0].value);
    if (!s || /^CANCELLED$/i.test(e.STATUS?.[0]?.value ?? "")) return;
    const en = e.DTEND?.[0] && parseWhen(e.DTEND[0].params, e.DTEND[0].value);
    const dur = en ? en.at.getTime() - s.at.getTime() : 0;
    const title = unescape(e.SUMMARY?.[0]?.value ?? "(no title)").slice(0, 200);
    const location = unescape(e.LOCATION?.[0]?.value ?? "").slice(0, 200);
    const desc = unescape(e.DESCRIPTION?.[0]?.value ?? "") + " " + (e.LOCATION?.[0]?.value ?? "") + " " + (e.URL?.[0]?.value ?? "");
    const canvas = /https:\/\/ltuedu\.instructure\.com\/courses\/\d+\/(?:assignments|modules\/items|pages|quizzes)\/[\w-]+/.exec(desc)?.[0] ?? null;
    const uid = (e.UID?.[0]?.value ?? title).slice(0, 200);
    const ex = new Set((e.EXDATE ?? []).flatMap(x => x.value.split(",").map(v => parseWhen(x.params, v)?.at.getTime())).filter(Boolean));
    const push = (at: Date) => {
      if (at.getTime() + Math.max(dur, 0) < from.getTime() || at > to || ex.has(at.getTime())) return;
      const a = local(at), b = dur > 0 ? local(new Date(at.getTime() + dur)) : null;
      out.push({ uid, date: a.date, start: s.allDay ? null : a.time, end: s.allDay || !b ? null : b.time, title, location, canvas });
    };
    const rule = e.RRULE?.[0]?.value;
    if (!rule) { push(s.at); return; }
    const r = Object.fromEntries(rule.split(";").map(kv => kv.split("=")));
    if (r.FREQ !== "DAILY" && r.FREQ !== "WEEKLY") { push(s.at); return; }
    const step = Math.max(1, +(r.INTERVAL ?? 1)), count = r.COUNT ? +r.COUNT : Infinity;
    const until = r.UNTIL ? parseWhen("", r.UNTIL)?.at ?? to : to;
    const byday = r.FREQ === "WEEKLY" && r.BYDAY ? r.BYDAY.split(",").map((d: string) => DAYS.indexOf(d.slice(-2))) : null;
    let n = 0;
    for (let i = 0; n < count && i < 800; i++) {
      const base = new Date(s.at.getTime() + i * 86400000);
      const days = Math.round((base.getTime() - s.at.getTime()) / 86400000);
      const inStep = r.FREQ === "DAILY" ? days % step === 0 : Math.floor(days / 7) % step === 0;
      const dayOk = byday ? byday.includes(new Date(base.getTime()).getUTCDay()) : (r.FREQ === "DAILY" || days % 7 === 0);
      if (!inStep || !dayOk) continue;
      if (base > until || base > to) break;
      n++; push(base);
    }
  }
  return out.sort((a, b) => (a.date + (a.start ?? "")).localeCompare(b.date + (b.start ?? "")));
}
