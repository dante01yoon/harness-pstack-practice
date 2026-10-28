#!/usr/bin/env node
// PostToolUse 훅: Figma MCP 쓰기 도구가 끝나면, 바뀐 노드를 다시 내보내고 lint:figma 를 돌리라고 알린다.
// 내보낸 노드(06-figma/nodes/*.json)가 Figma 와 어긋난 채로 검증 단계에 들어가지 않게 하려는 것이다.
import { readFileSync } from 'node:fs';
import { basename } from 'node:path';
import { isFigmaWrite, fileKeysInInput, NODES_DIR } from '../lib/figma.js';
import { findStage } from '../lib/stages.js';

const NODE_FIELDS = ['nodeId', 'node_id', 'nodeIds', 'node_ids', 'parentId', 'parent_id'];

export function reminder(input) {
  if (!isFigmaWrite(input?.tool_name)) return null;
  const args = input.tool_input ?? {};
  const nodes = NODE_FIELDS.flatMap((f) => (args[f] === undefined ? [] : [args[f]].flat())).map(String);
  const [fileKey] = fileKeysInInput(args);
  const where = [fileKey && `파일 ${fileKey}`, nodes.length > 0 && `노드 ${[...new Set(nodes)].join(', ')}`].filter(Boolean).join(', ');
  const dir = `${findStage('figma').dir}/${NODES_DIR}/`;
  return [
    `Figma 에 썼습니다${where ? ` (${where})` : ''}.`,
    `바뀐 화면·컴포넌트 노드를 ${dir} 에 JSON 으로 다시 내보내고(기존 파일 덮어쓰기), \`design-harness lint:figma\` 로 토큰 밖 값·터치 영역·금지 문구·variant 누락을 확인하세요.`,
    'node-map.json 의 노드 ID 도 바뀐 것이 있으면 고치세요.',
  ].join(' ');
}

function main() {
  let input;
  try {
    input = JSON.parse(readFileSync(0, 'utf8'));
  } catch {
    return;
  }
  const text = reminder(input);
  if (!text) return;
  process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PostToolUse', additionalContext: text } }));
}

if (process.argv[1] && import.meta.url.endsWith(basename(process.argv[1]))) main();
