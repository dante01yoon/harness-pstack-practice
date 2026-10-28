import { existsSync, readFileSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { STAGES, NON_SCREEN_FILES, findStage } from './stages.js';
import { listFiles, hashStage, diffFiles } from './hash.js';
import { readApprovals } from './project.js';
import { designMdProblems } from './design-md.js';

// 단계 상태
//   not_started      — 단계 폴더에 파일이 없음
//   in_progress      — 필수 산출물이 덜 갖춰짐
//   done             — 산출물이 갖춰짐 (승인 필요 단계면 승인 대기)
//   approved         — 산출물이 갖춰지고 유효한 승인이 있음
//   approval_invalid — 승인 뒤 산출물이 바뀌어 재승인 필요

function missingItems(stageDir, stage) {
  const missing = [];
  for (const req of stage.required) {
    if (req.kind === 'screens') {
      missing.push(...missingScreens(stageDir, stage));
      continue;
    }
    if (req.kind === 'design-md') {
      missing.push(...designMdProblems(dirname(stageDir)));
      continue;
    }
    if (req.kind === 'screen-specs') {
      missing.push(...missingSpecs(stageDir, stage));
      continue;
    }
    const rel = `${stage.dir}/${req.path}`;
    const abs = join(stageDir, req.path);
    if (req.kind === 'dir') {
      if (!existsSync(abs) || !statSync(abs).isDirectory()) missing.push(`${rel}/ 폴더 없음`);
      else if (listFiles(abs).length === 0) missing.push(`${rel}/ 폴더가 비어 있음`);
      continue;
    }
    if (!existsSync(abs) || !statSync(abs).isFile()) {
      missing.push(`${rel} 없음`);
      continue;
    }
    const text = readFileSync(abs, 'utf8');
    if (text.trim() === '') {
      missing.push(`${rel} 비어 있음`);
    } else if (req.kind === 'json') {
      try {
        JSON.parse(text);
      } catch (err) {
        missing.push(`${rel} JSON 형식 오류 (${err.message})`);
      }
    }
  }
  return missing;
}

// 단계 폴더 바로 아래 <화면ID><ext> 파일들의 화면ID (changelog.md 등은 뺀다)
export function screenIds(dir, ext) {
  return listFiles(dir)
    .filter((f) => !f.includes('/') && !NON_SCREEN_FILES.has(f) && f.endsWith(ext))
    .map((f) => f.slice(0, -ext.length));
}

function missingScreens(stageDir, stage) {
  const md = new Set(screenIds(stageDir, '.md'));
  const svg = new Set(screenIds(stageDir, '.svg'));
  if (md.size === 0 && svg.size === 0) return [`${stage.dir}/<화면ID>.md, <화면ID>.svg 없음`];
  const missing = [];
  for (const id of [...md].sort()) if (!svg.has(id)) missing.push(`${stage.dir}/${id}.svg 없음`);
  for (const id of [...svg].sort()) if (!md.has(id)) missing.push(`${stage.dir}/${id}.md 없음`);
  return missing;
}

function missingSpecs(stageDir, stage) {
  const wireframeDir = join(dirname(stageDir), findStage('wireframe').dir);
  const ids = [...new Set([...screenIds(wireframeDir, '.md'), ...screenIds(wireframeDir, '.svg')])].sort();
  const specs = new Set(screenIds(join(stageDir, 'specs'), '.md'));
  if (ids.length === 0 && specs.size === 0) return [`${stage.dir}/specs/<화면ID>.md 없음`];
  const missing = [];
  for (const id of ids) {
    const abs = join(stageDir, 'specs', `${id}.md`);
    if (!specs.has(id)) missing.push(`${stage.dir}/specs/${id}.md 없음`);
    else if (readFileSync(abs, 'utf8').trim() === '') missing.push(`${stage.dir}/specs/${id}.md 비어 있음`);
  }
  return missing;
}

function approvalState(stageDir, record) {
  if (!record) return { state: 'none' };
  const { files } = hashStage(stageDir);
  const diff = diffFiles(record.files ?? {}, files);
  const valid = diff.changed.length + diff.added.length + diff.removed.length === 0;
  return { state: valid ? 'valid' : 'invalid', by: record.by, at: record.at, note: record.note, ...diff };
}

export function inspectStage(projectDir, stage, approvals) {
  const stageDir = join(projectDir, stage.dir);
  const missing = missingItems(stageDir, stage);
  const approval = stage.approval ? approvalState(stageDir, approvals.approvals[stage.id]) : { state: 'none' };

  let status;
  if (approval.state === 'invalid') status = 'approval_invalid';
  else if (missing.length > 0) status = listFiles(stageDir).length > 0 ? 'in_progress' : 'not_started';
  else if (!stage.approval) status = 'done';
  else status = approval.state === 'valid' ? 'approved' : 'done';

  const complete = stage.approval ? status === 'approved' : status === 'done';
  return { id: stage.id, title: stage.title, dir: stage.dir, needsApproval: stage.approval, status, complete, missing, approval };
}

// 단계별 상태와 현재 단계(완료되지 않은 첫 단계, 모두 끝났으면 null)를 판정한다.
export function check(projectDir) {
  const approvals = readApprovals(projectDir);
  const stages = STAGES.map((s) => inspectStage(projectDir, s, approvals));
  const current = stages.find((s) => !s.complete) ?? null;
  return { currentStage: current ? current.id : null, stages };
}
