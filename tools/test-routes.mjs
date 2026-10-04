#!/usr/bin/env node
// Tests the Link addresses in src/template.html: what routeOf writes, parseRoute reads back, and
// applyRoute does with it. Pulls the real functions out of the template and runs them on stubs.
//   node tools/test-routes.mjs
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
const views = /var ROUTE_VIEWS = [^;]+;/.exec(src)[0];
const code = [views, ...["seg", "routeOf", "parseRoute", "applyRoute"].map(grab)].join("\n");
const make = (over = {}) => {
  const state = { term: "ht26-lp2", filter: "all", view: "week", flipped: {}, ...over };
  const TERMS = [{ id: "ht26-lp2" }, { id: "vt27-lp3" }], COURSES = { Z0025E: {}, Z7005E: {} };
  return { state, ...new Function("state", "TERMS", "COURSES", code + "; return { routeOf, parseRoute, applyRoute };")(state, TERMS, COURSES) };
};
let n = 0;
const test = (name, fn) => { fn(); n++; console.log("ok  " + name); };

test("a row address keeps its id readable and carries term and course", () => {
  const r = make({ filter: "Z0025E" });
  assert.equal(r.routeOf("week", ["s:Z0025E:2026-10-14:10:15"]), "#/week/s:Z0025E:2026-10-14:10:15?term=ht26-lp2&course=Z0025E");
});
test("what routeOf writes, parseRoute reads back", () => {
  const r = make();
  const p = r.parseRoute(r.routeOf("day", ["2026-10-14", "t:w42 book/3"]));
  assert.equal(p.view, "day");
  assert.deepEqual(p.parts, ["2026-10-14", "t:w42 book/3"]);
  assert.equal(p.term, "ht26-lp2");
  assert.equal(p.course, null);
});
test("a card address on its answer side", () => {
  const r = make(), id = "0b6f2c1e-1111-4222-8333-944445555666";
  const a = r.routeOf("cards", [id], { answer: true, course: "all" });
  assert.equal(a, "#/cards/" + id + "/answer?term=ht26-lp2");
  r.applyRoute(r.parseRoute(a));
  assert.equal(r.state.view, "cards");
  assert.equal(r.state.cardOne, id);
  assert.equal(r.state.flipped[id], true);
});
test("a Card Set address selects that set", () => {
  const r = make();
  r.applyRoute(r.parseRoute("#/cards/set/Z0025E:3043"));
  assert.equal(r.state.cardFilter, "Z0025E:3043");
  assert.equal(r.state.cardOne, null);
});
test("the address wins: view, term and course; no course means all", () => {
  const r = make({ filter: "Z7005E", view: "map" });
  r.applyRoute(r.parseRoute("#/all/d:Z0025E:3043?term=vt27-lp3"));
  assert.equal(r.state.view, "all");
  assert.equal(r.state.term, "vt27-lp3");
  assert.equal(r.state.filter, "all");
  assert.equal(r.state.routeTarget, "d:Z0025E:3043");
  assert.equal(r.state.routeFocus, true);
});
test("unknown term or course in an address is ignored", () => {
  const r = make();
  r.applyRoute(r.parseRoute("#/week?term=nope&course=XX0000"));
  assert.equal(r.state.term, "ht26-lp2");
  assert.equal(r.state.filter, "all");
});
test("anything that is not a route is left alone", () => {
  const r = make();
  for (const h of ["", "#", "#today", "#/nope", "#/app", "#week"]) assert.equal(r.parseRoute(h), null, h);
});
test("a broken escape in an address does not throw", () => {
  const r = make();
  assert.deepEqual(r.parseRoute("#/week/t:%E0%A4%A").parts, ["t:%E0%A4%A"]);
});
console.log(n + " passed");
