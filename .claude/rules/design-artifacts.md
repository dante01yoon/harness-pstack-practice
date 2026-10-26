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

## 파생 파일
- `DESIGN.md`·`HANDOFF.md`는 JSON에서 만들어진다(`design-harness design-md`, `design-harness handoff`). 손으로 고치지 말고 원본 JSON을 고친 뒤 다시 만든다.
- `out/` 아래 와이어프레임 SVG는 `design-harness wireframe`이 만든다.
- `failures.jsonl`은 하네스가 남기는 기록이다. 지우거나 고치지 않는다.
- `references/`의 이미지는 공개 화면을 캡처한 레퍼런스다. 앱 화면에 그대로 가져다 쓰지 않는다.

## PRD
- `PRD.md`는 모든 단계의 기준이다. 기능·범위를 바꾸면 IA·컴포넌트·문구·`index.html`까지 영향이 간다. 사용자의 결정 없이 고치지 않는다.
- PRD의 데이터 수치(122곳, 미연계 13곳 등)는 실제 호출로 확인한 값이다. 데이터를 다시 받아 달라졌으면 날짜와 함께 고친다.
