#!/usr/bin/env node
// Generates the theme colours in src/template.html: two palettes, each in light and dark.
//
//   node tools/palette.mjs          print the palette CSS
//   node tools/palette.mjs --check  print the contrast of the main pairs
//   node tools/palette.mjs --write  replace the block between the palette markers in src/template.html
//
// Every colour is built in OKLCH (perceptual lightness L 0..1, chroma C, hue H in degrees), the
// lightness fixed per role so text stays legible. Mix colours in OKLCH too (color-mix(in oklch, ...)).
//
// Roles follow Material Design 3: each accent role X (c1 to c5, alert, now) is four tokens.
//   --X              the accent itself: text, strokes and bars on the surfaces
//   --on-X           text on a solid --X fill
//   --X-container    a quieter fill for chips, tags and selected controls
//   --on-X-container text on --X-container
// plus --X-soft, a faint wash behind ordinary text (a highlighted row). Announcements are a container
// pair only (--ann-container, --on-ann-container); --ok is an accent only. The neutrals keep their
// short names: --bg, --surface, --surface-2, --ink (on-surface), --muted (on-surface-variant), --line.
//
// Ice (the default): calm, low chroma, a frosted Nordic mood. Chroma is capped per role and the
// lightness is the calmest one that still reaches WCAG AA (4.5:1) on every background.
// Navy (data-palette="navy"): linen, navy and gold from a mood board; low chroma, gold kept for
// highlights, and a shadow (not a glow) in dark mode because its dark ground is navy, not near black.
// Neon (data-palette="neon"): chroma pushed to the edge of what sRGB can show, so the tints are
// fluorescent. Reference: the 2018 Viacom neon set, sampled 2026-09-30: magenta #f020a0, green
// #00f030, cyan #30a0b0, coral #f06060, cream #f0f0d0, navy #000020, pale grey #ece5ec.

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

// The calmest colour of a hue at a fixed chroma: in light mode the lightest lightness that still
// reaches `ratio` against every floor, in dark mode the darkest. Reported if none passes.
function calm([lo, hi], H, C, floors, dark, ratio = 4.5) {
  const Ls = []; for (let L = lo; L <= hi + 1e-9; L += 0.005) Ls.push(L);
  if (!dark) Ls.reverse();
  for (const L of Ls) { const hex = oklch(L, H, C); if (Math.min(...floors.map(f => contrast(hex, f))) >= ratio) return hex; }
  console.error(`no lightness in ${lo}..${hi} at hue ${H} chroma ${C} reaches ${ratio}:1`);
  return oklch(dark ? hi : lo, H, C);
}

