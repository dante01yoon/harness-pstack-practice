import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { writeHandoff, renderTokensCss } from '../lib/handoff.js';
import { review } from '../lib/review.js';
import { approve } from '../lib/approve.js';
import { check } from '../lib/check.js';
import { makeProject, openStage, TOKENS } from './helpers.js';

const BIN = fileURLToPath(new URL('../bin/design-harness.js', import.meta.url));
const stageOf = (result, id) => result.stages.find((s) => s.id === id);

test('tokens.css 는 토큰을 CSS 변수로, 숫자 길이에는 px 를 붙인다', () => {
  assert.equal(
    renderTokensCss(TOKENS),
    `/* design-harness handoff 로 05-design-system/tokens.json 에서 만든 파일 */
:root {
  --color-primary: #1A73E8;
  --color-text: #111;
  --color-bg: rgb(255, 255, 255);
  --font-size-body: 16px;
  --font-size-title: 1.5rem;
  --font-size-caption: 12px;
  --spacing-md: 16px;
  --radius-sm: 4px;
}
`,
  );
});

test('handoff 는 HANDOFF.md 와 토큰 내보내기를 만들고, 스펙이 갖춰지면 승인할 수 있다', (t) => {
  const { dir, write } = makeProject(t);
  openStage(dir, write, 'handoff');
  write('04-wireframe/S02.md', '# S02 설정\n');
  write('04-wireframe/S02.svg', '<svg/>');
  approve(dir, 'wireframe', { by: '홍길동' });
  review(dir, 'wireframe', { by: '김디자', score: 4 });
  review(dir, 'design-system', { by: '김디자', score: 5 });
  write('05-design-system/principles.md', '바뀐 원칙\n');
  approve(dir, 'design-system', { by: '홍길동' });
  write('08-handoff/specs/S01.md', 'S01 스펙\n');

  const r = writeHandoff(dir, { project: 'demo', now: new Date('2026-10-27T06:00:00Z') });
  assert.deepEqual(r.files, ['08-handoff/HANDOFF.md', '08-handoff/tokens/tokens.css', '08-handoff/tokens/tokens.json']);
  assert.deepEqual(r.missingSpecs, ['S02']);
  const md = readFileSync(join(dir, '08-handoff/HANDOFF.md'), 'utf8');
  assert.match(md, /^# 핸드오프: demo/);
  assert.match(md, /\| 1\. PRD \| 승인됨 \| 홍길동, .+ \| - \|/);
  assert.match(md, /\| 2\. 리서치 \| 완료 \| 필요 없음 \| - \|/);
  assert.match(md, /\| 4\. 와이어프레임 \| 승인됨 \| 홍길동, .+ \| 4 \/ 5 \(1건\) \|/);
  assert.match(md, /\| 5\. 디자인 시스템 \| 승인됨 \| 홍길동, .+ \| - \|/);
  assert.match(md, /\| 8\. 핸드오프 \| 이 문서 \| - \| - \|/);
  assert.match(md, /\| S01 \|  \| \[S01\.svg\]\(\.\.\/04-wireframe\/S01\.svg\) \| \[specs\/S01\.md\]\(specs\/S01\.md\) \|/);
  assert.match(md, /\| S02 \| S02 설정 \| \[S02\.svg\]\(\.\.\/04-wireframe\/S02\.svg\) \| \*\*없음\*\* \|/);
  assert.match(md, /컴포넌트 2개: Button, TextField/);
  assert.match(md, /## 남은 일\n\n- specs\/S02\.md 작성\n- 5\. 디자인 시스템: 검토 1건 뒤 산출물이 바뀜/);
  assert.deepEqual(JSON.parse(readFileSync(join(dir, '08-handoff/tokens/tokens.json'), 'utf8')), TOKENS);

  assert.deepEqual(stageOf(check(dir), 'handoff').missing, ['08-handoff/specs/S02.md 없음']);
  write('08-handoff/specs/S02.md', '  \n');
  assert.deepEqual(stageOf(check(dir), 'handoff').missing, ['08-handoff/specs/S02.md 비어 있음']);
  write('08-handoff/specs/S02.md', 'S02 스펙\n');
  writeHandoff(dir, { project: 'demo' });
  approve(dir, 'handoff', { by: '홍길동' });
  assert.equal(check(dir).currentStage, null);
});

test('검증 승인 전에는 만들지 않는다 (CLI)', (t) => {
  const { root, dir, write } = makeProject(t);
  openStage(dir, write, 'verify');
  const r = spawnSync(process.execPath, [BIN, 'handoff'], { cwd: root, encoding: 'utf8' });
  assert.equal(r.status, 1);
  assert.match(r.stderr, /오류: 앞 단계가 끝나지 않아 핸드오프 문서를 만들 수 없습니다: 검증\(verify\)/);
});
