import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { review, summarize } from '../lib/review.js';
import { isoWithOffset } from '../lib/approve.js';
import { check } from '../lib/check.js';
import { makeProject, FILL } from './helpers.js';

const BIN = fileURLToPath(new URL('../bin/design-harness.js', import.meta.url));

test('검토 점수를 reviews.json 에 쌓고, 산출물이 바뀌면 평균에서 뺀다', (t) => {
  const { dir, write } = makeProject(t);
  FILL.prd(write);
  const at = new Date('2026-10-27T06:00:00Z');
  let r = review(dir, 'prd', { by: ' 김디자 ', score: '4', note: '흐름 좋음', now: at });
  assert.equal(r.count, 1);
  assert.equal(r.average, 4);
  r = review(dir, '1', { by: '이피엠', score: 5 });
  assert.equal(r.average, 4.5);

  const data = JSON.parse(readFileSync(join(dir, 'reviews.json'), 'utf8'));
  assert.equal(data.reviews.length, 2);
  assert.deepEqual(
    { ...data.reviews[0], hash: undefined },
    { stage: 'prd', by: '김디자', at: isoWithOffset(at), score: 4, note: '흐름 좋음', hash: undefined },
  );

  write('01-prd/prd.md', '바뀜\n');
  const s = summarize(dir, 'prd');
  assert.equal(s.count, 0);
  assert.equal(s.average, null);
  assert.deepEqual(s.reviews.map((x) => x.stale), [true, true]);
  assert.equal(check(dir).stages[0].status, 'done', '검토는 승인 해시나 단계 상태에 영향이 없다');
});

test('검토를 거부하는 경우', (t) => {
  const { dir, write } = makeProject(t);
  assert.throws(() => review(dir, 'nope', { by: 'a', score: 3 }), /알 수 없는 단계/);
  assert.throws(() => review(dir, 'prd', { score: 3 }), /--by/);
  for (const score of [undefined, '0', '6', '3.5', 'abc']) {
    assert.throws(() => review(dir, 'prd', { by: 'a', score }), /점수는 1~5 사이 정수/);
  }
  assert.throws(() => review(dir, 'prd', { by: 'a', score: 3 }), /검토할 산출물이 없습니다/);
  FILL.prd(write);
  write('reviews.json', '{}');
  assert.throws(() => review(dir, 'prd', { by: 'a', score: 3 }), /reviews 배열 없음/);
});

test('review CLI', (t) => {
  const { root, write } = makeProject(t);
  FILL.research(write);
  let r = spawnSync(process.execPath, [BIN, 'review', 'research', '--by', '홍길동', '--score', '3'], { cwd: root, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /2\. 리서치 \(research\) 검토 기록: 홍길동, 3점/);
  assert.match(r.stdout, /현재 산출물 검토 1건, 평균 3점/);
  r = spawnSync(process.execPath, [BIN, 'review', 'research', '--by', '홍길동'], { cwd: root, encoding: 'utf8' });
  assert.equal(r.status, 1);
  assert.match(r.stderr, /오류: 점수는 1~5/);
});