// ---- Neon ----
const H = {
  magenta: rgbToOklch("#f020a0").H, green: rgbToOklch("#00f030").H, cyan: rgbToOklch("#30a0b0").H,
  coral: rgbToOklch("#f06060").H, cream: rgbToOklch("#f0f0d0").H, navy: rgbToOklch("#000020").H, grey: rgbToOklch("#ece5ec").H
};
H.orange = (H.coral + 30) % 360;                 // between coral and yellow, for a fifth course colour
H.violet = 300;
// Courses: 1 magenta, 2 green, 3 cyan, 4 orange, 5 violet. Alert coral, ok green, now cyan.
const neonCourses = [H.magenta, H.green, H.cyan, H.orange, H.violet];
function neon(dark) {
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
  // Neon containers are the fluorescent tints with dark text on them; the solid accent takes white (light) or black (dark)
  const onTint = dark ? v.bg : v.ink, onSolid = dark ? v.bg : "#ffffff";
  const role = (k, h) => { v[k] = vivid(text, h, floors); v["on-" + k] = onSolid; v[k + "-container"] = vivid(tint, h, [onTint]); v["on-" + k + "-container"] = onTint; v[k + "-soft"] = vivid(soft, h); };
  neonCourses.forEach((h, i) => role("c" + (i + 1), h));
  role("alert", H.coral); role("now", H.cyan);
  v.ok = vivid(text, H.green, floors);
  // the teacher's announcement box: a fully saturated cyan block with dark text on it, like the reference
  v["ann-container"] = vivid([0.80, 0.88], H.cyan); v["on-ann-container"] = onTint;
  v.shadow = dark ? "0 1px 2px rgba(0,0,0,.4)" : "0 1px 2px rgba(0,0,32,.08)";
  // The lift, three levels (boxes, flip cards, popups): a navy shadow in light mode; in dark mode a
  // shadow disappears, so a cyan glow. Which element takes which level: "Lift" in src/template.html.
  v["box-lift"] = dark ? "drop-shadow(0 0 1px rgba(0,228,253,.22)) drop-shadow(0 0 8px rgba(0,228,253,.07))" : "drop-shadow(0 1px 2px rgba(0,0,32,.08)) drop-shadow(0 4px 10px rgba(10,20,50,.05))";
  v["card-lift"] = dark ? "drop-shadow(0 0 10px rgba(0,228,253,.16)) drop-shadow(0 6px 14px rgba(0,228,253,.10))" : "drop-shadow(0 8px 12px rgba(10,20,50,.13)) drop-shadow(0 1px 2px rgba(10,20,50,.10))";
  v["pop-lift"] = dark ? "drop-shadow(0 0 14px rgba(0,228,253,.24)) drop-shadow(0 8px 24px rgba(0,228,253,.14)) drop-shadow(0 0 1px rgba(0,228,253,.6))" : "drop-shadow(0 10px 24px rgba(10,20,50,.22)) drop-shadow(0 2px 4px rgba(10,20,50,.14))";
  return v;
}

// ---- Ice ----
// Hues: ice (frosted glass) and fjord (deep water) for the neutrals, then the landscape.
const I = { ice: 205, fjord: 235, glacier: 200, moss: 150, heather: 345, cloudberry: 70, twilight: 290, rust: 30, pine: 160, sky: 237 };
// Courses: 1 glacier, 2 moss, 3 heather, 4 cloudberry, 5 twilight. Alert rust, ok pine, now heather, announcements sky.
const iceCourses = [I.glacier, I.moss, I.heather, I.cloudberry, I.twilight];
function ice(dark) {
  const v = {};
  if (dark) {
    // graphite with a trace of fjord blue, not black: calm, and a shadow still shows on it
    v.bg = oklch(0.19, I.fjord, 0.007); v.surface = oklch(0.23, I.fjord, 0.008); v["surface-2"] = oklch(0.27, I.fjord, 0.008);
    v.ink = oklch(0.93, I.ice, 0.008); v.muted = oklch(0.74, I.ice, 0.014); v.line = oklch(0.34, I.fjord, 0.008);
  } else {
    v.bg = oklch(0.945, I.ice, 0.004); v.surface = oklch(0.988, I.ice, 0.0015); v["surface-2"] = oklch(0.968, I.ice, 0.003);
    v.ink = oklch(0.27, I.fjord, 0.020); v.muted = oklch(0.50, I.fjord, 0.012); v.line = oklch(0.885, I.ice, 0.006);
  }
  const floors = [v.bg, v.surface, v["surface-2"]];
  const text = (h, c) => calm(dark ? [0.70, 0.90] : [0.35, 0.60], h, c, floors, dark);
  const soft = h => oklch(dark ? 0.31 : 0.93, h, dark ? 0.016 : 0.014);
  // Containers are dim and the text on them carries the colour (a Coolify-style badge): dark tinted fill
  // with light coloured text in dark mode, pale tinted fill with deep coloured text in light mode.
  const container = h => oklch(dark ? 0.30 : 0.915, h, dark ? 0.035 : 0.03);
  const onContainer = (h, c, fill) => calm(dark ? [0.70, 0.95] : [0.25, 0.55], h, c, [fill], dark, 5);
  const role = (k, h, c) => { v[k] = text(h, c); v["on-" + k] = dark ? v.bg : "#ffffff"; v[k + "-container"] = container(h); v["on-" + k + "-container"] = onContainer(h, c + 0.01, v[k + "-container"]); v[k + "-soft"] = soft(h); };
  iceCourses.forEach((h, i) => role("c" + (i + 1), h, 0.055));
  role("alert", I.rust, 0.07); role("now", I.heather, 0.055);
  v.ok = text(I.pine, 0.055);
  v["ann-container"] = container(I.sky); v["on-ann-container"] = onContainer(I.sky, 0.06, v["ann-container"]);
  v.shadow = dark ? "0 1px 3px rgba(0,0,0,.45)" : "0 1px 3px rgba(30,40,45,.10)";
  // The lift, three levels: a soft shadow in light mode; in dark mode a black shadow vanishes on the
  // near-black page, so a faint ice glow instead (as Neon glows cyan), with a frost edge for the cut.
  v["box-lift"] = dark ? "drop-shadow(0 0 1px rgba(205,225,239,.16)) drop-shadow(0 0 8px rgba(205,225,239,.06))" : "drop-shadow(0 1px 3px rgba(30,40,45,.10))";
  v["card-lift"] = dark ? "drop-shadow(0 0 1px rgba(205,225,239,.22)) drop-shadow(0 0 10px rgba(205,225,239,.10)) drop-shadow(0 6px 14px rgba(205,225,239,.06))" : "drop-shadow(0 8px 12px rgba(30,40,45,.10)) drop-shadow(0 1px 2px rgba(30,40,45,.08))";
  v["pop-lift"] = dark ? "drop-shadow(0 0 1px rgba(205,225,239,.40)) drop-shadow(0 0 14px rgba(205,225,239,.16)) drop-shadow(0 8px 24px rgba(205,225,239,.10))" : "drop-shadow(0 10px 24px rgba(30,40,45,.18)) drop-shadow(0 2px 4px rgba(30,40,45,.12))";
  return v;
}

