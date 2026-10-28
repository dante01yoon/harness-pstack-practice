import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { findStage } from './stages.js';

// 피그마 단계 공통: 대상 파일(06-figma/figma.json)과 Figma MCP 도구 호출 해석.
//
// figma.json  { "fileUrl": "https://www.figma.com/design/<fileKey>/<이름>" }  또는  { "fileKey": "<fileKey>" }
//             하네스가 Figma 에 쓸 수 있는 유일한 파일. 브랜치 URL 이면 브랜치 키가 대상이다.

export const FIGMA_TARGET_FILE = 'figma.json';
export const NODES_DIR = 'nodes';

const FIGMA_URL = /figma\.com\/(?:design|file|proto|board|slides|make)\/([A-Za-z0-9]+)(?:\/branch\/([A-Za-z0-9]+))?/g;
const KEY_FIELDS = new Set(['fileKey', 'file_key', 'fileId', 'file_id']);
const FILE_KEY = /^[A-Za-z0-9]{10,}$/;
// 이름이 이렇게 시작하는 도구는 읽기 전용으로 본다. 나머지는 모두 쓰기로 보고 막는 쪽을 택한다.
const READ_ONLY = /^(?:get|search|list|read|fetch|whoami|describe)(?:_|[A-Z]|$)/;
const READ_ONLY_NAMES = new Set(['create_design_system_rules']);

// URL 문자열 안의 Figma 파일 키들 (브랜치 URL 은 브랜치 키)
export function fileKeysInText(text) {
  return [...String(text).matchAll(FIGMA_URL)].map((m) => m[2] ?? m[1]);
}

// mcp__<서버>__<도구> 중 서버 이름에 figma 가 들어간 것
export function isFigmaTool(toolName) {
  const m = /^mcp__(.+?)__(.+)$/.exec(String(toolName ?? ''));
  return Boolean(m && /figma/i.test(m[1]));
}

export function isFigmaWrite(toolName) {
  if (!isFigmaTool(toolName)) return false;
  const tool = String(toolName).split('__').pop();
  return !READ_ONLY.test(tool) && !READ_ONLY_NAMES.has(tool);
}

// 도구 입력에서 대상 파일 키를 모두 모은다 (fileKey 류 필드, 그리고 어디든 들어 있는 Figma URL).
export function fileKeysInInput(input) {
  const keys = new Set();
  const walk = (v, depth) => {
    if (depth > 5 || v === null || typeof v !== 'object') return;
    for (const [k, child] of Object.entries(v)) {
      if (typeof child === 'string') {
        if (KEY_FIELDS.has(k) && FILE_KEY.test(child.trim())) keys.add(child.trim());
        for (const key of fileKeysInText(child)) keys.add(key);
      } else walk(child, depth + 1);
    }
  };
  walk(input, 0);
  return [...keys];
}

// work/<프로젝트>/06-figma/figma.json 의 대상 파일. 없으면 null, 형식이 틀리면 { error }.
export function readFigmaTarget(projectDir) {
  const rel = `${findStage('figma').dir}/${FIGMA_TARGET_FILE}`;
  const abs = join(projectDir, rel);
  if (!existsSync(abs)) return null;
  let data;
  try {
    data = JSON.parse(readFileSync(abs, 'utf8'));
  } catch (err) {
    return { error: `${rel} JSON 형식 오류 (${err.message})` };
  }
  const fromUrl = typeof data?.fileUrl === 'string' ? fileKeysInText(data.fileUrl)[0] : undefined;
  const fileKey = typeof data?.fileKey === 'string' && data.fileKey.trim() ? data.fileKey.trim() : fromUrl;
  if (!fileKey) return { error: `${rel} 에 fileUrl(Figma 파일 URL)이나 fileKey 가 없습니다` };
  if (fromUrl && fileKey !== fromUrl) return { error: `${rel} 의 fileKey(${fileKey})와 fileUrl 의 키(${fromUrl})가 다릅니다` };
  return { fileKey, fileUrl: data.fileUrl ?? null };
}
