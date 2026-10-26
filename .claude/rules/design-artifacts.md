---
paths:
  - "work/**"
  - "out/**"
---

# 디자인 산출물 규칙

`work/seoul-parking/`와 `out/seoul-parking/`는 design-harness 플러그인이 단계별로 만든 산출물이다. 현재 프로젝트 이름은 `work/.active`에 있다.

## 승인된 파일
- `approvals.json`에 단계별 사람 승인과 산출물 해시가 있다. wireframe 단계는 `ia.json`·`wireframes.json`, system 단계는 `tokens.json`·`components.json`·`copy.json`이 대상이다.
- 이 파일들을 고치면 해시가 달라져 승인이 풀린다(`design-harness check`에서 "승인한 뒤 산출물이 바뀜"). 사용자가 바꾸라고 하지 않았으면 손대지 않는다.
- 바꿔야 하면 사용자에게 먼저 알리고, 고친 뒤 다시 승인받아야 한다고 전한다. 승인은 사람이 직접 한다(`! design-harness approve <단계> --by <이름>`). `approvals.json`을 대신 고치거나 승인 명령을 대신 실행하지 않는다.
- 플러그인 규칙(`/design-flow`)의 "같은 실패가 반복되면 `failures.jsonl`을 보고 규칙(copy.json 금지어, 토큰, 컴포넌트)을 고친다"도 이 저장소에서는 바로 고치지 않는다. 반복된 실패와 고칠 안을 사용자에게 보여 주고, 결정을 받은 뒤 고친다.
- 플러그인 문서의 `npm run check`·`npm run approve` 같은 npm 명령은 하네스 저장소 안에서만 된다. 이 저장소에는 `package.json`이 없으니 `design-harness <명령>`을 쓴다.

## 파생 파일
- `DESIGN.md`·`HANDOFF.md`는 JSON에서 만들어진다(`design-harness design-md`, `design-harness handoff`). 손으로 고치지 말고 원본 JSON을 고친 뒤 다시 만든다.
- `tokens`·`components`·`copy.json`이 바뀌면 `DESIGN.md`가 낡는다. `tests/design.test.mjs`와 `design-harness check`의 "DESIGN.md 최신"이 실패하므로, 원본이 승인된 뒤 `design-harness design-md`로 다시 만든다. `tokens.json`이 바뀌면 `index.html` `:root`도 같은 값으로 옮긴다.
- `out/` 아래 와이어프레임 SVG는 `design-harness wireframe`이 만든다.
- `failures.jsonl`은 하네스가 남기는 기록이다. 지우거나 고치지 않는다. `design-harness check`(Stop 훅 포함)가 FAIL을 낼 때마다 한 줄씩 붙이므로 커밋 안 된 변경으로 남을 수 있는데, 되돌리지 말고 그대로 둔다.
- `references/`의 이미지는 공개 화면을 캡처한 레퍼런스다. 앱 화면에 그대로 가져다 쓰지 않는다.

## PRD
- `PRD.md`는 모든 단계의 기준이다. 기능·범위를 바꾸면 IA·컴포넌트·문구·`index.html`까지 영향이 간다. 사용자의 결정 없이 고치지 않는다.
- PRD의 데이터 수치(122곳, 미연계 13곳 등)는 실제 호출로 확인한 값이다. 데이터를 다시 받아 달라졌으면 날짜와 함께 고친다.
