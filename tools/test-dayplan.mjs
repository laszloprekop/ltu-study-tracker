#!/usr/bin/env node
// Tests where Day Planner blocks sit when their times overlap (dpLayout in src/template.html).
//   node tools/test-dayplan.mjs
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";

const src = readFileSync(fileURLToPath(new URL("../src/template.html", import.meta.url)), "utf8");
const grab = name => {
  const s = src.indexOf("function " + name + "(");
  if (s < 0) throw new Error("no function " + name);
  let d = 0, i = src.indexOf("{", s);
  for (; ; i++) { if (src[i] === "{") d++; else if (src[i] === "}" && --d === 0) break; }
  return src.slice(s, i + 1);
};
const dpLayout = new Function(grab("dpLayout") + "; return dpLayout;")();
const m = t => { const [h, mi] = t.split(":").map(Number); return h * 60 + mi; };
// "09:00-10:30" → the block's span as [from, to, of, inset]
const lay = (...spans) => dpLayout(spans.map(x => { const [s, e] = x.split("-"); return { s: m(s), e: m(e) }; })).map(l => [l.from, l.to, l.n, l.inset]);
let n = 0;
const test = (name, fn) => { fn(); n++; console.log("ok  " + name); };

test("blocks that do not meet keep the full width", () => {
  assert.deepEqual(lay("09:00-10:00", "10:00-11:00", "13:00-14:00"), [[0, 1, 1, 0], [0, 1, 1, 0], [0, 1, 1, 0]]);
});
test("the same start: side by side", () => {
  assert.deepEqual(lay("09:30-10:30", "09:30-10:30"), [[0, 1, 2, 0], [1, 2, 2, 0]]);
});
test("starts 15 minutes apart: side by side", () => {
  assert.deepEqual(lay("13:00-15:00", "13:15-17:00"), [[0, 1, 2, 0], [1, 2, 2, 0]]);
});
test("a later start: the earlier block keeps the width, the later one lies on its right half", () => {
  // the later one cannot move left: the block starting 10:30 has its first lines there
  assert.deepEqual(lay("09:00-10:30", "10:00-12:00", "10:30-12:00"), [[0, 2, 2, 0], [1, 2, 2, 0], [0, 1, 2, 0]]);
});
test("short blocks inside a long one lie on it, inset", () => {
  assert.deepEqual(lay("13:30-16:30", "14:30-15:00", "15:30-16:30"), [[0, 2, 2, 0], [0, 2, 2, 1], [0, 2, 2, 1]]);
});
test("a block starting as another ends lies on it, inset; the pair beside it stays side by side", () => {
  assert.deepEqual(lay("13:30-15:30", "13:30-15:00", "15:00-17:00"), [[0, 1, 2, 0], [1, 2, 2, 0], [0, 2, 2, 1]]);
});
test("a block does not stretch under one that started before it", () => {
  assert.deepEqual(lay("13:00-15:00", "13:15-17:00", "15:00-17:00"), [[0, 1, 2, 0], [1, 2, 2, 0], [0, 1, 2, 0]]);
});
test("three deep: each inset one step more", () => {
  assert.deepEqual(lay("09:00-13:00", "10:00-12:00", "11:00-11:30"), [[0, 3, 3, 0], [0, 3, 3, 1], [0, 3, 3, 2]]);
});
test("the order given is the order returned", () => {
  assert.deepEqual(lay("15:30-16:30", "13:30-16:30"), [[0, 2, 2, 1], [0, 2, 2, 0]]);
});
console.log(n + " passed");
