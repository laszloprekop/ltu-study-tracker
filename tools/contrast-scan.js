// Browser snippet: WCAG contrast audit of everything currently visible on the page.
// Paste into the console (or run through the Claude in Chrome javascript tool) on the built page,
// once per view and theme. Returns the failing (text colour, background) pairs with an example.
//
// For each element that has its own text, the effective text colour is its computed colour times
// the opacity of every ancestor, and the background is found by walking up to the first painted
// background, blending translucent ones on the way. SVG text uses fill. Threshold: 4.5:1, or 3:1
// for large text (24px, or 18.66px bold). Text hidden, empty or off screen is skipped.
(function () {
  const parse = s => { const m = /rgba?\(([^)]+)\)/.exec(s); if (!m) return null; const p = m[1].split(/[\s,\/]+/).map(Number); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
  const lum = c => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
  const over = (top, under) => ({ r: top.r * top.a + under.r * (1 - top.a), g: top.g * top.a + under.g * (1 - top.a), b: top.b * top.a + under.b * (1 - top.a), a: 1 });
  const ratio = (a, b) => { const l1 = lum(a), l2 = lum(b); return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05); };
  const hex = c => "#" + [c.r, c.g, c.b].map(v => Math.round(v).toString(16).padStart(2, "0")).join("");
  const bodyBg = parse(getComputedStyle(document.body).backgroundColor);
  const pageBg = bodyBg && bodyBg.a > 0 ? bodyBg : parse(getComputedStyle(document.documentElement).backgroundColor) || { r: 255, g: 255, b: 255, a: 1 };
  function backgroundOf(el) {
    // walk up, collecting translucent layers, until an opaque one
    const layers = [];
    for (let n = el; n; n = n.parentElement) {
      const cs = getComputedStyle(n);
      let bg = parse(cs.backgroundColor);
      // a card paints its surface on a pseudo-element
      if ((!bg || bg.a === 0) && n.matches && n.matches(".card,.pop .panel")) bg = parse(getComputedStyle(n, "::before").backgroundColor);
      if (bg && bg.a > 0) { layers.push(bg); if (bg.a >= 1) break; }
    }
    let out = pageBg;
    for (let i = layers.length - 1; i >= 0; i--) out = over(layers[i], out);
    return out;
  }
  function opacityOf(el) { let o = 1; for (let n = el; n; n = n.parentElement) o *= Number(getComputedStyle(n).opacity); return o; }
  const seen = new Map();
  const all = document.querySelectorAll("body *");
  for (const el of all) {
    const text = [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent.trim()).join("");
    if (!text) continue;
    const r = el.getBoundingClientRect(); if (!r.width || !r.height || r.bottom < 0 || r.top > innerHeight) continue;
    const cs = getComputedStyle(el); if (cs.visibility === "hidden" || cs.display === "none") continue;
    const isSvg = el instanceof SVGElement;
    let fg = parse(isSvg ? cs.fill : cs.color); if (!fg) continue;
    const op = opacityOf(el); fg = { ...fg, a: fg.a * op }; if (fg.a <= 0.05) continue;
    const bg = backgroundOf(el), eff = over(fg, bg);
    const size = parseFloat(cs.fontSize), bold = parseInt(cs.fontWeight, 10) >= 700, large = size >= 24 || (size >= 18.66 && bold);
    const need = large ? 3 : 4.5, c = ratio(eff, bg);
    if (c >= need) continue;
    const key = hex(eff) + " on " + hex(bg) + " " + (large ? "L" : "n");
    const cls = el.className && typeof el.className === "string" ? "." + el.className.trim().split(/\s+/).join(".") : (el.className && el.className.baseVal ? "." + el.className.baseVal.trim().split(/\s+/).join(".") : "");
    const where = el.tagName.toLowerCase() + cls;
    if (!seen.has(key)) seen.set(key, { fg: hex(eff), bg: hex(bg), ratio: +c.toFixed(2), need, count: 0, examples: new Set() });
    const e = seen.get(key); e.count++; if (e.examples.size < 4) e.examples.add(where + ' "' + text.slice(0, 30) + '"');
  }
  return [...seen.values()].sort((a, b) => a.ratio - b.ratio).map(e => ({ ...e, examples: [...e.examples] }));
})();
