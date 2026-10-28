#!/usr/bin/env node
// PreToolUse 훅: AI 가 승인·검토 기록을 직접 남기지 못하게 막는다 (설계 문서 4장 "승인 원칙").
//   - design-harness approve / review 실행
//   - approvals.json, reviews.json 을 Write·Edit 하거나 셸로 고쳐 쓰는 것
// 사람은 프롬프트에서 `! design-harness approve ...` 로 직접 실행한다. `!` 명령은 도구 호출이 아니라 이 훅을 거치지 않는다.
// 셸 명령은 문자열만 보고 판정하므로 우회를 완전히 막는 장치는 아니다. 실수로 승인하는 것을 막는 안전장치다.
import { readFileSync } from 'node:fs';
import { basename } from 'node:path';

const RECORD_FILES = new Set(['approvals.json', 'reviews.json']);
const HARNESS_CMD = /design-harness(?:\.js)?["']?\s+(approve|review)\b/;
const RECORD_MENTION = /\b(?:approvals|reviews)\.json\b/;
// 기록 파일을 언급하면서 쓰기로 보이는 명령 (읽기 전용 cat·jq·grep 등은 통과)
const WRITE_HINT = /(^|[^<>&0-9])>>?(?!&)|\btee\b|\bsed\b[^|;&]*\s-i|\b(?:mv|cp|rm|truncate|install|ln|perl|python3?|node|ruby|dd)\b/;

export function decide(input) {
  const tool = input?.tool_name;
  const args = input?.tool_input ?? {};
  if (tool === 'Bash') {
    const cmd = String(args.command ?? '');
    const m = HARNESS_CMD.exec(cmd);
    if (m) {
      return `design-harness ${m[1]} 는 사람이 직접 실행해야 합니다. 사용자에게 프롬프트에서 \`! design-harness ${m[1]} ...\` 로 실행해 달라고 안내하세요.`;
    }
    if (RECORD_MENTION.test(cmd) && WRITE_HINT.test(cmd)) {
      return 'approvals.json·reviews.json 은 사람이 design-harness approve/review 로만 바꿉니다. 읽기만 하세요.';
    }
    return null;
  }
  const path = args.file_path ?? args.notebook_path;
  if (path && RECORD_FILES.has(basename(String(path)))) {
    return `${basename(String(path))} 은 사람이 design-harness approve/review 로만 바꿉니다. 직접 고치지 마세요.`;
  }
  return null;
}

function main() {
  let input;
  try {
    input = JSON.parse(readFileSync(0, 'utf8'));
  } catch {
    return; // 입력을 못 읽으면 판단하지 않고 통과
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
