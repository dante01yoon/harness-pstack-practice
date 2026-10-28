import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const IGNORED = new Set(['.DS_Store']);

// 폴더 아래 모든 파일의 상대 경로(/ 구분)를 정렬해서 돌려준다.
export function listFiles(dir) {
  if (!existsSync(dir)) return [];
  const out = [];
  const walk = (abs, rel) => {
    for (const ent of readdirSync(abs, { withFileTypes: true })) {
      if (IGNORED.has(ent.name)) continue;
      const childRel = rel ? `${rel}/${ent.name}` : ent.name;
      if (ent.isDirectory()) walk(join(abs, ent.name), childRel);
      else if (ent.isFile()) out.push(childRel);
    }
  };
  walk(dir, '');
  return out.sort();
}

export function hashFile(path) {
  return 'sha256:' + createHash('sha256').update(readFileSync(path)).digest('hex');
}

// 단계 폴더의 파일별 해시와, 그 목록 전체를 묶은 단계 해시.
export function hashStage(stageDir) {
  const files = {};
  for (const rel of listFiles(stageDir)) files[rel] = hashFile(join(stageDir, rel));
  const h = createHash('sha256');
  for (const [rel, digest] of Object.entries(files)) h.update(`${rel}\0${digest}\n`);
  return { hash: 'sha256:' + h.digest('hex'), files };
}

// 승인 당시 파일 해시와 현재를 비교한다.
export function diffFiles(recorded, current) {
  const changed = [];
  const added = [];
  const removed = [];
  for (const [rel, digest] of Object.entries(current)) {
    if (!(rel in recorded)) added.push(rel);
    else if (recorded[rel] !== digest) changed.push(rel);
  }
  for (const rel of Object.keys(recorded)) if (!(rel in current)) removed.push(rel);
  return { changed, added, removed };
}
