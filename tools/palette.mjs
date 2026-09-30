#!/usr/bin/env node
// Generates the theme colours in src/template.html from a handful of reference hues.
//
//   node tools/palette.mjs          print the light and dark :root blocks
//   node tools/palette.mjs --write  replace the three blocks in src/template.html
//
// Every colour is built in OKLCH (perceptual lightness L 0..1, chroma C, hue H in degrees): the
// hue comes from the reference image, the lightness is fixed per role so text stays legible, and
// the chroma is pushed to the edge of what sRGB can show. That is what makes the tints fluorescent.
// Reference: the 2018 Viacom neon set, sampled 2026-09-30: magenta #f020a0, green #00f030,
// cyan #30a0b0, coral #f06060, cream #f0f0d0, navy #000020, pale grey #ece5ec.

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

// ---- OKLCH <-> sRGB (Bjorn Ottosson's OKLab) ----
const lin = c => c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
const gam = c => c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055;
function oklabToRgb(L, a, b) {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b, m_ = L - 0.1055613458 * a - 0.0638541728 * b, s_ = L - 0.0894841775 * a - 1.2914855480 * b;
  const l = l_ ** 3, m = m_ ** 3, s = s_ ** 3;
  return [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s].map(gam);
}
function rgbToOklch(hex) {
  const [r, g, b] = [1, 3, 5].map(i => lin(parseInt(hex.slice(i, i + 2), 16) / 255));
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b), m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b), s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s, A = 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s, B = 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s;
  return { L, C: Math.hypot(A, B), H: (Math.atan2(B, A) * 180 / Math.PI + 360) % 360 };
}
const inGamut = rgb => rgb.every(v => v >= -1e-4 && v <= 1 + 1e-4);
const toHex = rgb => "#" + rgb.map(v => Math.round(Math.min(1, Math.max(0, v)) * 255).toString(16).padStart(2, "0")).join("");
// The most chroma sRGB can show at this lightness and hue (binary search), or a fixed chroma if asked.
function oklch(L, H, C) {
  const rad = H * Math.PI / 180;
  const at = c => oklabToRgb(L, c * Math.cos(rad), c * Math.sin(rad));
  if (C != null && inGamut(at(C))) return toHex(at(C));
  let lo = 0, hi = 0.4;
  for (let i = 0; i < 40; i++) { const mid = (lo + hi) / 2; if (inGamut(at(mid))) lo = mid; else hi = mid; }
  return toHex(at(C != null ? Math.min(C, lo) : lo));
}

