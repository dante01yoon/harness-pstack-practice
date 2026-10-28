#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { resolveProject } from '../lib/project.js';
import { check } from '../lib/check.js';
import { approve } from '../lib/approve.js';
import { captureReferences, VIEWPORTS } from '../lib/capture.js';
import { drawWireframes, ELEMENTS } from '../lib/wireframe.js';
import { writeDesignMd } from '../lib/design-md.js';
import { lintWeb, RULE_LABEL } from '../lib/lint-web.js';
import { lintFigma, RULE_LABEL as FIGMA_RULE_LABEL } from '../lib/lint-figma.js';
import { review, SCORE_MIN, SCORE_MAX } from '../lib/review.js';
import { writeHandoff } from '../lib/handoff.js';
import { HarnessError } from '../lib/errors.js';
import { STAGES, findStage, stageNumber } from '../lib/stages.js';
import { resolve } from 'node:path';

const USAGE = `사용법:
  design-harness check [--project <이름>] [--root <경로>] [--json]
      지금 어느 단계인지, 무엇이 빠졌는지 판정한다.
  design-harness approve <단계> --by <이름> [--note <메모>] [--project <이름>] [--root <경로>]
      단계 산출물의 해시를 work/<프로젝트>/approvals.json 에 기록한다.
      승인 뒤 산출물이 바뀌면 승인은 무효가 된다.
  design-harness refs:capture [URL...] [--viewport ${Object.keys(VIEWPORTS).join('|')}] [--force] [--browser <경로>]
      참고 화면을 헤드리스 Chrome 으로 캡처해 02-research/references/ 에 PNG 로 둔다.
      URL 을 안 주면 references/links.md 의 URL 을 모두 캡처한다. 이미 있는 캡처는 --force 일 때만 다시 찍는다.
  design-harness wireframe [화면ID...]
      04-wireframe/<화면ID>.md 의 배치 목록으로 <화면ID>.svg 를 그린다.
      요소: ${Object.keys(ELEMENTS).join(', ')}
  design-harness design-md
      05-design-system/ 의 tokens.json, components.json, copy.json 을 검사하고 DESIGN.md 를 만든다.
  design-harness lint:web [파일·폴더...] [--json]
      화면 HTML 이 토큰 밖 색·글자 크기, 44px 보다 작은 버튼, copy.json 의 금지 문구를 쓰는지 검사한다.
      경로를 안 주면 work/<프로젝트>/ 아래 모든 .html 을 본다. 문제가 있으면 종료 코드 1.
  design-harness lint:figma [파일·폴더...] [--json]
      내보낸 Figma 노드 JSON 이 토큰 밖 색·글자 크기·글꼴·간격, 44px 보다 작은 인터랙티브 요소,
      금지 문구, components.json 의 variant 누락을 갖는지 검사한다. 변수에 바인딩된 값은 통과.
      경로를 안 주면 06-figma/nodes/ 아래 모든 .json 을 본다. 문제가 있으면 종료 코드 1.
  design-harness review <단계> --by <이름> --score <${SCORE_MIN}-${SCORE_MAX}> [--note <메모>]
      사람 검토 점수를 work/<프로젝트>/reviews.json 에 남긴다.
  design-harness handoff
      08-handoff/HANDOFF.md 와 tokens/tokens.css, tokens/tokens.json 을 만든다.

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

function noArgs(command, rest) {
  if (rest.length > 0) throw new HarnessError(`${command} 는 인자를 받지 않습니다: ${rest.join(' ')}`);
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
      score: { type: 'string' },
      viewport: { type: 'string', default: 'desktop' },
      force: { type: 'boolean', default: false },
      browser: { type: 'string' },
      help: { type: 'boolean', short: 'h', default: false },
    },
  });
  const [command, ...rest] = positionals;
  if (values.help || !command) {
    console.log(USAGE);
    return values.help ? 0 : 2;
  }

  if (command === 'check') {
    noArgs(command, rest);
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

  if (command === 'refs:capture') {
    const project = resolveProject(values.root, values.project);
    const { dir, added, results } = captureReferences(project.dir, {
      urls: rest,
      viewport: values.viewport,
      force: values.force,
      browser: values.browser,
    });
    if (added.length > 0) console.log(`${dir}/links.md 에 URL ${added.length}개를 덧붙임`);
    const mark = { captured: '캡처', skipped: '건너뜀 (이미 있음, --force 로 다시)', failed: '실패' };
    for (const r of results) console.log(`${mark[r.status]}: ${r.url} → ${dir}/${r.file}${r.error ? ` — ${r.error}` : ''}`);
    return results.some((r) => r.status === 'failed') ? 1 : 0;
  }

  if (command === 'wireframe') {
    const project = resolveProject(values.root, values.project);
    for (const w of drawWireframes(project.dir, rest)) console.log(`${w.file} (${w.states.join(', ')})`);
    return 0;
  }

  if (command === 'design-md') {
    noArgs(command, rest);
    const project = resolveProject(values.root, values.project);
    const { path, tokens, components } = writeDesignMd(project.dir);
    const tokenCount = Object.values(tokens).reduce((n, g) => n + Object.keys(g).length, 0);
    console.log(`${path} 작성: 토큰 ${tokenCount}개, 컴포넌트 ${Object.keys(components).length}개`);
    return 0;
  }

  if (command === 'lint:web') {
    const project = resolveProject(values.root, values.project);
    const result = lintWeb(project.dir, rest.map((p) => resolve(p)), { base: process.cwd() });
    if (values.json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      for (const f of result.files) {
        for (const i of f.issues) console.log(`${f.file}:${i.line}  [${RULE_LABEL[i.rule]}] ${i.message}`);
      }
      console.log(result.total === 0 ? `HTML ${result.files.length}개, 문제 없음` : `HTML ${result.files.length}개, 문제 ${result.total}건`);
    }
    return result.total === 0 ? 0 : 1;
  }

  if (command === 'lint:figma') {
    const project = resolveProject(values.root, values.project);
    const result = lintFigma(project.dir, rest.map((p) => resolve(p)), { base: process.cwd() });
    if (values.json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      for (const f of result.files) {
        for (const i of f.issues) console.log(`${f.file}  ${i.node ?? '-'} ${i.path}  [${FIGMA_RULE_LABEL[i.rule]}] ${i.message}`);
      }
      console.log(result.total === 0 ? `노드 파일 ${result.files.length}개, 문제 없음` : `노드 파일 ${result.files.length}개, 문제 ${result.total}건`);
    }
    return result.total === 0 ? 0 : 1;
  }

  if (command === 'review') {
    if (rest.length !== 1) throw new HarnessError('검토할 단계를 하나 지정하세요: design-harness review <단계> --by <이름> --score <점수>');
    const project = resolveProject(values.root, values.project);
    const r = review(project.dir, rest[0], { by: values.by, score: values.score, note: values.note });
    const stage = findStage(r.stage);
    console.log(`${stageNumber(stage)}. ${stage.title} (${stage.id}) 검토 기록: ${r.by}, ${r.score}점`);
    console.log(`현재 산출물 검토 ${r.count}건, 평균 ${r.average}점`);
    return 0;
  }

  if (command === 'handoff') {
    noArgs(command, rest);
    const project = resolveProject(values.root, values.project);
    const { files, missingSpecs } = writeHandoff(project.dir, { project: project.name });
    for (const f of files) console.log(`작성: ${f}`);
    if (missingSpecs.length > 0) console.log(`스펙 없는 화면: ${missingSpecs.join(', ')} — 08-handoff/specs/<화면ID>.md 를 쓰세요`);
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
