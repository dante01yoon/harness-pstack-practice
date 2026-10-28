import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileKeysInText, fileKeysInInput, isFigmaWrite, readFigmaTarget } from '../lib/figma.js';
import { decide } from '../scripts/guard-figma.js';
import { reminder } from '../scripts/figma-written.js';
import { stopMessage } from '../scripts/stop-check.js';
import { approve } from '../lib/approve.js';
import { makeProject, openStage, FILL, FIGMA_KEY, FIGMA_URL } from './helpers.js';

const script = (name) => fileURLToPath(new URL(`../scripts/${name}`, import.meta.url));
const run = (name, input) => spawnSync(process.execPath, [script(name)], { input: JSON.stringify(input), encoding: 'utf8' });
const WRITE_TOOL = 'mcp__plugin_figma_figma__use_figma';
const call = (root, tool_input, tool_name = WRITE_TOOL) => decide({ tool_name, tool_input, cwd: root });

test('Figma URL 에서 파일 키를 뽑고, 브랜치 URL 은 브랜치 키를 쓴다', () => {
  assert.deepEqual(fileKeysInText(`보세요 ${FIGMA_URL}?node-id=1-2`), [FIGMA_KEY]);
  assert.deepEqual(fileKeysInText('https://www.figma.com/design/MainKey12345/branch/BranchKey678/Demo'), ['BranchKey678']);
  assert.deepEqual(fileKeysInInput({ fileKey: FIGMA_KEY, code: 'figma.currentPage' }), [FIGMA_KEY]);
  assert.deepEqual(fileKeysInInput({ args: { url: FIGMA_URL } }), [FIGMA_KEY]);
  assert.deepEqual(fileKeysInInput({ nodeId: '1:2' }), []);
});

test('읽기 도구와 Figma 아닌 도구는 쓰기로 보지 않는다', () => {
  assert.equal(isFigmaWrite('mcp__figma__get_design_context'), false);
  assert.equal(isFigmaWrite('mcp__figma__getNode'), false);
  assert.equal(isFigmaWrite('mcp__figma__whoami'), false);
  assert.equal(isFigmaWrite('mcp__github__create_issue'), false);
  assert.equal(isFigmaWrite('Write'), false);
  assert.equal(isFigmaWrite(WRITE_TOOL), true);
  assert.equal(isFigmaWrite('mcp__TalkToFigma__set_fill_color'), true);
});

test('figma.json 은 fileUrl 이나 fileKey 로 대상을 적는다', (t) => {
  const { dir, write } = makeProject(t);
  assert.equal(readFigmaTarget(dir), null);
  write('06-figma/figma.json', JSON.stringify({ fileUrl: FIGMA_URL }));
  assert.equal(readFigmaTarget(dir).fileKey, FIGMA_KEY);
  write('06-figma/figma.json', JSON.stringify({ fileKey: 'Other123456', fileUrl: FIGMA_URL }));
  assert.match(readFigmaTarget(dir).error, /다릅니다/);
  write('06-figma/figma.json', '{}');
  assert.match(readFigmaTarget(dir).error, /fileUrl/);
});

test('디자인 시스템 승인 뒤 figma.json 의 파일에 쓰는 것만 통과', (t) => {
  const { root, dir, write } = makeProject(t);
  openStage(dir, write, 'figma');
  write('06-figma/figma.json', JSON.stringify({ fileUrl: FIGMA_URL }));
  assert.equal(call(root, { fileKey: FIGMA_KEY, code: '...' }), null);
  assert.equal(call(root, { fileUrl: `${FIGMA_URL}?node-id=3-4` }), null);
  assert.match(call(root, { fileKey: 'WrongKey12345' }), /대상 파일이 아니라[\s\S]*demo: AbCdEf/);
  assert.match(call(root, { code: 'figma.createFrame()' }), /알 수 없어/);
  assert.match(call(root, { fileKey: FIGMA_KEY, url: 'https://www.figma.com/design/WrongKey12345/x' }), /여러 개/);
  // 읽기 도구는 파일과 상관없이 통과
  assert.equal(call(root, { fileKey: 'WrongKey12345' }, 'mcp__figma__get_metadata'), null);
});