// WCAG contrast ratio between two hex colours.
function contrast(h1, h2) {
  const lum = h => { const [r, g, b] = [1, 3, 5].map(i => lin(parseInt(h.slice(i, i + 2), 16) / 255)); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
  const a = lum(h1), b = lum(h2); return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}
// The most vivid colour of a hue inside a lightness band: sRGB shows the most chroma at a different
// lightness per hue (magenta near L .65, green near .87), so the band is scanned for the peak.
// `floors` are backgrounds the colour must reach 4.5:1 against (WCAG AA for normal text); among the
// lightnesses that pass, the one with the most chroma wins. If none passes, the closest is taken and
// reported, so a failing colour never slips out silently.
function vivid([lo, hi], H, floors = [], ratio = 4.5) {
  const rad = H * Math.PI / 180;
  let best = null, fallback = null;
  for (let L = lo; L <= hi + 1e-9; L += 0.01) {
    let a = 0, b = 0.4;
    for (let i = 0; i < 30; i++) { const mid = (a + b) / 2; if (inGamut(oklabToRgb(L, mid * Math.cos(rad), mid * Math.sin(rad)))) a = mid; else b = mid; }
    const hex = oklch(L, H, a), worst = Math.min(Infinity, ...floors.map(f => contrast(hex, f)));
    if (worst >= ratio) { if (!best || a > best.C) best = { L, C: a, hex }; }
    else if (!fallback || worst > fallback.worst) fallback = { L, C: a, hex, worst };
  }
  if (best) return best.hex;
  console.error(`no lightness in ${lo}..${hi} at hue ${H.toFixed(0)} reaches ${ratio}:1 against ${floors.join(", ")}; using ${fallback.hex} (${fallback.worst.toFixed(2)}:1)`);
  return fallback.hex;
}

// ---- reference hues ----
const H = {
  magenta: rgbToOklch("#f020a0").H, green: rgbToOklch("#00f030").H, cyan: rgbToOklch("#30a0b0").H,
  coral: rgbToOklch("#f06060").H, cream: rgbToOklch("#f0f0d0").H, navy: rgbToOklch("#000020").H, grey: rgbToOklch("#ece5ec").H
};
H.orange = (H.coral + 30) % 360;                 // between coral and yellow, for a fifth course colour
H.violet = 300;

// ---- roles ----
// Courses: 1 magenta, 2 green, 3 cyan, 4 orange, 5 violet. Alert coral, ok green, now cyan.
const courses = [H.magenta, H.green, H.cyan, H.orange, H.violet];
function theme(dark) {
  const text = dark ? [0.60, 0.88] : [0.40, 0.62];   // accent as text or a stroke: legible on the backgrounds, then as vivid as it gets
  const soft = dark ? [0.28, 0.36] : [0.92, 0.96];   // accent as a faint background under ordinary text
  const tint = dark ? [0.60, 0.88] : [0.70, 0.86];   // accent as a solid block behind dark label text (chips, MUST, tags)
  const v = {};
  if (dark) {
    // deep black with a trace of navy; the neon has to sit on near-black to glow
    v.bg = oklch(0.08, H.navy, 0.012); v.surface = oklch(0.13, H.navy, 0.014); v["surface-2"] = oklch(0.17, H.navy, 0.016);
    v.ink = oklch(0.96, H.cream, 0.04); v.muted = oklch(0.70, H.navy, 0.025); v.line = oklch(0.27, H.navy, 0.02);
  } else {
    v.bg = oklch(0.93, H.grey, 0.012); v.surface = "#ffffff"; v["surface-2"] = oklch(0.97, H.grey, 0.008);
    v.ink = oklch(0.20, H.navy, 0.07); v.muted = oklch(0.50, H.navy, 0.04); v.line = oklch(0.87, H.grey, 0.015);
  }
  // text accents must read on every surface they appear on; "on-now" text must read on "now"
  const floors = dark ? [v.bg, v.surface, v["surface-2"]] : [v.surface, v.bg, v["surface-2"]];
  v["on-tint"] = dark ? v.bg : v.ink;
  courses.forEach((h, i) => { v["c" + (i + 1)] = vivid(text, h, floors); v["c" + (i + 1) + "-soft"] = vivid(soft, h); v["c" + (i + 1) + "-tint"] = vivid(tint, h, [v["on-tint"]]); });
  v.alert = vivid(text, H.coral, floors); v["alert-soft"] = vivid(soft, H.coral); v["alert-tint"] = vivid(tint, H.coral, [v["on-tint"]]);
  v.ok = vivid(text, H.green, floors); v.now = vivid(text, H.cyan, floors); v["now-soft"] = vivid(soft, H.cyan); v["now-tint"] = vivid(tint, H.cyan, [v["on-tint"]]);
  v["on-now"] = dark ? v.bg : "#ffffff";
  // the teacher's announcement box: a fully saturated cyan block with dark text on it, like the reference
  v.ann = vivid([0.80, 0.88], H.cyan); v["on-ann"] = dark ? v.bg : v.ink;
  v.shadow = dark ? "0 1px 2px rgba(0,0,0,.4)" : "0 1px 2px rgba(0,0,32,.08)";
  return v;
}
function block(v, indent) {
  const line = pairs => indent + pairs.map(([k, val]) => `--${k}:${val};`).join(" ");
  return [
    line([["bg", v.bg], ["surface", v.surface], ["surface-2", v["surface-2"]]]),
    line([["ink", v.ink], ["muted", v.muted], ["line", v.line]]),
    ...[1, 2, 3, 4, 5].map(i => line([["c" + i, v["c" + i]], ["c" + i + "-soft", v["c" + i + "-soft"]], ["c" + i + "-tint", v["c" + i + "-tint"]]])),
    line([["alert", v.alert], ["alert-soft", v["alert-soft"]], ["alert-tint", v["alert-tint"]]]),
    line([["ok", v.ok], ["now", v.now], ["now-soft", v["now-soft"]], ["now-tint", v["now-tint"]], ["on-now", v["on-now"]]]),
    line([["ann", v.ann], ["on-ann", v["on-ann"]], ["on-tint", v["on-tint"]]]),
    line([["shadow", v.shadow]])
  ].join("\n");
}
const light = theme(false), dark = theme(true);
const out = {
  light: block(light, "  "),
  darkAuto: block(dark, "    ") + "\n    color-scheme:dark;",
  darkSet: "  color-scheme:dark;\n" + block(dark, "  ")
};
if (!process.argv.includes("--write")) {
  console.log(":root{\n" + out.light + "\n}\n@media (prefers-color-scheme:dark){\n  :root:not([data-theme=\"light\"]){\n" + out.darkAuto + "\n  }\n}\n:root[data-theme=\"dark\"]{\n" + out.darkSet + "\n}");
  console.log("\nhues:", Object.entries(H).map(([k, h]) => k + " " + h.toFixed(0)).join(", "));
} else {
  const file = fileURLToPath(new URL("../src/template.html", import.meta.url));
  let s = readFileSync(file, "utf8");
  const swap = (re, body) => { if (!re.test(s)) { console.error("block not found: " + re); process.exit(1); } s = s.replace(re, body); };
  swap(/(:root\{\n)[\s\S]*?(\n\})/, `$1${out.light}$2`);
  swap(/(:root:not\(\[data-theme="light"\]\)\{\n)[\s\S]*?(\n  \})/, `$1${out.darkAuto}$2`);
  swap(/(:root\[data-theme="dark"\]\{\n)[\s\S]*?(\n\})/, `$1${out.darkSet}$2`);
  writeFileSync(file, s);
  console.log("Wrote the three theme blocks into src/template.html");
}
