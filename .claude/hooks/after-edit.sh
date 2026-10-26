#!/usr/bin/env bash
# PostToolUse(Edit|Write|MultiEdit): 고친 파일에 맞는 검사를 돌린다.
# 실패하면 exit 2로 stderr를 Claude에게 돌려준다. 인증키 값은 어디에도 출력하지 않는다.
set -u
root="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"
file=$(jq -r '.tool_input.file_path // .tool_response.filePath // empty')
[ -n "$file" ] || exit 0
rel="${file#"$root"/}"
[ "$rel" != "$file" ] || exit 0   # 프로젝트 밖 파일
[ -f "$file" ] || exit 0
cd "$root" || exit 0

fail=""
add() { fail="${fail}$1"$'\n'; }

# 1) 인증키 값이 들어갔는지(.env 자신은 제외)
if [ "$rel" != ".env" ] && [ -f .env ]; then
  key=$(sed -n 's/^SEOUL_OPENAPI_KEY=//p' .env | head -1 | tr -d '\r[:space:]')
  if [ -n "$key" ] && grep -qF -- "$key" "$file"; then
    add "[인증키] $rel 에 SEOUL_OPENAPI_KEY 값이 들어 있어요. 지우고 서버 환경 변수로만 읽게 하세요."
  fi
fi

# 2) 승인된 디자인 산출물을 고쳤으면 알린다(승인이 풀림)
case "$rel" in
  work/seoul-parking/tokens.json|work/seoul-parking/components.json|work/seoul-parking/copy.json|\
  work/seoul-parking/ia.json|work/seoul-parking/wireframes.json)
    add "[승인] $rel 은 승인된 산출물이에요. 바뀌면 승인이 풀려요. 사용자에게 알리고 다시 승인받아야 해요(design-harness approve는 사람이 실행)." ;;
esac

# 3) 화면·데이터·테스트를 고쳤으면 테스트
case "$rel" in
  index.html|*.html|*.css|data/*|tests/*|work/seoul-parking/copy.json)
    if ! out=$(node --test tests/*.test.mjs 2>&1); then
      add "[테스트] node --test 실패:"$'\n'"$(printf '%s\n' "$out" | grep -E '^(✖|not ok|  [A-Za-z]+Error|    at |  (actual|expected|message|operator)|ℹ (pass|fail))' | head -40)"
    fi ;;
esac

# 4) 화면을 고쳤으면 lint:web(토큰·글자 크기·터치 크기·금지 카피)
case "$rel" in
  index.html|*.html|*.css)
    if command -v design-harness >/dev/null 2>&1; then
      if ! out=$(design-harness lint:web index.html 2>&1); then
        add "[lint:web] 오류:"$'\n'"$(printf '%s\n' "$out" | tail -30)"
      fi
    else
      add "[lint:web] design-harness 명령이 없어 화면 검사를 못 했어요."
    fi ;;
esac

if [ -n "$fail" ]; then
  printf '%s' "$fail" >&2
  exit 2
fi
exit 0