test('디자인 시스템이 승인되지 않았거나 승인이 무효면 막는다', (t) => {
  const { root, dir, write } = makeProject(t);
  openStage(dir, write, 'design-system');
  FILL['design-system'](write);
  write('06-figma/figma.json', JSON.stringify({ fileUrl: FIGMA_URL }));
  assert.match(call(root, { fileKey: FIGMA_KEY }), /디자인 시스템 승인 전[\s\S]*디자인 시스템\(design-system\)/);
  approve(dir, 'design-system', { by: '홍길동' });
  assert.equal(call(root, { fileKey: FIGMA_KEY }), null);
  write('05-design-system/principles.md', '바뀐 원칙\n');
  assert.match(call(root, { fileKey: FIGMA_KEY }), /열리지 않아/);
});

test('figma.json 이 없으면 막고, work/ 가 없는 폴더는 건드리지 않는다', (t) => {
  const { root, dir, write } = makeProject(t);
  openStage(dir, write, 'figma');
  assert.match(call(root, { fileKey: FIGMA_KEY }), /demo: 06-figma\/figma\.json 없음/);
  assert.equal(call(dir, { fileKey: FIGMA_KEY }), null);
});

test('여러 프로젝트면 파일 키가 맞는 프로젝트의 단계를 본다', (t) => {
  const { root, dir, write } = makeProject(t, 'a');
  openStage(dir, write, 'figma');
  write('06-figma/figma.json', JSON.stringify({ fileKey: 'ProjectAKey1' }));
  mkdirSync(join(root, 'work/b/06-figma'), { recursive: true });
  writeFileSync(join(root, 'work/b/06-figma/figma.json'), JSON.stringify({ fileKey: 'ProjectBKey1' }));
  assert.equal(call(root, { fileKey: 'ProjectAKey1' }), null);
  assert.match(call(root, { fileKey: 'ProjectBKey1' }), /work\/b\/ 의 피그마 단계가 아직 열리지 않아/);
});

test('훅으로 실행하면 deny 결정을 JSON 으로 낸다', (t) => {
  const { root } = makeProject(t);
  let r = run('guard-figma.js', { tool_name: WRITE_TOOL, tool_input: { fileKey: FIGMA_KEY }, cwd: root });
  assert.equal(r.status, 0, r.stderr);
  assert.equal(JSON.parse(r.stdout).hookSpecificOutput.permissionDecision, 'deny');
  r = run('guard-figma.js', { tool_name: 'mcp__figma__get_screenshot', tool_input: {}, cwd: root });
  assert.equal(r.stdout, '');
});

test('Figma 에 쓴 뒤 노드를 다시 내보내라고 알린다', () => {
  const text = reminder({ tool_name: WRITE_TOOL, tool_input: { fileKey: FIGMA_KEY, nodeId: '12:34' } });
  assert.match(text, new RegExp(`파일 ${FIGMA_KEY}, 노드 12:34`));
  assert.match(text, /06-figma\/nodes\/[\s\S]*lint:figma/);
  assert.equal(reminder({ tool_name: 'mcp__figma__get_metadata', tool_input: {} }), null);
  const r = run('figma-written.js', { tool_name: WRITE_TOOL, tool_input: { fileKey: FIGMA_KEY } });
  const out = JSON.parse(r.stdout).hookSpecificOutput;
  assert.equal(out.hookEventName, 'PostToolUse');
  assert.match(out.additionalContext, /다시 내보내고/);
});

test('답을 끝낼 때 check 결과를 요약해 보여 준다', (t) => {
  const { root, dir, write } = makeProject(t);
  assert.match(stopMessage(root), /demo: 1\. PRD\(prd\) 진행 중\n {2}- 01-prd\/prd\.md 없음/);
  FILL.prd(write);
  assert.match(stopMessage(root), /사람 승인 대기\n {2}- 승인: ! design-harness approve prd/);
  approve(dir, 'prd', { by: '홍길동' });
  write('01-prd/prd.md', '바뀜\n');
  assert.match(stopMessage(root), /! PRD\(prd\) 승인 무효/);
  assert.equal(stopMessage(dir), null);

  const r = run('stop-check.js', { cwd: root, stop_hook_active: false });
  assert.equal(r.status, 0, r.stderr);
  assert.match(JSON.parse(r.stdout).systemMessage, /^design-harness check\ndemo:/);
});
