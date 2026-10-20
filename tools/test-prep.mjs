#!/usr/bin/env node
// Tests the Prep Plans in data/plan.mjs: every tick id is unique, and every Card drafted from a
// module's pages (data/cards/*.json) lands in at least one of that module's topic decks, with the
// same rule the page uses (prepDeck in src/template.html): a source in the module, and the topic's
// pattern on the card's question. A card that lands nowhere would only be in the module's deck.
//   node tools/test-prep.mjs
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import { TERMS } from "../data/plan.mjs";

const dir = fileURLToPath(new URL("../data/cards/", import.meta.url));
const cards = readdirSync(dir).filter(f => f.endsWith(".json")).flatMap(f => JSON.parse(readFileSync(dir + f, "utf8")).cards.map(c => ({ ...c, file: f })));
let n = 0;
const test = (name, fn) => { fn(); n++; console.log("ok  " + name); };

for (const p of TERMS.flatMap(t => t.prep || [])) {
  const pre = `t:${p.course.toLowerCase()}-`;
  test(`${p.title}: every tick id is unique`, () => {
    const ids = p.modules.flatMap(m => [...m.cyu.map(r => pre + "cyu-" + r.split("@")[0]),
      ...m.topics.flatMap(tp => [...(tp.check ? [pre + "kc-" + tp.key] : []), ...(tp.problems || []).map(x => pre + "ia-" + x.id)])]);
    assert.equal(new Set(ids).size, ids.length, "duplicate: " + ids.filter((x, i) => ids.indexOf(x) !== i).join(", "));
  });
  test(`${p.title}: every card from a module's pages is in one of its topic decks`, () => {
    const lost = [];
    for (const m of p.modules) {
      const mine = cards.filter(c => c.course === p.course && (c.kind || "concept") !== "answer" && c.sources.some(s => s.split(".")[0] === m.n));
      for (const c of mine) if (!m.topics.some(tp => tp.cards && new RegExp(tp.cards, "i").test(c.prompt))) lost.push(`module ${m.n}, ${c.file}: ${c.prompt}`);
    }
    assert.equal(lost.length, 0, "in no topic deck:\n  " + lost.join("\n  "));
  });
}
console.log(`${n} passed`);
