import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { approve, isoWithOffset } from '../lib/approve.js';
import { HarnessError } from '../lib/errors.js';
import { makeProject, FILL } from './helpers.js';

const readApprovals = (dir) => JSON.parse(readFileSync(join(dir, 'approvals.json'), 'utf8'));
const sha = (s) => 'sha256:' + createHash('sha256').update(s).digest('hex');

test('승인하면 approvals.json에 승인자·시각·파일별 해시·메모를 남긴다', (t) => {
  const { dir, write } = makeProject(t);
  write('01-prd/prd.md', 'PRD\n');
  write('01-prd/open-questions.md', '없음\n');
  approve(dir, 'prd', { by: ' 홍길동 ', note: '범위 확정', now: new Date('2026-10-27T06:00:00Z') });
  const data = readApprovals(dir);
  assert.equal(data.version, 1);
  const rec = data.approvals.prd;
  assert.equal(rec.by, '홍길동');
  assert.equal(rec.note, '범위 확정');
  assert.equal(rec.at, isoWithOffset(new Date('2026-10-27T06:00:00Z')));
  assert.deepEqual(rec.files, { 'open-questions.md': sha('없음\n'), 'prd.md': sha('PRD\n') });
  assert.match(rec.hash, /^sha256:[0-9a-f]{64}$/);
});

test('하위 폴더 파일도 해시에 포함한다', (t) => {
  const { dir, write } = makeProject(t);
  for (const id of ['prd', 'research', 'ia', 'wireframe', 'design-system', 'figma', 'verify', 'handoff']) {
    FILL[id](write);
    if (!['research', 'figma'].includes(id)) approve(dir, id, { by: 'PM' });
  }
  assert.deepEqual(Object.keys(readApprovals(dir).approvals.handoff.files), [
    'handoff.md',
    'specs/S01.md',
    'tokens/tokens.css',
  ]);
});

test('재승인하면 기록을 새로 덮어쓰고 다른 단계 기록은 유지한다', (t) => {
  const { dir, write } = makeProject(t);
  FILL.prd(write);
  approve(dir, 'prd', { by: '홍길동' });
  FILL.research(write);
  FILL.ia(write);
  approve(dir, 'ia', { by: '김디자' });
  write('01-prd/prd.md', '바뀜\n');
  approve(dir, 'prd', { by: '이피엠' });
  const data = readApprovals(dir);
  assert.equal(data.approvals.prd.by, '이피엠');
  assert.equal(data.approvals.prd.files['prd.md'], sha('바뀜\n'));
  assert.equal(data.approvals.ia.by, '김디자');
});

test('단계 번호로도 승인할 수 있다', (t) => {
  const { dir, write } = makeProject(t);
  FILL.prd(write);
  assert.equal(approve(dir, '1', { by: '홍길동' }).stage, 'prd');
});

test('승인을 거부하는 경우', async (t) => {
  const { dir, write } = makeProject(t);
  const rejects = (stage, opts, pattern) =>
    assert.throws(() => approve(dir, stage, opts), (err) => err instanceof HarnessError && pattern.test(err.message));

  await t.test('알 수 없는 단계', () => rejects('nope', { by: 'a' }, /알 수 없는 단계/));
  await t.test('승인이 필요 없는 단계', () => rejects('research', { by: 'a' }, /승인이 필요하지 않습니다/));
  await t.test('승인자 없음', () => {
    FILL.prd(write);
    rejects('prd', {}, /--by/);
    rejects('prd', { by: '   ' }, /--by/);
  });
  await t.test('산출물 누락', () => {
    write('01-prd/open-questions.md', '');
    rejects('prd', { by: 'a' }, /open-questions\.md 비어 있음/);
    FILL.prd(write);
  });
  await t.test('앞 단계 미완료', () => {
    FILL.ia(write);
    rejects('ia', { by: 'a' }, /앞 단계가 끝나지 않아.*PRD\(prd\).*리서치\(research\)/);
  });
  await t.test('거부되면 approvals.json을 만들지 않는다', () => {
    assert.throws(() => readApprovals(dir), { code: 'ENOENT' });
  });
});

test('approvals.json이 깨져 있으면 덮어쓰지 않고 알려준다', (t) => {
  const { dir, write } = makeProject(t);
  FILL.prd(write);
  writeFileSync(join(dir, 'approvals.json'), '{ broken');
  assert.throws(() => approve(dir, 'prd', { by: 'a' }), /approvals\.json을 읽을 수 없습니다/);
  assert.equal(readFileSync(join(dir, 'approvals.json'), 'utf8'), '{ broken');
});

test('isoWithOffset 은 로컬 오프셋을 붙인다', () => {
  assert.match(isoWithOffset(new Date()), /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d[+-]\d\d:\d\d$/);
});
