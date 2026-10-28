import { STAGES, findStage } from './stages.js';
import { HarnessError } from './errors.js';
import { readApprovals } from './project.js';
import { inspectStage } from './check.js';

// 앞 단계 중 끝나지 않은 것(승인 필요 단계는 유효한 승인까지)을 돌려준다.
export function pendingBefore(projectDir, stage, approvals = readApprovals(projectDir)) {
  return STAGES.slice(0, STAGES.indexOf(stage))
    .map((s) => inspectStage(projectDir, s, approvals))
    .filter((s) => !s.complete);
}

// 단계 폴더에 쓰기 전에 그 단계가 열렸는지(앞 단계가 모두 끝났는지) 확인한다.
// 설계 문서 7장의 "열리지 않은 단계 폴더에 쓰지 않는다"를 명령 수준에서 지킨다.
export function assertStageOpen(projectDir, stageId, action) {
  const stage = findStage(stageId);
  const pending = pendingBefore(projectDir, stage);
  if (pending.length > 0) {
    throw new HarnessError(
      `앞 단계가 끝나지 않아 ${action}: ${pending.map((s) => `${s.title}(${s.id})`).join(', ')}`,
    );
  }
  return stage;
}
