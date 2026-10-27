// 디자인 원본(work/seoul-parking의 승인본)과 DESIGN.md·index.html이 어긋나지 않았는지 확인한다.
// design-harness 플러그인 없이 도는 부분만 여기 둔다(CI용). 렌더링 검사와 DESIGN.md 재생성 비교는
// 로컬 Stop 훅(design-harness check, scripts/lint-web.mjs)이 맡는다.
// 실행: node --test tests/
import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import vm from "node:vm";

const root = new URL("../", import.meta.url);
const W = "work/seoul-parking/";
const read = (p) => readFileSync(new URL(p, root), "utf8");
const json = (p) => JSON.parse(read(p));
const tokens = json(W + "tokens.json");
const html = read("index.html");

// DTCG 토큰을 { "color.text": { value, type } }로 펴고 별칭을 푼다(design-harness lib.mjs flattenTokens와 같은 규칙).
function flatten(doc) {
  const raw = {};
  const walk = (node, prefix, type) => {
    type = node.$type ?? type;
    if ("$value" in node) return void (raw[prefix.join(".")] = { value: node.$value, type });
    for (const [k, v] of Object.entries(node)) if (!k.startsWith("$") && v && typeof v === "object") walk(v, [...prefix, k], type);
  };
  walk(doc, [], undefined);
  const resolve = (k) => {
    const m = typeof raw[k].value === "string" && raw[k].value.match(/^\{(.+)\}$/);
    return m ? resolve(m[1]) : raw[k].value;
  };
  return Object.fromEntries(Object.keys(raw).map((k) => [k, { value: resolve(k), type: raw[k].type }]));
}
const flat = flatten(tokens);
const same = (a, b) => (typeof a === "number" || typeof b === "number" ? Number(a) === Number(b) : String(a).toUpperCase() === String(b).toUpperCase());

test("승인된 산출물이 승인 당시 그대로다 (approvals.json 해시)", () => {
  // design-harness lib.mjs GATE_FILES·gateHash와 같은 파일·순서·방식
  const GATE_FILES = { wireframe: ["ia.json", "wireframes.json"], system: ["tokens.json", "components.json", "copy.json"], verify: ["figma/nodes.json", "review.json"] };
  const approvals = json(W + "approvals.json");
  for (const [phase, files] of Object.entries(GATE_FILES)) {
    assert.ok(approvals[phase]?.hash, `${phase} 승인 없음`);
    const h = createHash("sha256");
    for (const f of files) h.update(existsSync(new URL(W + f, root)) ? readFileSync(new URL(W + f, root)) : "");
    assert.equal(h.digest("hex").slice(0, 16), approvals[phase].hash, `${phase} 승인 뒤 ${files.join("·")}가 바뀜 — 사람이 다시 보고 승인해야 함`);
  }
});

