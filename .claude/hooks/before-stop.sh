#!/usr/bin/env bash
# Stop: 답을 끝내기 전에, 커밋 안 된 변경이 있는 영역만 다시 검사한다.
# 편집 훅(after-edit.sh)을 거치지 않은 변경(Bash로 고침, design-harness design-md로 다시 만듦)도 여기서 잡는다.
# 디자인 단계 게이트(DESIGN.md 최신·공식 린트·승인)는 design-harness 플러그인의 Stop 훅이 따로 돌린다.
# 실패하면 exit 2로 한 번 막는다. 이 훅 때문에 이어 가는 중(stop_hook_active)이면 다시 막지 않는다.
set -u
root="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"
cd "$root" || exit 0
[ "$(jq -r '.stop_hook_active // false' 2>/dev/null)" = "true" ] && exit 0

changed=$(git status --porcelain --untracked-files=all 2>/dev/null | cut -c4- | sed 's/.* -> //')
[ -n "$changed" ] || exit 0
has() { printf '%s\n' "$changed" | grep -Eq "$1"; }

fail=""
add() { fail="${fail}$1"$'\n'; }

if has '^(index\.html|.*\.(html|css)|data/|tests/|work/seoul-parking/(tokens|components|copy)\.json|work/seoul-parking/DESIGN\.md)'; then
  if ! out=$(node --test tests/*.test.mjs 2>&1); then
    add "[테스트] node --test 실패:"$'\n'"$(printf '%s\n' "$out" | grep -E '^(✖|  [A-Za-z]+Error|  (\+|-) |ℹ (pass|fail))' | head -40)"
  fi
fi

if has '^(index\.html|.*\.(html|css)|work/seoul-parking/(tokens|copy)\.json)'; then
  if command -v design-harness >/dev/null 2>&1; then
    if ! out=$(design-harness lint:web index.html 2>&1); then
      add "[lint:web] 오류:"$'\n'"$(printf '%s\n' "$out" | tail -30)"
    fi
  else
    add "[lint:web] design-harness 명령이 없어 화면 검사를 못 했어요. 사용자에게 알리세요."
  fi
fi

if [ -n "$fail" ]; then
  printf '%s' "$fail" >&2
  printf '%s\n' "앱 검사 실패 — 위 항목을 고치거나, 사람이 해야 하면 그렇게 보고하세요" >&2
  exit 2
fi
exit 0
