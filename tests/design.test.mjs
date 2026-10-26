// 디자인 원본(tokens·components·copy.json)과 파생물(DESIGN.md, index.html :root)이 맞는지 본다.
// design-harness 플러그인 없이 도는 값 대조라 CI에서도 돈다. 글자 단위 일치와 공식 린트는
// 로컬의 `design-harness check`(답을 끝낼 때 Stop 훅)가 맡는다.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const work = `${root}work/seoul-parking/`;
const read = (f) => fs.readFileSync(f, 'utf8');
const tokens = JSON.parse(read(`${work}tokens.json`));
const components = JSON.parse(read(`${work}components.json`)).components;
const copy = JSON.parse(read(`${work}copy.json`));
const designMd = read(`${work}DESIGN.md`);
const html = read(`${root}index.html`);

// { 'color.brand': '#0A4A94', ... } — '{primitive.x}' 참조는 끝까지 풀어 둔다.
const flat = {};
(function walk(node, prefix) {
  for (const [k, v] of Object.entries(node)) {
    if (k.startsWith('$') || v === null || typeof v !== 'object') continue;
    const name = prefix ? `${prefix}.${k}` : k;
    if ('$value' in v) flat[name] = v.$value;
    else walk(v, name);
  }
})(tokens, '');
const resolve = (v, seen = 0) => {
  const m = typeof v === 'string' && /^\{(.+)\}$/.exec(v);
  if (!m) return v;
  assert.ok(seen < 10 && m[1] in flat, `풀 수 없는 토큰 참조 ${v}`);
  return resolve(flat[m[1]], seen + 1);
};
const semantic = Object.keys(flat).filter((k) => !k.startsWith('primitive.'));
const value = (k) => {
  const v = resolve(flat[k]);
  return Array.isArray(v) ? v.join(', ') : String(v);
};

// DESIGN.md front matter: 두 칸 들여쓰기 YAML(값은 JSON 스칼라)만 읽는다.
const front = (() => {
  const m = /^---\n([\s\S]*?)\n---\n/.exec(designMd);
  assert.ok(m, 'DESIGN.md에 front matter가 없어요');
  const out = {};
  const stack = [];
  for (const line of m[1].split('\n')) {
    const lm = /^( *)("[^"]+"|[^:]+):(?: (.*))?$/.exec(line);
    if (!lm) continue;
    const depth = lm[1].length / 2;
    const key = lm[2].replace(/^"|"$/g, '');
    stack.length = depth;
    const parent = stack.reduce((o, k) => o[k], out);
    if (lm[3] === undefined) { parent[key] = {}; stack.push(key); }
    else parent[key] = JSON.parse(lm[3]);
  }
  return out;
})();
const REGEN = ' — 원본을 고쳤다면 `design-harness design-md`로 다시 만드세요';

test('DESIGN.md front matter의 색·간격·모서리·글자 크기가 tokens.json과 같다', () => {
  const groups = { color: 'colors', space: 'spacing', radius: 'rounded', 'font-size': 'typography' };
  for (const [group, target] of Object.entries(groups)) {
    const expected = Object.fromEntries(
      semantic.filter((k) => k.startsWith(`${group}.`)).map((k) => [k.slice(group.length + 1), value(k)]),
    );
    const actual = { ...front[target] };
    if (target === 'colors' && !('primary' in expected)) delete actual.primary; // brand의 별칭
    if (target === 'typography') for (const k in actual) actual[k] = actual[k].fontSize;
    assert.deepEqual(actual, expected, `DESIGN.md ${target}${REGEN}`);
  }
});

test('DESIGN.md에 components.json의 컴포넌트가 모두, 같은 순서로 있다', () => {
  const listed = [...designMd.matchAll(/^- \*\*([A-Za-z]+)\*\* \(`[a-z-]+`\)/gm)].map((m) => m[1]);
  assert.deepEqual(listed, components.map((c) => c.name), `DESIGN.md Components${REGEN}`);
});

test("DESIGN.md Don'ts에 copy.json 금지어가 모두 있다", () => {
  const listed = [...designMd.matchAll(/^- Don't: 「(.+)」 표현을 쓰지 않는다\.$/gm)].map((m) => m[1]);
  assert.deepEqual(listed, copy.banned, `DESIGN.md Don'ts${REGEN}`);
});

test('index.html :root 변수가 tokens.json semantic 토큰과 같다', () => {
  const rootBlock = /:root\s*\{([\s\S]*?)\}/.exec(html)?.[1] ?? '';
  const vars = Object.fromEntries([...rootBlock.matchAll(/--([\w-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]));
  const norm = (v) => v.replace(/['"]/g, '').replace(/\s*,\s*/g, ', ').toLowerCase();
  const expected = Object.fromEntries(semantic.map((k) => [k.replace(/\./g, '-'), norm(value(k))]));
  const actual = Object.fromEntries(Object.entries(vars).filter(([k]) => k in expected).map(([k, v]) => [k, norm(v)]));
  assert.deepEqual(actual, expected, 'index.html :root가 tokens.json과 달라요. 값은 tokens.json(승인 대상)이 기준이에요');
});