// ---- Navy ----
// Sampled: linen ground 89.5% 0.009 79; navy 24% 0.058 259; mid navy 35% 0.069 254; denim 44% 0.027 244;
// dusty blue 67% 0.032 243; pale blue 71% 0.060 246; gold 85% 0.095 91 (highlight) to 63% 0.062 81 (shade).
const NV = { linen: 80, navy: 258, blue: 250, gold: 88, stone: 65, slate: 215, dusk: 300, brick: 30, pine: 155 };
// Roles: c1 blue, c2 gold, c3 stone, c4 slate, c5 dusk. Alert brick, ok pine, now blue (the accent), announcements blue.
const navyRoles = [NV.blue, NV.gold, NV.stone, NV.slate, NV.dusk];
function navy(dark) {
  const v = {};
  if (dark) {
    // the navy becomes the ground; text is linen
    v.bg = oklch(0.17, NV.navy, 0.035); v.surface = oklch(0.215, NV.navy, 0.04); v["surface-2"] = oklch(0.255, NV.navy, 0.042);
    v.ink = oklch(0.92, NV.linen, 0.014); v.muted = oklch(0.74, 245, 0.03); v.line = oklch(0.32, 255, 0.04);
  } else {
    v.bg = oklch(0.935, NV.linen, 0.011); v.surface = oklch(0.982, NV.linen, 0.006); v["surface-2"] = oklch(0.962, NV.linen, 0.009);
    v.ink = oklch(0.24, NV.navy, 0.055); v.muted = oklch(0.48, 248, 0.03); v.line = oklch(0.86, NV.linen, 0.014);
  }
  const floors = [v.bg, v.surface, v["surface-2"]];
  // Low chroma throughout, so nothing shouts next to the gold; brick and gold text stay calm.
  const text = (h, c) => calm(dark ? [0.70, 0.90] : [0.35, 0.60], h, c, floors, dark);
  // Containers and washes sit on the linen like the board's swatches: low chroma, so a group reads as a
  // tint of the ground rather than a coloured panel (light 0.02, half of Ice's; dark 0.03).
  // `calm` scales a role's container and wash chroma: gold and stone are warm and read stronger than
  // the blues at the same chroma, so they take less (below).
  const soft = (h, calm = 1) => oklch(dark ? 0.285 : 0.95, h, (dark ? 0.022 : 0.011) * calm);
  const container = (h, calm = 1) => oklch(dark ? 0.25 : 0.915, h, (dark ? 0.03 : 0.02) * calm);
  const onContainer = (h, c, fill) => calm(dark ? [0.70, 0.95] : [0.25, 0.55], h, c, [fill], dark, 5);
  const role = (k, h, c, calm) => { v[k] = text(h, c); v["on-" + k] = dark ? v.bg : oklch(0.982, NV.linen, 0.006); v[k + "-container"] = container(h, calm); v["on-" + k + "-container"] = onContainer(h, c + 0.01, v[k + "-container"]); v[k + "-soft"] = soft(h, calm); };
  // Stone leans toward red in dark mode (hue 45): at 65 it turns olive on the navy ground.
  const hues = navyRoles.map(h => h === NV.stone && dark ? 45 : h);
  // In dark mode a dim gold fill turns brown, so Booch's fill drops to 20%: a warm graphite, with the
  // gold left to its heading and labels (on-container), like gold leaf on dark paper.
  hues.forEach((h, i) => role("c" + (i + 1), h, h === NV.gold ? 0.07 : 0.045, i === 1 ? (dark ? 0.2 : 0.6) : i === 2 ? 0.6 : 1));
  // and its group background goes further, to 10%, so the cards above it keep a trace more warmth
  if (dark) v["c2-container"] = container(NV.gold, 0.1);
  role("alert", NV.brick, 0.07); role("now", NV.blue, 0.07);
  v.ok = text(NV.pine, 0.05);
  // Announcements in the blue family (the dusty to pale blue strips of the board), a step off c1's hue
  v["ann-container"] = container(243); v["on-ann-container"] = onContainer(243, 0.07, v["ann-container"]);
  v.shadow = dark ? "0 1px 3px oklch(8% 0.03 260 / .5)" : "0 1px 3px oklch(24% 0.055 258 / .10)";
  // Lift: a shadow in both modes. Unlike Ice and Neon, the dark page is navy (L 0.17), not near black,
  // so a deeper navy-black shadow still shows; it only needs to be denser than in light mode.
  v["box-lift"] = dark ? "drop-shadow(0 1px 2px oklch(6% 0.025 262 / .55)) drop-shadow(0 3px 8px oklch(6% 0.025 262 / .35))" : "drop-shadow(0 1px 2px oklch(24% 0.055 258 / .08)) drop-shadow(0 3px 8px oklch(24% 0.055 258 / .07))";
  v["card-lift"] = dark ? "drop-shadow(0 8px 14px oklch(6% 0.025 262 / .55)) drop-shadow(0 1px 3px oklch(6% 0.025 262 / .5))" : "drop-shadow(0 8px 12px oklch(24% 0.055 258 / .10)) drop-shadow(0 1px 2px oklch(24% 0.055 258 / .08))";
  // Edges of significant elements (the template's "edged frame"): one gradient run along every side,
  // base tone, a shining spot, back through the base into a shadow, and back to the base, as light
  // moves along a metal edge. Gold for what matters now and the gold course, blue for active controls
  // and the blue course. Only Navy defines them; elsewhere the plain frames apply.
  const edge = (base, hi, lo) => "oklch(" + base + "), oklch(" + hi + ") 18%, oklch(" + base + ") 38%, oklch(" + lo + ") 68%, oklch(" + base + ")";
  const gold = dark ? ["76% 0.09 86", "93% 0.07 95", "54% 0.07 78"] : ["72% 0.095 86", "90% 0.08 95", "50% 0.07 78"];
  const blue = dark ? ["64% 0.07 250", "87% 0.05 244", "42% 0.065 256"] : ["46% 0.075 254", "76% 0.06 244", "26% 0.06 260"];
  v["edge-gold"] = edge(...gold); v["edge-gold-b"] = "oklch(" + gold[0] + ")";
  v["edge-blue"] = edge(...blue); v["edge-blue-b"] = "oklch(" + blue[0] + ")";
  v["pop-lift"] = dark ? "drop-shadow(0 12px 28px oklch(6% 0.025 262 / .65)) drop-shadow(0 2px 6px oklch(6% 0.025 262 / .5))" : "drop-shadow(0 10px 24px oklch(24% 0.055 258 / .16)) drop-shadow(0 2px 4px oklch(24% 0.055 258 / .10))";
  return v;
}

