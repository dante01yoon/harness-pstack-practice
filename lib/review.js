import { existsSync, readFileSync, writeFileSync, renameSync } from 'node:fs';
import { join } from 'node:path';
import { STAGES, findStage } from './stages.js';
import { HarnessError } from './errors.js';
import { hashStage, listFiles } from './hash.js';
import { isoWithOffset } from './approve.js';

// 사람 검토 점수 기록. 승인과 달리 단계 진행을 막지 않고, 여러 번·여러 사람이 남길 수 있다.
// 단계 폴더 밖(work/<프로젝트>/reviews.json)에 두어 기록이 승인 해시를 건드리지 않게 한다.

export const REVIEWS_FILE = 'reviews.json';
export const SCORE_MIN = 1;
export const SCORE_MAX = 5;

export function readReviews(projectDir) {
  const path = join(projectDir, REVIEWS_FILE);
  if (!existsSync(path)) return { version: 1, reviews: [] };
  let data;
  try {
    data = JSON.parse(readFileSync(path, 'utf8'));
  } catch (err) {
    throw new HarnessError(`${REVIEWS_FILE}을 읽을 수 없습니다: ${err.message}`);
  }
  if (!data || !Array.isArray(data.reviews)) throw new HarnessError(`${REVIEWS_FILE} 형식이 올바르지 않습니다 (reviews 배열 없음)`);
  return data;
}

export function review(projectDir, stageKey, { by, score, note = '', now = new Date() } = {}) {
  const stage = findStage(stageKey);
  if (!stage) throw new HarnessError(`알 수 없는 단계입니다: ${stageKey} (가능한 값: ${STAGES.map((s) => s.id).join(', ')})`);
  const reviewer = typeof by === 'string' ? by.trim() : '';
  if (!reviewer) throw new HarnessError('검토한 사람을 --by <이름> 으로 지정해야 합니다.');
  const n = typeof score === 'string' && /^\s*\d+\s*$/.test(score) ? Number(score) : score;
  if (!Number.isInteger(n) || n < SCORE_MIN || n > SCORE_MAX) {
    throw new HarnessError(`점수는 ${SCORE_MIN}~${SCORE_MAX} 사이 정수로 --score 에 지정하세요${score === undefined ? '' : ` (받은 값: ${score})`}`);
  }
  const stageDir = join(projectDir, stage.dir);
  if (listFiles(stageDir).length === 0) throw new HarnessError(`${stage.title}(${stage.id}) 단계에 검토할 산출물이 없습니다`);

  const data = readReviews(projectDir);
  const record = { stage: stage.id, by: reviewer, at: isoWithOffset(now), score: n, note, hash: hashStage(stageDir).hash };
  data.reviews.push(record);
  const path = join(projectDir, REVIEWS_FILE);
  const tmp = `${path}.tmp-${process.pid}`;
  writeFileSync(tmp, JSON.stringify(data, null, 2) + '\n');
  renameSync(tmp, path);
  return { ...record, ...summarize(projectDir, stage.id, data) };
}

// 단계별 검토 요약. 현재 산출물에 대한 검토(해시 일치)만 평균에 넣는다.
export function summarize(projectDir, stageId, data = readReviews(projectDir)) {
  const stage = findStage(stageId);
  const current = hashStage(join(projectDir, stage.dir)).hash;
  const all = data.reviews.filter((r) => r.stage === stage.id).map((r) => ({ ...r, stale: r.hash !== current }));
  const fresh = all.filter((r) => !r.stale);
  const average = fresh.length ? Math.round((fresh.reduce((s, r) => s + r.score, 0) / fresh.length) * 10) / 10 : null;
  return { reviews: all, count: fresh.length, average };
}
