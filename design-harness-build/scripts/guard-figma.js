#!/usr/bin/env node
// PreToolUse 훅: Figma MCP 쓰기 도구를 부르기 직전에 막을지 정한다.
//   - work/<프로젝트>/06-figma/figma.json 에 적힌 파일이 아니면 막는다 (대상 파일을 알 수 없는 호출도 막는다).
//   - 그 프로젝트에서 피그마 단계가 열리지 않았으면(디자인 시스템까지 승인되지 않았으면) 막는다.
// 읽기 도구(get_*, search_* 등)와 work/ 가 없는 폴더(하네스를 쓰지 않는 곳)는 통과시킨다.
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { basename, join } from 'node:path';
import { isFigmaWrite, fileKeysInInput, readFigmaTarget, FIGMA_TARGET_FILE } from '../lib/figma.js';
import { pendingBefore } from '../lib/gate.js';
import { findStage } from '../lib/stages.js';

function projects(root) {
  const workDir = join(root, 'work');
  if (!existsSync(workDir)) return null;
  return readdirSync(workDir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => ({ name: e.name, dir: join(workDir, e.name) }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function decide(input) {
  if (!isFigmaWrite(input?.tool_name)) return null;
  const list = projects(input.cwd ?? process.cwd());
  if (!list) return null;
  const targetRel = `${findStage('figma').dir}/${FIGMA_TARGET_FILE}`;

  const keys = fileKeysInInput(input.tool_input ?? {});
  if (keys.length === 0) {
    return `어느 Figma 파일에 쓰는지 알 수 없어 막았습니다. ${targetRel} 의 파일 키(fileKey)나 URL 을 도구 입력에 넣어 다시 호출하세요.`;
  }
  if (keys.length > 1) return `한 호출에 Figma 파일이 여러 개 있습니다 (${keys.join(', ')}). 대상 파일 하나만 넣으세요.`;

  const targets = list.map((p) => ({ ...p, target: readFigmaTarget(p.dir) }));
  const project = targets.find((p) => p.target?.fileKey === keys[0]);
  if (!project) {
    const known = targets.map((p) => {
      if (!p.target) return `${p.name}: ${targetRel} 없음`;
      return p.target.error ? `${p.name}: ${p.target.error}` : `${p.name}: ${p.target.fileKey}`;
    });
    return [
      `Figma 파일 ${keys[0]} 은 하네스 대상 파일이 아니라 막았습니다.`,
      ...known.map((k) => `  - ${k}`),
      `대상 파일은 사람이 정합니다. 다른 파일에 써야 하면 사람에게 확인받고 ${targetRel} 을 고친 뒤 다시 하세요.`,
    ].join('\n');
  }

  let pending;
  try {
    pending = pendingBefore(project.dir, findStage('figma'));
  } catch (err) {
    return `work/${project.name}/ 의 단계 상태를 확인할 수 없어 막았습니다: ${err.message}`;
  }
  if (pending.length > 0) {
    const ds = pending.find((s) => s.id === 'design-system');
    return [
      `work/${project.name}/ 의 피그마 단계가 아직 열리지 않아 막았습니다${ds ? ' (디자인 시스템 승인 전)' : ''}.`,
      `끝나지 않은 단계: ${pending.map((s) => `${s.title}(${s.id})`).join(', ')}`,
      '`design-harness check` 로 빠진 것을 확인하세요. 승인은 사람이 `! design-harness approve <단계> --by <이름>` 으로 합니다.',
    ].join('\n');
  }
  return null;
}

function main() {
  let input;
  try {
    input = JSON.parse(readFileSync(0, 'utf8'));
  } catch {
    return;
  }
  const reason = decide(input);
  if (!reason) return;
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: reason },
    }),
  );
}

if (process.argv[1] && import.meta.url.endsWith(basename(process.argv[1]))) main();
