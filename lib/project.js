import { existsSync, readdirSync, readFileSync, writeFileSync, renameSync } from 'node:fs';
import { join } from 'node:path';
import { HarnessError } from './errors.js';

export const APPROVALS_FILE = 'approvals.json';

// work/<프로젝트>/ 를 찾는다. 이름을 안 주면 work/ 아래 프로젝트가 하나일 때만 그것을 쓴다.
export function resolveProject(root, name) {
  const workDir = join(root, 'work');
  if (name) {
    const dir = join(workDir, name);
    if (!existsSync(dir)) throw new HarnessError(`프로젝트를 찾을 수 없습니다: work/${name}/`);
    return { name, dir };
  }
  const names = existsSync(workDir)
    ? readdirSync(workDir, { withFileTypes: true })
        .filter((e) => e.isDirectory())
        .map((e) => e.name)
        .sort()
    : [];
  if (names.length === 1) return { name: names[0], dir: join(workDir, names[0]) };
  if (names.length === 0) throw new HarnessError(`work/ 아래에 프로젝트가 없습니다 (${workDir})`);
  throw new HarnessError(
    `프로젝트가 여러 개입니다. --project 로 지정하세요: ${names.join(', ')}`,
  );
}

export function readApprovals(projectDir) {
  const path = join(projectDir, APPROVALS_FILE);
  if (!existsSync(path)) return { version: 1, approvals: {} };
  let data;
  try {
    data = JSON.parse(readFileSync(path, 'utf8'));
  } catch (err) {
    throw new HarnessError(`${APPROVALS_FILE}을 읽을 수 없습니다: ${err.message}`);
  }
  if (!data || typeof data !== 'object' || typeof data.approvals !== 'object' || data.approvals === null) {
    throw new HarnessError(`${APPROVALS_FILE} 형식이 올바르지 않습니다 (approvals 객체 없음)`);
  }
  return data;
}

export function writeApprovals(projectDir, data) {
  const path = join(projectDir, APPROVALS_FILE);
  const tmp = `${path}.tmp-${process.pid}`;
  writeFileSync(tmp, JSON.stringify(data, null, 2) + '\n');
  renameSync(tmp, path);
}
