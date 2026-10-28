import { join } from 'node:path';
import { STAGES, findStage } from './stages.js';
import { HarnessError } from './errors.js';
import { hashStage } from './hash.js';
import { readApprovals, writeApprovals } from './project.js';
import { inspectStage } from './check.js';
import { pendingBefore } from './gate.js';

// 2026-10-27T15:00:00+09:00 형태 (설계 문서 예시와 같은 로컬 오프셋 표기)
export function isoWithOffset(date) {
  const offset = -date.getTimezoneOffset();
  const pad = (n) => String(n).padStart(2, '0');
  const local = new Date(date.getTime() + offset * 60000).toISOString().slice(0, 19);
  const abs = Math.abs(offset);
  return `${local}${offset >= 0 ? '+' : '-'}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`;
}

// 단계 승인: 산출물이 갖춰지고 앞 단계가 모두 끝난 경우에만, 승인 시점 파일 해시를 기록한다.
export function approve(projectDir, stageKey, { by, note = '', now = new Date() } = {}) {
  const stage = findStage(stageKey);
  if (!stage) {
    throw new HarnessError(`알 수 없는 단계입니다: ${stageKey} (가능한 값: ${STAGES.map((s) => s.id).join(', ')})`);
  }
  if (!stage.approval) {
    throw new HarnessError(`${stage.title}(${stage.id}) 단계는 사람 승인이 필요하지 않습니다.`);
  }
  const approver = typeof by === 'string' ? by.trim() : '';
  if (!approver) throw new HarnessError('승인한 사람을 --by <이름> 으로 지정해야 합니다.');

  const approvals = readApprovals(projectDir);
  const pending = pendingBefore(projectDir, stage, approvals);
  if (pending.length > 0) {
    throw new HarnessError(
      `앞 단계가 끝나지 않아 승인할 수 없습니다: ${pending.map((s) => `${s.title}(${s.id})`).join(', ')}`,
    );
  }
  const self = inspectStage(projectDir, stage, approvals);
  if (self.missing.length > 0) {
    throw new HarnessError(
      `${stage.title}(${stage.id}) 산출물이 갖춰지지 않아 승인할 수 없습니다:\n` +
        self.missing.map((m) => `  - ${m}`).join('\n'),
    );
  }

  const { hash, files } = hashStage(join(projectDir, stage.dir));
  const record = { by: approver, at: isoWithOffset(now), hash, files, note };
  approvals.approvals[stage.id] = record;
  writeApprovals(projectDir, approvals);
  return { stage: stage.id, ...record };
}
