#!/usr/bin/env node
// Tests the tick merge rule in src/template.html (the later change per id wins; a side without a
// time can only add a tick). Pulls the real functions out of the template and runs them on stubs.
//   node tools/test-ticks.mjs
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
const code = ["migrate", "migrateAt", "setTick", "mergeTicks"].map(grab).join("\n");
const make = (checked = {}, tickAt = {}) => {
  const state = { checked: { ...checked }, tickAt: { ...tickAt } };
  const P = { LEGACY_IDS: { "w42-lab3": "d:Z0025E:3043" } };
  const f = new Function("state", "P", code + "; return { setTick, mergeTicks };")(state, P);
  return { state, ...f };
};
const T1 = "2026-10-01T10:00:00.000Z", T2 = "2026-10-02T10:00:00.000Z";
let n = 0;
const test = (name, fn) => { fn(); n++; console.log("ok  " + name); };

test("a newer clear elsewhere clears it here", () => {
  const t = make({ "t:a": true }, { "t:a": T1 });
  assert.equal(t.mergeTicks({}, { "t:a": T2 }), 1);
  assert.equal(t.state.checked["t:a"], undefined);
  assert.equal(t.state.tickAt["t:a"], T2);
});
test("an older tick elsewhere does not undo a newer clear here", () => {
  const t = make({}, { "t:a": T2 });
  assert.equal(t.mergeTicks({ "t:a": true }, { "t:a": T1 }), 0);
  assert.equal(t.state.checked["t:a"], undefined);
});
test("a version 1 code (no times) adds ticks and never clears", () => {
  const t = make({ "t:a": true }, { "t:a": T1 });
  assert.equal(t.mergeTicks({ "t:b": true }, null), 1);
  assert.deepEqual(Object.keys(t.state.checked).sort(), ["t:a", "t:b"]);
});
test("a timed change wins over a tick from before times were kept", () => {
  const t = make({ "t:a": true }, {});
  assert.equal(t.mergeTicks({}, { "t:a": T1 }), 1);
  assert.equal(t.state.checked["t:a"], undefined);
});
test("old ids map to new ones, times included", () => {
  const t = make();
  assert.equal(t.mergeTicks({ "w42-lab3": true }, { "w42-lab3": T1 }), 1);
  assert.equal(t.state.checked["d:Z0025E:3043"], true);
  assert.equal(t.state.tickAt["d:Z0025E:3043"], T1);
});
test("setTick notes the time of a clear", () => {
  const t = make({ "t:a": true });
  t.setTick("t:a", false, T2);
  assert.equal(t.state.checked["t:a"], undefined);
  assert.equal(t.state.tickAt["t:a"], T2);
});
console.log(`${n} passed`);
