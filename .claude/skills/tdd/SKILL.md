---
name: tdd
description: 테스트를 먼저 쓰고(실패 확인) → 최소 수정으로 통과 → 정리하는 순서로 고친다. "TDD로", "테스트 먼저", 버그 수정·동작 변경 요청이나 /tdd에 쓴다.
---

# /tdd — 테스트 먼저, 그다음 고친다

요청: $ARGUMENTS

순서(실패하는 테스트 → 기대한 이유로 실패하는지 확인 → 최소 수정 → 다시 실행)와 가드레일(테스트를 구현에 맞춰 약하게 고치지 않는다)은 pstack `tdd` 스킬(`/pstack:tdd`)을 따른다. 이 파일은 그 순서를 이 저장소에서 돌릴 때 필요한 사실만 둔다.

- pstack은 테스트 경로가 비싸면 건너뛰라고 하지만, 여기서는 `node --test tests/*.test.mjs`가 의존성 없이 바로 돌므로 건너뛰지 않는다.
- 파일을 고칠 때마다 PostToolUse 훅(`.claude/hooks/run-tests.mjs`)이 전체 테스트를 돌리고, 실패하면 결과를 돌려준다. 실패 전·통과 후 증거로 훅 결과를 쓴다.

## 근거와 범위
- 기대 결과는 `CLAUDE.md`, `.claude/rules/*`, `work/seoul-parking/`(PRD·`copy.json`·`tokens.json`)에서 근거를 찾는다. 근거가 없거나 산출물과 요청이 어긋나면 테스트를 쓰기 전에 묻는다.
- 범위 밖(PRD "범위 밖") 기능이면 멈추고 묻는다.
- 빈자리·요금·시각 같은 숫자는 `data/parkings.json` 실제 값이나 규칙에서 나온 값만 쓴다. 지어내지 않는다.

## 테스트를 둘 곳
- `tests/app.test.mjs` — `index.html` 스크립트의 도우미(`isStale`, `band`, `columnPx`, `hours`, `addr`, `oldest`, `esc`, `kst` 등)와 화면 문구·출처. 새 도우미를 시험하려면 `load()`의 `globalThis.__ = {...}` 목록에 이름을 더한다. 도우미는 `// ---- 지오메트리 ----` 줄 위에 있어야 DOM 없이 실행된다.
- `tests/data.test.mjs` — `data/parkings.json` 스냅샷 형태·필드 대응·두 사본 일치·인증키 노출.
- `tests/design.test.mjs` — 승인 해시와 토큰 대조(DESIGN.md·`:root`·`T`). 동작 테스트를 여기에 넣지 않는다. 여기서 실패하면 테스트가 아니라 `index.html`을 `tokens.json`에 맞춘다(원본을 바꿔야 하면 승인 문제이므로 묻는다).
- 테스트 하나는 동작 하나. 이름은 한국어로 "무엇이 어떠하다" 꼴(기존 테스트와 같게).

## 고칠 때
- 제품 코드는 `.claude/rules/index-html.md`의 토큰·문구·`esc()`·reduced-motion 규칙을 지킨다. 상수는 `T` 한 곳에 둔다.
- 기존 테스트가 틀렸다고 판단되면 고치지 말고 근거와 함께 사용자에게 묻는다.

## 마무리
- `node --test tests/*.test.mjs`를 한 번 직접 돌려 최종 결과를 확인한다.
- 화면에 보이는 변화가 있으면 `python3 -m http.server`로 열어 390×844에서 확인할 수 있다고 안내한다(테스트로는 레이아웃을 보지 않는다).
- 커밋하면 테스트와 수정을 한 커밋에 담는다. pstack bug-fix 플레이북의 "실패 테스트를 먼저 커밋"보다 이 규칙이 앞선다.
