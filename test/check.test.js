import { test } from 'node:test';
import assert from 'node:assert/strict';
import { unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { check } from '../lib/check.js';
import { approve } from '../lib/approve.js';
import { STAGES } from '../lib/stages.js';
import { makeProject, FILL } from './helpers.js';

const stageOf = (result, id) => result.stages.find((s) => s.id === id);

test('빈 프로젝트는 PRD 단계이고 PRD 파일이 빠졌다고 알려준다', (t) => {
  const { dir } = makeProject(t);
  const result = check(dir);
  assert.equal(result.currentStage, 'prd');
  const prd = stageOf(result, 'prd');
  assert.equal(prd.status, 'not_started');
  assert.deepEqual(prd.missing, ['01-prd/prd.md 없음', '01-prd/open-questions.md 없음']);
});

test('일부 파일만 있으면 진행 중, 빈 파일은 빠진 것으로 본다', (t) => {
  const { dir, write } = makeProject(t);
  write('01-prd/prd.md');
  write('01-prd/open-questions.md', '  \n');
  const prd = stageOf(check(dir), 'prd');
  assert.equal(prd.status, 'in_progress');
  assert.deepEqual(prd.missing, ['01-prd/open-questions.md 비어 있음']);
});

test('산출물이 갖춰져도 승인 전이면 그 단계에 머문다', (t) => {
  const { dir, write } = makeProject(t);
  FILL.prd(write);
  const result = check(dir);
  assert.equal(result.currentStage, 'prd');
  assert.equal(stageOf(result, 'prd').status, 'done');
  assert.equal(stageOf(result, 'prd').complete, false);
});

test('승인하면 다음 단계로, 승인이 필요 없는 단계는 산출물만으로 넘어간다', (t) => {
  const { dir, write } = makeProject(t);
  FILL.prd(write);
  approve(dir, 'prd', { by: '홍길동' });
  assert.equal(check(dir).currentStage, 'research');
  FILL.research(write);
  const result = check(dir);
  assert.equal(stageOf(result, 'research').status, 'done');
  assert.equal(result.currentStage, 'ia');
});

test('승인 뒤 파일이 바뀌면 승인이 풀리고 바뀐 파일을 알려준다', (t) => {
  const { dir, write } = makeProject(t);
  FILL.prd(write);
  approve(dir, 'prd', { by: '홍길동' });
  write('01-prd/prd.md', '수정된 내용\n');
  write('01-prd/extra.md');
  unlinkSync(join(dir, '01-prd/open-questions.md'));
  const result = check(dir);
  const prd = stageOf(result, 'prd');
  assert.equal(result.currentStage, 'prd');
  assert.equal(prd.status, 'approval_invalid');
  assert.equal(prd.approval.state, 'invalid');
  assert.deepEqual(prd.approval.changed, ['prd.md']);
  assert.deepEqual(prd.approval.added, ['extra.md']);
  assert.deepEqual(prd.approval.removed, ['open-questions.md']);
  assert.deepEqual(prd.missing, ['01-prd/open-questions.md 없음']);
});

test('같은 내용으로 되돌리면 승인이 다시 유효해진다', (t) => {
  const { dir, write } = makeProject(t);
  FILL.prd(write);
  approve(dir, 'prd', { by: '홍길동' });
  write('01-prd/prd.md', '다른 내용\n');
  assert.equal(stageOf(check(dir), 'prd').status, 'approval_invalid');
  write('01-prd/prd.md');
  assert.equal(stageOf(check(dir), 'prd').status, 'approved');
});

test('.DS_Store 는 해시 대상에서 빠진다', (t) => {
  const { dir, write } = makeProject(t);
  FILL.prd(write);
  approve(dir, 'prd', { by: '홍길동' });
  write('01-prd/.DS_Store', 'junk');
  assert.equal(stageOf(check(dir), 'prd').status, 'approved');
});

test('리서치 references/ 폴더가 비어 있으면 빠진 것으로 본다', (t) => {
  const { dir, write } = makeProject(t);
  write('02-research/research.md');
  write('02-research/insights.md');
  write('02-research/references/.DS_Store', '');
  assert.deepEqual(stageOf(check(dir), 'research').missing, ['02-research/references/ 폴더가 비어 있음']);
});

test('와이어프레임은 화면마다 md와 svg가 짝을 이뤄야 한다', (t) => {
  const { dir, write } = makeProject(t);
  assert.deepEqual(stageOf(check(dir), 'wireframe').missing, ['04-wireframe/<화면ID>.md, <화면ID>.svg 없음']);
  write('04-wireframe/S01.md');
  write('04-wireframe/S02.svg', '<svg/>');
  write('04-wireframe/changelog.md');
  assert.deepEqual(stageOf(check(dir), 'wireframe').missing, ['04-wireframe/S01.svg 없음', '04-wireframe/S02.md 없음']);
});

test('JSON 산출물이 깨져 있으면 형식 오류로 알려준다', (t) => {
  const { dir, write } = makeProject(t);
  write('05-design-system/tokens.json', '{ "color": ');
  const missing = stageOf(check(dir), 'design-system').missing;
  assert.match(missing[0], /^05-design-system\/tokens\.json JSON 형식 오류/);
});

test('모든 단계를 마치면 현재 단계는 null', (t) => {
  const { dir, write } = makeProject(t);
  for (const stage of STAGES) {
    FILL[stage.id](write);
    if (stage.approval) approve(dir, stage.id, { by: '홍길동' });
  }
  const result = check(dir);
  assert.equal(result.currentStage, null);
  assert.ok(result.stages.every((s) => s.complete));
});

test('앞 단계 승인이 풀리면 현재 단계가 그 단계로 돌아간다', (t) => {
  const { dir, write } = makeProject(t);
  FILL.prd(write);
  approve(dir, 'prd', { by: '홍길동' });
  FILL.research(write);
  FILL.ia(write);
  approve(dir, 'ia', { by: '홍길동' });
  assert.equal(check(dir).currentStage, 'wireframe');
  write('01-prd/prd.md', '요구사항 추가\n');
  const result = check(dir);
  assert.equal(result.currentStage, 'prd');
  assert.equal(stageOf(result, 'ia').status, 'approved');
});
