#!/usr/bin/env node
// Stop 훅: 답을 끝낼 때 design-harness check 를 돌려 프로젝트마다 현재 단계와 빠진 것을 사람에게 보여 준다.
// 답을 막지는 않는다(승인 대기처럼 멈추는 것이 정상인 때가 많다). work/ 가 없으면 아무것도 하지 않는다.
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { basename, join } from 'node:path';
import { check } from '../lib/check.js';
import { findStage, stageNumber } from '../lib/stages.js';

const MAX_ITEMS = 5;

export function summarize(name, result) {
  const invalid = result.stages.filter((s) => s.status === 'approval_invalid');
  const current = result.stages.find((s) => s.id === result.currentStage);
  const lines = [];
  if (!current) lines.push(`${name}: 모든 단계 완료`);
  else {
    const waiting = current.status === 'done' && current.needsApproval;
    lines.push(`${name}: ${stageNumber(findStage(current.id))}. ${current.title}(${current.id}) ${waiting ? '— 사람 승인 대기' : '진행 중'}`);
    const items = waiting ? [`승인: ! design-harness approve ${current.id} --by <이름>`] : current.missing;
    for (const item of items.slice(0, MAX_ITEMS)) lines.push(`  - ${item}`);
    if (items.length > MAX_ITEMS) lines.push(`  - 외 ${items.length - MAX_ITEMS}건 (design-harness check)`);
  }
  for (const s of invalid) lines.push(`  ! ${s.title}(${s.id}) 승인 무효 — 승인 뒤 산출물이 바뀜, 재승인 필요`);
  return lines.join('\n');
}

export function stopMessage(root) {
  const workDir = join(root, 'work');
  if (!existsSync(workDir)) return null;
  const names = readdirSync(workDir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();
  if (names.length === 0) return null;
  const parts = names.map((name) => {
    try {
      return summarize(name, check(join(workDir, name)));
    } catch (err) {
      return `${name}: check 실패 — ${err.message}`;
    }
  });
  return `design-harness check\n${parts.join('\n')}`;
}

function main() {
  let input = {};
  try {
    input = JSON.parse(readFileSync(0, 'utf8'));
  } catch {
    // 입력이 없어도 현재 폴더 기준으로 본다
  }
  const message = stopMessage(input.cwd ?? process.cwd());
  if (message) process.stdout.write(JSON.stringify({ systemMessage: message }));
}

if (process.argv[1] && import.meta.url.endsWith(basename(process.argv[1]))) main();
