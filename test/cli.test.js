import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { makeProject, FILL } from './helpers.js';

const BIN = fileURLToPath(new URL('../bin/design-harness.js', import.meta.url));
const run = (args, cwd) => spawnSync(process.execPath, [BIN, ...args], { cwd, encoding: 'utf8' });

test('check 는 현재 단계와 빠진 것을 보여준다', (t) => {
  const { root, write } = makeProject(t);
  write('01-prd/prd.md');
  const r = run(['check'], root);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /프로젝트: demo/);
  assert.match(r.stdout, /현재 단계: 1\. PRD \(prd\)/);
  assert.match(r.stdout, /▶ 1\. PRD \(prd\): 진행 중/);
  assert.match(r.stdout, /- 01-prd\/open-questions\.md 없음/);
  assert.match(r.stdout, /사람 승인 필요: design-harness approve prd --by <이름>/);
});

test('approve 후 check, 파일 변경 후 승인 무효 표시', (t) => {
  const { root, dir, write } = makeProject(t);
  FILL.prd(write);
  let r = run(['approve', 'prd', '--by', '홍길동', '--note', '확정'], root);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /1\. PRD \(prd\) 승인 기록: 홍길동/);
  assert.ok(existsSync(join(dir, 'approvals.json')));

  r = run(['check'], root);
  assert.match(r.stdout, /1\. PRD \(prd\): 승인됨 — 홍길동/);
  assert.match(r.stdout, /현재 단계: 2\. 리서치 \(research\)/);

  write('01-prd/prd.md', '바뀜\n');
  r = run(['check'], root);
  assert.match(r.stdout, /▶ 1\. PRD \(prd\): 승인 무효 \(재승인 필요\)/);
  assert.match(r.stdout, /변경: 01-prd\/prd\.md/);
});

test('check --json', (t) => {
  const { root } = makeProject(t);
  const r = run(['check', '--json'], root);
  const data = JSON.parse(r.stdout);
  assert.equal(data.project, 'demo');
  assert.equal(data.currentStage, 'prd');
  assert.equal(data.stages.length, 8);
});

test('승인 거부는 종료 코드 1과 오류 메시지', (t) => {
  const { root } = makeProject(t);
  const r = run(['approve', 'prd'], root);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /오류: 승인한 사람을 --by/);
});

test('프로젝트 지정과 탐색', async (t) => {
  const { root } = makeProject(t, 'alpha');
  mkdirSync(join(root, 'work', 'beta'));

  await t.test('여러 개면 --project 를 요구한다', () => {
    const r = run(['check'], root);
    assert.equal(r.status, 1);
    assert.match(r.stderr, /--project 로 지정하세요: alpha, beta/);
  });
  await t.test('--project 와 --root', () => {
    const r = run(['check', '--project', 'beta', '--root', root], '/');
    assert.equal(r.status, 0, r.stderr);
    assert.match(r.stdout, /프로젝트: beta/);
  });
  await t.test('없는 프로젝트', () => {
    const r = run(['check', '--project', 'gamma'], root);
    assert.equal(r.status, 1);
    assert.match(r.stderr, /work\/gamma\//);
  });
});

test('잘못된 사용', (t) => {
  const { root } = makeProject(t);
  assert.equal(run([], root).status, 2);
  assert.equal(run(['--help'], root).status, 0);
  const unknown = run(['frobnicate'], root);
  assert.equal(unknown.status, 1);
  assert.match(unknown.stderr, /알 수 없는 명령/);
  const badFlag = run(['check', '--bogus'], root);
  assert.equal(badFlag.status, 1);
  assert.match(badFlag.stderr, /오류:/);
});
