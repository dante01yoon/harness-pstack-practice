---
paths:
  - "work/**"
  - "out/**"
---

# 디자인 산출물 규칙

- `work/`와 `out/`은 design-harness 플러그인이 만드는 산출물이다. 고칠 때는 해당 스킬(`design-harness:design-flow` 등)을 거치고 손으로 직접 고치지 않는다. 예외: `work/seoul-parking/data/`는 플러그인 산출물이 아니라 `data/parkings.json`의 사본이므로 `.claude/rules/data.md`를 따른다.
- `approvals.json`에 단계별 승인 해시가 있다. 승인된 단계의 파일(wireframe: `ia.json`·`wireframes.json`, system: `tokens.json`·`components.json`·`copy.json`, verify: `figma/nodes.json`·`review.json`)을 바꾸면 승인이 풀린다. 바꿔야 하면 먼저 사용자에게 알리고 다시 승인받는다. `approvals.json`은 사람이 승인할 때만 바뀐다.
- `failures.jsonl`은 덧붙이기만 한다. 기존 줄을 지우거나 고치지 않는다.
- `work/.active`는 현재 작업 중인 디자인 이름이다. 임의로 바꾸지 않는다.
- 산출물 안의 예시 숫자는 실제 API 응답에서 가져온다(PRD "데이터 결합과 실제 수치").
- `tokens.json`·`copy.json`을 바꾸면 `index.html`의 `:root` 변수·`T` 객체·문구도 같이 맞춘다.
