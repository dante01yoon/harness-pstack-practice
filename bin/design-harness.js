#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { resolveProject } from '../lib/project.js';
import { check } from '../lib/check.js';
import { approve } from '../lib/approve.js';
import { HarnessError } from '../lib/errors.js';
import { STAGES, findStage, stageNumber } from '../lib/stages.js';

const USAGE = `사용법:
  design-harness check [--project <이름>] [--root <경로>] [--json]
      지금 어느 단계인지, 무엇이 빠졌는지 판정한다.
  design-harness approve <단계> --by <이름> [--note <메모>] [--project <이름>] [--root <경로>]
      단계 산출물의 해시를 work/<프로젝트>/approvals.json 에 기록한다.
      승인 뒤 산출물이 바뀌면 승인은 무효가 된다.

  <단계>: ${STAGES.map((s, i) => `${i + 1}=${s.id}`).join(', ')}
  --root 기본값은 현재 폴더, --project 는 work/ 아래 프로젝트가 하나면 생략 가능.`;

const STATUS_LABEL = {
  not_started: '시작 전',
  in_progress: '진행 중',
  done: '완료',
  approved: '승인됨',
  approval_invalid: '승인 무효 (재승인 필요)',
};

function formatCheck(project, result) {
  const lines = [`프로젝트: ${project}`];
  const current = result.stages.find((s) => s.id === result.currentStage);
  lines.push(
    current
      ? `현재 단계: ${stageNumber(findStage(current.id))}. ${current.title} (${current.id})`
      : '현재 단계: 없음 — 모든 단계 완료',
  );
  lines.push('');
  for (const s of result.stages) {
    const mark = s.id === result.currentStage ? '▶' : ' ';
    let label = STATUS_LABEL[s.status];
    if (s.status === 'done' && s.needsApproval) label = '완료 (승인 대기)';
    if (s.status === 'approved') label += ` — ${s.approval.by}, ${s.approval.at}`;
    lines.push(`${mark} ${stageNumber(findStage(s.id))}. ${s.title} (${s.id}): ${label}`);
  }

  for (const s of result.stages) {
    const items = [...s.missing];
    if (s.approval.state === 'invalid') {
      items.push(`${s.approval.by}의 승인(${s.approval.at}) 뒤 산출물이 바뀜:`);
      for (const f of s.approval.changed) items.push(`    변경: ${s.dir}/${f}`);
      for (const f of s.approval.added) items.push(`    추가: ${s.dir}/${f}`);
      for (const f of s.approval.removed) items.push(`    삭제: ${s.dir}/${f}`);
    }
    if (s.id === result.currentStage && s.needsApproval && s.status !== 'approved') {
      items.push(`사람 승인 필요: design-harness approve ${s.id} --by <이름>`);
    }
    if (items.length === 0) continue;
    lines.push('', `${stageNumber(findStage(s.id))}. ${s.title}에서 빠진 것:`);
    for (const item of items) lines.push(item.startsWith('    ') ? item : `  - ${item}`);
  }
  return lines.join('\n');
}

function main(argv) {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      project: { type: 'string' },
      root: { type: 'string', default: process.cwd() },
      by: { type: 'string' },
      note: { type: 'string', default: '' },
      json: { type: 'boolean', default: false },
      help: { type: 'boolean', short: 'h', default: false },
    },
  });
  const [command, ...rest] = positionals;
  if (values.help || !command) {
    console.log(USAGE);
    return values.help ? 0 : 2;
  }

  if (command === 'check') {
    if (rest.length > 0) throw new HarnessError(`check 는 인자를 받지 않습니다: ${rest.join(' ')}`);
    const project = resolveProject(values.root, values.project);
    const result = check(project.dir);
    console.log(values.json ? JSON.stringify({ project: project.name, ...result }, null, 2) : formatCheck(project.name, result));
    return 0;
  }

  if (command === 'approve') {
    if (rest.length !== 1) throw new HarnessError('승인할 단계를 하나 지정하세요: design-harness approve <단계> --by <이름>');
    const project = resolveProject(values.root, values.project);
    const record = approve(project.dir, rest[0], { by: values.by, note: values.note });
    const stage = findStage(record.stage);
    console.log(`${stageNumber(stage)}. ${stage.title} (${stage.id}) 승인 기록: ${record.by}, ${record.at}`);
    console.log(`파일 ${Object.keys(record.files).length}개, ${record.hash}`);
    return 0;
  }

  throw new HarnessError(`알 수 없는 명령입니다: ${command}\n\n${USAGE}`);
}

try {
  process.exitCode = main(process.argv.slice(2));
} catch (err) {
  if (err instanceof HarnessError || err.code?.startsWith?.('ERR_PARSE_ARGS')) {
    console.error(`오류: ${err.message}`);
    process.exitCode = 1;
  } else {
    throw err;
  }
}