// DESIGN.md front matter는 JSON 스칼라를 쓰는 들여쓰기 YAML이다(design-harness design-md가 만든다).
function frontMatter(md) {
  const body = md.match(/^---\n([\s\S]*?)\n---\n/)[1];
  const out = {};
  const stack = [{ indent: -1, node: out }];
  for (const line of body.split("\n")) {
    const m = line.match(/^( *)("[^"]+"|[^:]+):(?: (.*))?$/);
    if (!m) continue;
    const indent = m[1].length, key = m[2].startsWith('"') ? JSON.parse(m[2]) : m[2];
    while (stack.at(-1).indent >= indent) stack.pop();
    const parent = stack.at(-1).node;
    if (m[3] === undefined) stack.push({ indent, node: (parent[key] = {}) });
    else parent[key] = JSON.parse(m[3]);
  }
  return out;
}

test("DESIGN.md front matter가 tokens.json과 같다", () => {
  const md = read(W + "DESIGN.md");
  const fm = frontMatter(md);
  assert.equal(fm.name, "seoul-parking");
  // design-md.mjs GROUPS: semantic 색·간격·모서리·글자 크기만 front matter에 간다.
  const expect = {};
  for (const [k, t] of Object.entries(flat)) {
    const [group, ...rest] = k.split(".");
    if (!rest.length) continue;
    const name = rest.join("-");
    if (group === "color") expect[`colors.${name}`] = t.value;
    else if (group === "space") expect[`spacing.${name}`] = t.value;
    else if (group === "radius") expect[`rounded.${name}`] = t.value;
    else if (group === "font-size") expect[`typography.${name}`] = t.value;
  }
  const got = {};
  for (const g of ["colors", "spacing", "rounded"]) for (const [k, v] of Object.entries(fm[g] ?? {})) got[`${g}.${k}`] = v;
  for (const [k, v] of Object.entries(fm.typography ?? {})) got[`typography.${k}`] = v.fontSize;
  // DESIGN.md가 요구하는 대표 색 자리는 brand의 별칭
  if (got["colors.primary"] === "{colors.brand}") delete got["colors.primary"];
  assert.deepEqual(Object.keys(got).sort(), Object.keys(expect).sort(), "DESIGN.md와 tokens.json의 토큰 목록이 다름 — design-harness design-md로 다시 만들기");
  for (const [k, v] of Object.entries(expect)) assert.ok(same(got[k], v), `${k}: DESIGN.md ${got[k]} ≠ tokens.json ${v}`);
  const family = flat["font-family.base"].value;
  for (const [k, v] of Object.entries(fm.typography ?? {})) assert.equal(v.fontFamily, family[0], `typography.${k}.fontFamily`);
  assert.match(md, /여기를 고치지 말고 원본을 고친 뒤 다시 만든다/);
});

test("index.html :root 변수가 tokens.json 값과 같다", () => {
  const css = html.match(/:root \{([\s\S]*?)\n\}/)[1];
  const vars = Object.fromEntries([...css.matchAll(/--([\w-]+):([^;]+);/g)].map((m) => [m[1], m[2].trim()]));
  const val = (v) => (v.match(/^var\(--([\w-]+)\)$/) ? val(vars[v.match(/^var\(--([\w-]+)\)$/)[1]]) : v);
  // 이름이 토큰 경로와 다른 변수
  const ALIAS = { "size-swatch": "size.column-label-swatch" };
  const RULES = [[/^color-(.+)/, "color.$1"], [/^column-(.+)/, "color.column.$1"], [/^space-(.+)/, "space.$1"], [/^radius-(.+)/, "radius.$1"],
    [/^size-(.+)/, "size.$1"], [/^leader-width$/, "size.leader-width"], [/^fs-(.+)/, "font-size.$1"], [/^lh-(.+)/, "line-height.$1"], [/^opacity-(.+)/, "opacity.$1"]];
  let checked = 0;
  for (const [name, v] of Object.entries(vars)) {
    const rule = RULES.find(([re]) => re.test(name));
    if (!rule) continue;
    const key = ALIAS[name] ?? name.replace(rule[0], rule[1]);
    assert.ok(flat[key], `--${name}: 맞는 토큰(${key})이 없음 — 값을 지어내지 말고 토큰을 먼저 정하기`);
    assert.ok(same(val(v), flat[key].value), `--${name} ${val(v)} ≠ ${key} ${flat[key].value}`);
    checked++;
  }
  assert.ok(checked > 30, `검사한 변수 ${checked}개`);
});

test("index.html의 색 값은 모두 토큰 색이다", () => {
  const colors = new Set(Object.values(flat).filter((t) => t.type === "color").map((t) => String(t.value).toUpperCase()));
  const hexes = [...new Set(html.match(/#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b/g))].map((h) => h.toUpperCase());
  assert.deepEqual(hexes.filter((h) => !colors.has(h)), [], "토큰에 없는 색");
  // 투명도는 rgba() 대신 토큰 색 + opacity 토큰으로 쓴다
  assert.deepEqual(html.match(/\b(rgba?|hsla?)\(/g) ?? [], []);
});

test("스크립트 T 객체의 지도·기둥 색이 토큰과 같다", () => {
  const script = html.match(/<script>\n([\s\S]*?)<\/script>/)[1];
  const ctx = { matchMedia: () => ({ matches: false }) };
  vm.createContext(ctx);
  vm.runInContext(script.slice(0, script.indexOf("const CITY_HALL")) + "\n;globalThis.__ = T;", ctx);
  const T = ctx.__;
  const KEY = (k) => (["plenty", "some", "few", "full", "no-realtime"].includes(k) ? `color.column.${k}` : k === "leader" ? "color.leader" : `color.map.${k}`);
  for (const [k, v] of Object.entries(T.color)) {
    assert.ok(flat[KEY(k)], `T.color.${k}: 토큰 ${KEY(k)} 없음`);
    assert.ok(same(v, flat[KEY(k)].value), `T.color.${k} ${v} ≠ ${KEY(k)} ${flat[KEY(k)].value}`);
  }
  assert.equal(T.opacity.stale, flat["opacity.column-stale"].value);
  assert.equal(T.opacity.shadow, flat["opacity.map-shadow"].value);
  assert.equal(T.pitch, flat["map.pitch-default"].value);
  assert.equal(T.pitchReduced, flat["map.pitch-reduced"].value);
});
