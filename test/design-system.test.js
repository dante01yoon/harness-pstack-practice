import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { normalizeColor, lengthToPx, validateTokens, validateComponents, validateCopy, forbiddenPhrases } from '../lib/design-system.js';
import { writeDesignMd, renderDesignMd, cssVarName } from '../lib/design-md.js';
import { check } from '../lib/check.js';
import { HarnessError } from '../lib/errors.js';
import { makeProject, openStage, FILL, TOKENS, COMPONENTS, COPY } from './helpers.js';

const json = (v) => JSON.stringify(v, null, 2);
const stageOf = (result, id) => result.stages.find((s) => s.id === id);

test('색 표기를 #rrggbbaa 로 맞춘다', () => {
  assert.equal(normalizeColor('#1A73E8'), '#1a73e8ff');
  assert.equal(normalizeColor('#fff'), '#ffffffff');
  assert.equal(normalizeColor('#0008'), '#00000088');
  assert.equal(normalizeColor('rgb(255, 0, 0)'), '#ff0000ff');
  assert.equal(normalizeColor('rgba(255,0,0,0.5)'), '#ff000080');
  assert.equal(normalizeColor('rgb(255 0 0 / 50%)'), '#ff000080');
  assert.equal(normalizeColor('hsl(0, 100%, 50%)'), '#ff0000ff');
  assert.equal(normalizeColor('hsl(120 100% 25%)'), '#008000ff');
  assert.equal(normalizeColor('red'), null);
  assert.equal(normalizeColor('#12345'), null);
});

test('길이를 px 로 바꾼다', () => {
  assert.equal(lengthToPx('16px'), 16);
  assert.equal(lengthToPx('1.5rem'), 24);
  assert.equal(lengthToPx('12pt'), 16);
  assert.equal(lengthToPx(12), 12);
  assert.equal(lengthToPx('20'), 20);
  assert.equal(lengthToPx('1em'), null);
  assert.equal(lengthToPx('auto'), null);
});

test('tokens.json 스키마 검사', () => {
  assert.deepEqual(validateTokens(TOKENS), []);
  assert.deepEqual(validateTokens({ color: { a: 'red' }, spacing: { s: 'big' }, colour: {} }), [
    '"fontSize" 그룹이 없습니다',
    'color.a: 색으로 해석할 수 없습니다 ("red")',
    'spacing.s: px·rem·pt 길이나 숫자여야 합니다 ("big")',
    '알 수 없는 그룹 "colour" (가능한 값: color, fontSize, fontFamily, fontWeight, lineHeight, spacing, radius, shadow)',
  ]);
  assert.deepEqual(validateTokens([]), ['최상위가 객체여야 합니다']);
});

test('components.json, copy.json 스키마 검사', () => {
  assert.deepEqual(validateComponents(COMPONENTS), []);
  assert.deepEqual(validateComponents({ Button: { variants: [] } }), [
    'Button.description: 설명이 없습니다',
    'Button.variants: 상태(variant) 목록이 없습니다',
  ]);
  assert.deepEqual(validateCopy(COPY), []);
  assert.deepEqual(validateCopy({ terms: [{ use: '로그인' }], banned: [3], extra: 1 }), [
    '알 수 없는 키 "extra" (가능한 값: terms, banned, messages)',
    'terms[0].avoid: 피할 용어 문자열 목록이어야 합니다',
    'banned[0]: 문자열이나 { "phrase": ... } 여야 합니다',
  ]);
});

test('금지 문구에는 banned 와 terms.avoid 가 모두 들어간다', () => {
  assert.deepEqual(forbiddenPhrases(COPY), [
    { phrase: '클릭하세요' },
    { phrase: '오류가 발생했습니다', reason: '원인과 할 일을 적는다' },
    { phrase: '사인인', use: '로그인' },
    { phrase: '로그온', use: '로그인' },
  ]);
});

test('design-md 는 세 JSON 으로 DESIGN.md 를 만든다', (t) => {
  const { dir, write } = makeProject(t);
  openStage(dir, write, 'design-system');
  write('05-design-system/tokens.json', json(TOKENS));
  write('05-design-system/components.json', json(COMPONENTS));
  write('05-design-system/copy.json', json(COPY));
  const r = writeDesignMd(dir);
  assert.equal(r.path, '05-design-system/DESIGN.md');
  const md = readFileSync(join(dir, '05-design-system/DESIGN.md'), 'utf8');
  assert.match(md, /### 색 \(`color`\)/);
  assert.match(md, /\| `primary` \| `#1A73E8` \| `--color-primary` \|/);
  assert.match(md, /\| `title` \| `1.5rem` \| `--font-size-title` \|/);
  assert.match(md, /\| \*\*Button\*\* \| 주요 동작 \| default, hover, disabled \|/);
  assert.match(md, /\| 로그인 \| 사인인, 로그온 \|/);
  assert.match(md, /\| 오류가 발생했습니다 \| 원인과 할 일을 적는다 \|/);
  assert.match(md, /\| `login.failed` \| 이메일 또는 비밀번호가 맞지 않아요 \|/);
  assert.doesNotMatch(md, /그림자/);
  assert.equal(md, renderDesignMd({ tokens: TOKENS, components: COMPONENTS, copy: COPY }));
});

test('cssVarName 은 그룹과 이름을 kebab-case 로', () => {
  assert.equal(cssVarName('fontSize', 'bodyLarge'), '--font-size-body-large');
  assert.equal(cssVarName('color', 'gray.100'), '--color-gray-100');
});

test('design-md 는 문제를 모아 알려주고 파일을 쓰지 않는다', (t) => {
  const { dir, write } = makeProject(t);
  openStage(dir, write, 'design-system');
  write('05-design-system/tokens.json', json({ color: { a: 'nope' }, fontSize: { b: '16px' } }));
  write('05-design-system/copy.json', '{ broken');
  assert.throws(
    () => writeDesignMd(dir),
    (err) =>
      err instanceof HarnessError &&
      /tokens\.json: color\.a: 색으로 해석할 수 없습니다/.test(err.message) &&
      /components\.json 없음/.test(err.message) &&
      /copy\.json JSON 형식 오류/.test(err.message),
  );
  assert.throws(() => readFileSync(join(dir, '05-design-system/DESIGN.md')), { code: 'ENOENT' });
});

test('design-md 는 와이어프레임 승인 전에는 쓰지 않는다', (t) => {
  const { dir, write } = makeProject(t);
  FILL['design-system'](write);
  assert.throws(() => writeDesignMd(dir), /앞 단계가 끝나지 않아 DESIGN\.md 를 만들 수 없습니다: PRD\(prd\)/);
});

test('check 는 스키마 오류와 DESIGN.md 불일치를 디자인 시스템 단계의 빠진 것으로 본다', (t) => {
  const { dir, write } = makeProject(t);
  FILL['design-system'](write);
  assert.deepEqual(stageOf(check(dir), 'design-system').missing, []);

  write('05-design-system/tokens.json', json({ ...TOKENS, color: { ...TOKENS.color, accent: '#f80' } }));
  assert.deepEqual(stageOf(check(dir), 'design-system').missing, [
    '05-design-system/DESIGN.md 이 JSON 내용과 다름 — design-harness design-md 로 다시 만드세요',
  ]);

  write('05-design-system/components.json', json({ Button: {} }));
  assert.deepEqual(stageOf(check(dir), 'design-system').missing, [
    '05-design-system/components.json: Button.description: 설명이 없습니다',
    '05-design-system/components.json: Button.variants: 상태(variant) 목록이 없습니다',
  ]);
});
