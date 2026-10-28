import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { lintNodes, lintFigma, figmaColor } from '../lib/lint-figma.js';
import { normalizeColor, lengthToPx, forbiddenPhrases } from '../lib/design-system.js';
import { makeProject, FILL, TOKENS, COMPONENTS, COPY } from './helpers.js';

const BIN = fileURLToPath(new URL('../bin/design-harness.js', import.meta.url));
const ctx = {
  colors: new Set(Object.values(TOKENS.color).map(normalizeColor)),
  fontSizes: new Set(Object.values(TOKENS.fontSize).map(lengthToPx)),
  spacing: new Set(Object.values(TOKENS.spacing).map(lengthToPx)),
  fontFamilies: new Set(['pretendard']),
  phrases: forbiddenPhrases(COPY),
  components: COMPONENTS,
};
const lint = (data) => lintNodes(data, ctx).map((i) => `${i.node} ${i.path} ${i.rule} ${i.message}`);
const rgb = (hex) => ({ r: parseInt(hex.slice(1, 3), 16) / 255, g: parseInt(hex.slice(3, 5), 16) / 255, b: parseInt(hex.slice(5, 7), 16) / 255, a: 1 });
const solid = (hex, extra = {}) => ({ type: 'SOLID', color: rgb(hex), ...extra });
const box = (width, height) => ({ absoluteBoundingBox: { x: 0, y: 0, width, height } });

test('Figma 색을 #rrggbbaa 로 바꾼다', () => {
  assert.equal(figmaColor(rgb('#1a73e8')), '#1a73e8ff');
  assert.equal(figmaColor(rgb('#111111'), 0.5), '#11111180');
});

test('토큰과 같은 값, 변수에 바인딩된 값, 숨긴 노드는 통과한다', () => {
  const screen = {
    id: '1:1', name: 'S01 로그인', type: 'FRAME', layoutMode: 'VERTICAL', itemSpacing: 16, paddingTop: 0,
    fills: [solid('#ffffff')],
    children: [
      { id: '1:2', name: '제목', type: 'TEXT', characters: '로그인', style: { fontSize: 24, fontFamily: 'Pretendard' }, fills: [solid('#111111')] },
      { id: '1:3', name: '배경', type: 'RECTANGLE', fills: [solid('#abcdef', { boundVariables: { color: { type: 'VARIABLE_ALIAS', id: 'V:1' } } })] },
      { id: '1:4', name: '숨김', type: 'TEXT', visible: false, characters: '클릭하세요', style: { fontSize: 13 } },
      { id: '1:5', name: 'Button', type: 'INSTANCE', ...box(320, 48), fills: [solid('#1a73e8'), solid('#ff0000', { visible: false })] },
    ],
  };
  assert.deepEqual(lint({ nodes: { '1:1': { document: screen } } }), []);
});

test('토큰 밖 색·글자 크기·글꼴·간격을 노드 경로와 함께 찾는다', () => {
  const screen = {
    id: '2:1', name: 'S02 가입', type: 'FRAME', layoutMode: 'VERTICAL', itemSpacing: 12, paddingLeft: 16,
    fills: [solid('#f5f5f5')],
    children: [
      {
        id: '2:2', name: '안내', type: 'TEXT', characters: '가입', style: { fontSize: 14, fontFamily: 'Inter' },
        styleOverrideTable: { 1: { fontSize: 20 } }, strokes: [solid('#111111', { opacity: 0.5 })],
      },
      { id: '2:3', name: '띠', type: 'RECTANGLE', fills: [{ type: 'GRADIENT_LINEAR', gradientStops: [{ color: rgb('#1a73e8') }, { color: rgb('#00ff00') }] }] },
    ],
  };
  assert.deepEqual(lint({ document: screen }), [
    '2:1 S02 가입 color 채우기 #F5F5F5 — 토큰에 없는 색',
    '2:1 S02 가입 spacing itemSpacing 12px — 토큰에 없는 간격 (토큰: 16px)',
    '2:2 S02 가입 / 안내 color 선 #111111 (불투명도 50%) — 토큰에 없는 색',
    '2:2 S02 가입 / 안내 font-size 글자 크기 14px — 토큰에 없는 글자 크기 (토큰: 12, 16, 24px)',
    '2:2 S02 가입 / 안내 font-family 글꼴 "Inter" — 토큰에 없는 글꼴',
    '2:2 S02 가입 / 안내 font-size 글자 크기 20px — 토큰에 없는 글자 크기 (토큰: 12, 16, 24px)',
    '2:3 S02 가입 / 띠 color 채우기 #00FF00 — 토큰에 없는 색',
  ]);
});