function block(v, indent) {
  const line = pairs => indent + pairs.map(([k, val]) => `--${k}:${val};`).join(" ");
  return [
    line([["bg", v.bg], ["surface", v.surface], ["surface-2", v["surface-2"]]]),
    line([["ink", v.ink], ["muted", v.muted], ["line", v.line]]),
    ...["c1", "c2", "c3", "c4", "c5", "alert", "now"].map(k => line([[k, v[k]], ["on-" + k, v["on-" + k]], [k + "-container", v[k + "-container"]], ["on-" + k + "-container", v["on-" + k + "-container"]], [k + "-soft", v[k + "-soft"]]])),
    line([["ok", v.ok], ["ann-container", v["ann-container"]], ["on-ann-container", v["on-ann-container"]]]),
    line([["shadow", v.shadow]]),
    line([["box-lift", v["box-lift"]]]),
    line([["card-lift", v["card-lift"]]]),
    line([["pop-lift", v["pop-lift"]]]),
    ...(v["edge-gold"] ? [line([["edge-gold", v["edge-gold"]]]), line([["edge-gold-b", v["edge-gold-b"]], ["edge-blue-b", v["edge-blue-b"]]]), line([["edge-blue", v["edge-blue"]]]),
      line([["edge-c1", "var(--edge-blue)"], ["edge-c1-b", "var(--edge-blue-b)"], ["edge-c2", "var(--edge-gold)"], ["edge-c2-b", "var(--edge-gold-b)"]])] : [])
  ].join("\n");
}
// One palette in light and dark. `sel` narrows :root to the palette ("" for the default).
// Dark follows the system unless the viewer picked light; data-theme="dark" forces it.
function css(name, sel, light, dark) {
  return [
    `/* ${name}${sel ? "" : " (default)"} */`,
    `:root${sel}{\n${block(light, "  ")}\n}`,
    `@media (prefers-color-scheme:dark){\n  :root${sel}:not([data-theme="light"]){\n    color-scheme:dark;\n${block(dark, "    ")}\n  }\n}`,
    `:root${sel}[data-theme="dark"]{\n  color-scheme:dark;\n${block(dark, "  ")}\n}`
  ].join("\n");
}
// Neon and Navy come after Ice: their selectors are as specific or more, so they win when stamped.
const out = css("Ice", "", ice(false), ice(true)) + "\n" + css("Neon", '[data-palette="neon"]', neon(false), neon(true)) + "\n" + css("Navy", '[data-palette="navy"]', navy(false), navy(true));

