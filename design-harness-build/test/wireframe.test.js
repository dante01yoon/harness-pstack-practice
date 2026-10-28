import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { parseWireframe, renderWireframeSvg, drawWireframes } from '../lib/wireframe.js';
import { check } from '../lib/check.js';
import { makeProject, openStage } from './helpers.js';

const LOGIN = `# S01 로그인

설명 문단은 무시한다.

## 레이아웃
- header: 로그인
- input: 이메일
- input: 비밀번호
- button: 로그인 <확인>
- divider
- link: 비밀번호 찾기

## 상태: 오류
- header: 로그인
- alert: 이메일 또는 비밀번호가 맞지 않아요

## 메모
- 이 목록은 무시한다
`;

test('md 의 레이아웃과 상태 절을 읽는다', () => {
  const wf = parseWireframe(LOGIN, 'S01');
  assert.deepEqual(wf.errors, []);
  assert.equal(wf.title, 'S01 로그인');
  assert.deepEqual(wf.states.map((s) => s.name), ['기본', '오류']);
  assert.deepEqual(wf.states[0].items[4], { kind: 'divider', label: '' });
  assert.deepEqual(wf.states[1].items[1], { kind: 'alert', label: '이메일 또는 비밀번호가 맞지 않아요' });
});

test('형식 오류는 줄 번호와 함께 모은다', () => {
  const wf = parseWireframe('# X\n## 레이아웃\n- buton: 확인\n- 그냥 글\n## 상태: 빈\n', 'S09');
  assert.deepEqual(wf.errors, [
    'S09.md:3 알 수 없는 요소 "buton" (가능한 값: header, tabbar, title, text, input, button, link, image, card, list, alert, empty, loading, divider, spacer)',
    'S09.md:4 "종류: 내용" 형식이 아닙니다',
    'S09.md 의 "기본" 상태에 요소가 없습니다',
    'S09.md 의 "빈" 상태에 요소가 없습니다',
  ]);
  assert.deepEqual(parseWireframe('# X\n- button: a\n', 'S10').errors, ['S10.md 에 "## 레이아웃" 절이 없습니다']);
});

test('SVG 는 상태마다 프레임을 나란히 그리고 글자를 이스케이프한다', () => {
  const svg = renderWireframeSvg(parseWireframe(LOGIN, 'S01'));
  assert.match(svg, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" width="800" height="708"/);
  assert.match(svg, /<title>S01 로그인<\/title>/);
  assert.equal(svg.match(/<g>/g).length, 2);
  assert.match(svg, />기본<\/text>/);
  assert.match(svg, />오류<\/text>/);
  assert.match(svg, /로그인 &lt;확인&gt;/);
  assert.doesNotMatch(svg, /이 목록은 무시한다/);
  assert.equal(svg, renderWireframeSvg(parseWireframe(LOGIN, 'S01')));
});

test('header 아래에는 여백을 두고 tabbar 는 프레임 바닥에 붙인다', () => {
  const svg = renderWireframeSvg(parseWireframe('# T\n## 레이아웃\n- header: 위\n- tabbar: 아래\n- button: 확인\n', 'T'));
  // 프레임은 y=48 에서 시작, 높이 640. header 56 다음 여백 16 → 버튼 y=120, tabbar 는 48+640-56=632
  assert.match(svg, /<rect x="20" y="48" width="360" height="56" fill="#ddd"\/>/);
  assert.match(svg, /<rect x="36" y="120" width="328" height="48" rx="8" fill="#555"\/>/);
  assert.match(svg, /<rect x="20" y="632" width="360" height="56" fill="#ddd"\/>/);
});

test('wireframe 은 모든 화면 md 를 svg 로 그리고 check 를 통과한다', (t) => {
  const { dir, write } = makeProject(t);
  openStage(dir, write, 'wireframe');
  write('04-wireframe/S01.md', LOGIN);
  write('04-wireframe/S02.md', '# S02 홈\n## 레이아웃\n- header: 홈\n- list: 최근 항목\n- tabbar\n## 상태: 빈 상태\n- empty: 아직 항목이 없어요\n');
  write('04-wireframe/changelog.md', '되돌아간 기록\n');
  const result = drawWireframes(dir);
  assert.deepEqual(result, [
    { id: 'S01', file: '04-wireframe/S01.svg', states: ['기본', '오류'] },
    { id: 'S02', file: '04-wireframe/S02.svg', states: ['기본', '빈 상태'] },
  ]);
  assert.ok(!existsSync(join(dir, '04-wireframe/changelog.svg')));
  assert.deepEqual(check(dir).stages.find((s) => s.id === 'wireframe').missing, []);
});

test('화면을 지정하면 그 화면만, md 가 하나라도 틀리면 아무것도 쓰지 않는다', (t) => {
  const { dir, write } = makeProject(t);
  openStage(dir, write, 'wireframe');
  write('04-wireframe/S01.md', LOGIN);
  write('04-wireframe/S02.md', '# S02\n## 레이아웃\n- bogus: x\n');
  assert.deepEqual(drawWireframes(dir, ['S01']).map((w) => w.id), ['S01']);
  assert.throws(() => drawWireframes(dir, ['S03']), /화면 md 가 없습니다: 04-wireframe\/S03\.md/);
  write('04-wireframe/S01.md', LOGIN.replace('로그인 <확인>', '바뀜'));
  assert.throws(() => drawWireframes(dir), /S02\.md:3 알 수 없는 요소 "bogus"/);
  assert.match(readFileSync(join(dir, '04-wireframe/S01.svg'), 'utf8'), /로그인 &lt;확인&gt;/);
});

test('화면 구조 승인 전에는 그리지 않는다', (t) => {
  const { dir, write } = makeProject(t);
  write('04-wireframe/S01.md', LOGIN);
  assert.throws(() => drawWireframes(dir), /앞 단계가 끝나지 않아 와이어프레임을 그릴 수 없습니다: PRD\(prd\), 리서치\(research\), 화면 구조\(ia\)/);
});