test('작은 인터랙티브 요소와 금지 문구를 찾는다', () => {
  const screen = {
    id: '3:1', name: 'S03', type: 'FRAME', ...box(390, 800),
    children: [
      { id: '3:2', name: '로그인 버튼', type: 'FRAME', ...box(120, 36), children: [
        { id: '3:3', name: 'Icon button', type: 'INSTANCE', ...box(16, 16) },
        { id: '3:4', name: 'label', type: 'TEXT', characters: '사인인 하려면 클릭하세요', style: { fontSize: 16 } },
      ] },
      { id: '3:5', name: '카드', type: 'FRAME', ...box(40, 40), reactions: [{ action: { type: 'NODE' } }] },
      { id: '3:6', name: '큰 카드', type: 'INSTANCE', componentId: 'C:1', ...box(30, 30) },
      { id: '3:7', name: '장식', type: 'FRAME', ...box(10, 10) },
    ],
  };
  const meta = { components: { 'C:1': { name: 'State=default', componentSetId: 'CS:1' } }, componentSets: { 'CS:1': { name: 'Link' } } };
  assert.deepEqual(lint({ nodes: { '3:1': { document: screen, ...meta } } }), [
    '3:2 S03 / 로그인 버튼 touch-target 높이 36px — 44px 보다 작음',
    '3:4 S03 / 로그인 버튼 / label copy 금지 문구 "클릭하세요"',
    '3:4 S03 / 로그인 버튼 / label copy 금지 문구 "사인인" — "로그인"(으)로 쓰세요',
    '3:5 S03 / 카드 touch-target 높이 40px — 44px 보다 작음',
    '3:5 S03 / 카드 touch-target 너비 40px — 44px 보다 작음',
    '3:6 S03 / 큰 카드 touch-target 높이 30px — 44px 보다 작음',
    '3:6 S03 / 큰 카드 touch-target 너비 30px — 44px 보다 작음',
  ]);
});

test('components.json 의 variant 가 컴포넌트 세트에 없으면 알린다', () => {
  const set = {
    id: '5:1', name: 'Button', type: 'COMPONENT_SET',
    children: [
      { id: '5:2', name: 'State=Default', type: 'COMPONENT', ...box(120, 48) },
      { id: '5:3', name: 'State=Disabled', type: 'COMPONENT', ...box(120, 48) },
    ],
  };
  assert.deepEqual(lint(set), ['5:1 Button variant Button 에 variant "hover" 없음 (components.json)']);
  set.componentPropertyDefinitions = { State: { type: 'VARIANT', variantOptions: ['Default', 'Hover', 'Disabled'] } };
  assert.deepEqual(lint(set), []);
  // 세트 안 variant 의 터치 영역은 세트 이름(Button)으로 판정한다
  set.children[0].absoluteBoundingBox.height = 32;
  assert.deepEqual(lint(set), ['5:2 Button / State=Default touch-target 높이 32px — 44px 보다 작음']);
});

test('플러그인 API 형식(fontSize·width 가 노드에 바로 있음)도 읽는다', () => {
  assert.deepEqual(lint([{ id: '6:1', name: 'Tab', type: 'FRAME', width: 80, height: 30, children: [
    { id: '6:2', name: 't', type: 'TEXT', characters: '홈', fontSize: 15, fontName: { family: 'Pretendard', style: 'Bold' } },
  ] }]), [
    '6:1 Tab touch-target 높이 30px — 44px 보다 작음',
    '6:2 Tab / t font-size 글자 크기 15px — 토큰에 없는 글자 크기 (토큰: 12, 16, 24px)',
  ]);
  assert.throws(() => lintNodes({ foo: 1 }, ctx, 'x.json'), /x\.json: Figma 노드 JSON 형식/);
});

test('lint:figma 는 06-figma/nodes/ 를 검사하고 문제가 있으면 종료 코드 1', (t) => {
  const { root, write } = makeProject(t);
  FILL['design-system'](write);
  const cli = (...args) => spawnSync(process.execPath, [BIN, 'lint:figma', ...args], { cwd: root, encoding: 'utf8' });

  let r = cli();
  assert.equal(r.status, 1);
  assert.match(r.stderr, /06-figma\/nodes\/ 에 내보내세요/);

  write('06-figma/nodes/S01.json', JSON.stringify({ nodes: { '1:1': { document: { id: '1:1', name: 'S01', type: 'FRAME', fills: [solid('#1a73e8')] } } } }));
  r = cli();
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /노드 파일 1개, 문제 없음/);

  write('06-figma/nodes/S02.json', JSON.stringify({ id: '2:1', name: 'S02', type: 'TEXT', characters: '오류가 발생했습니다', style: { fontSize: 16 } }));
  r = cli();
  assert.equal(r.status, 1);
  assert.match(r.stdout, /work\/demo\/06-figma\/nodes\/S02\.json {2}2:1 S02 {2}\[문구\] 금지 문구 "오류가 발생했습니다" — 원인과 할 일을 적는다/);
  assert.match(r.stdout, /노드 파일 2개, 문제 1건/);

  r = cli('--json', 'work/demo/06-figma/nodes/S02.json');
  assert.equal(JSON.parse(r.stdout).total, 1);
});