if (process.argv.includes("--check")) {
  for (const [n, v] of [["ice light", ice(false)], ["ice dark", ice(true)], ["neon light", neon(false)], ["neon dark", neon(true)], ["navy light", navy(false)], ["navy dark", navy(true)]]) {
    const r = (a, b) => contrast(v[a], v[b]).toFixed(1);
    const pair = k => r("on-" + k + "-container", k + "-container");
    console.log(n.padEnd(11), "ink", r("ink", "bg"), "muted", r("muted", "surface"), "accents", ["c1", "c2", "c3", "c4", "c5", "alert"].map(k => r(k, "surface")).join(" "), "| on-container", ["c1", "c2", "c3", "c4", "c5", "alert", "now", "ann"].map(pair).join(" "), "| on-now", r("on-now", "now"));
  }
} else if (!process.argv.includes("--write")) {
  console.log(out);
} else {
  const file = fileURLToPath(new URL("../src/template.html", import.meta.url));
  let s = readFileSync(file, "utf8");
  const re = /(\/\* palette:start[^\n]*\n)[\s\S]*?(\/\* palette:end \*\/)/;
  if (!re.test(s)) { console.error("palette markers not found in src/template.html"); process.exit(1); }
  writeFileSync(file, s.replace(re, (_, a, b) => a + out + "\n" + b));
  console.log("Wrote the palette block into src/template.html");
}
