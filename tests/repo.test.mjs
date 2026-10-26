// 저장소 단위 검사: 인증키 누출, 저장해 둔 응답의 모양.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { response, rows } from './harness.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
// 커밋됐거나 커밋될 수 있는 파일(.gitignore에 걸린 것은 뺀다)
const files = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], { cwd: root })
  .toString().split('\0').filter((f) => f && fs.existsSync(`${root}${f}`));
const textFiles = files.filter((f) => !/\.(png|jpe?g|gif|webp|ico|pdf)$/i.test(f));

// .env에서 키 값을 읽는다(CI처럼 .env가 없으면 환경 변수, 그것도 없으면 null). 값은 출력하지 않는다.
const key = (() => {
  if (process.env.SEOUL_OPENAPI_KEY) return process.env.SEOUL_OPENAPI_KEY;
  try { return /^SEOUL_OPENAPI_KEY=(.+)$/m.exec(fs.readFileSync(`${root}.env`, 'utf8'))?.[1].trim() || null; }
  catch { return null; }
})();

test('.env는 커밋 대상이 아니다', () => {
  assert.ok(!files.some((f) => /(^|\/)\.env(\..+)?$/.test(f)), '.env 파일이 추적되고 있어요');
});

test('Open API 요청 URL에 실제 인증키가 들어간 파일이 없다', () => {
  const url = /openapi\.seoul\.go\.kr(?::\d+)?\/([A-Za-z0-9]{20,})\//;
  const hits = textFiles.filter((f) => url.test(fs.readFileSync(`${root}${f}`, 'utf8')));
  assert.deepEqual(hits, []);
});

test('인증키 값이 어떤 파일에도 없다', { skip: key ? false : '.env와 SEOUL_OPENAPI_KEY가 없음' }, () => {
  const hits = textFiles.filter((f) => fs.readFileSync(`${root}${f}`, 'utf8').includes(key));
  assert.deepEqual(hits, [], '키 값이 들어간 파일');
});

test('data/parking.json은 정상 응답 모양이고 PKLT_CD가 겹치지 않는다', () => {
  const info = response.GetParkingInfo;
  assert.equal(info.RESULT.CODE, 'INFO-000');
  assert.equal(rows.length, info.list_total_count);
  assert.equal(new Set(rows.map((r) => r.PKLT_CD)).size, rows.length);
});
