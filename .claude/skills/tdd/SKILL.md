---
name: tdd
description: seoul-parking에서 테스트부터 쓰고 고치는 순서(실패 확인 → 최소 수정 → 통과 → 정리). 기능 추가·버그 수정·"테스트부터", /tdd 요청에 쓴다.
argument-hint: "[바꿀 동작 한 줄]"
---

# /tdd — 테스트 먼저

바꿀 동작: $ARGUMENTS

`index.html`의 동작을 바꿀 때 이 순서를 지킨다. 테스트는 Node 내장 `node:test`만 쓴다(설치할 것 없음, 빌드 도구·프레임워크 금지).

## 0. 기준 확인
- 바꿀 동작이 `work/seoul-parking/PRD.md` 범위 안인지 본다. 범위 밖(지도·현재 위치·예약·결제·로그인·즐겨찾기·빈자리 예측)이면 멈추고 묻는다.
- 문구가 필요하면 `work/seoul-parking/copy.json`의 `examples`부터 찾는다. PRD·tokens·copy가 서로 어긋나면 고치기 전에 사용자에게 묻는다.
- 지금 상태가 초록인지 먼저 확인한다: `node --test tests/*.test.mjs`

## 1. 빨강 — 실패하는 테스트 하나
- 사용자 눈에 보이는 동작 하나를 `tests/screen.test.mjs`(화면) 또는 `tests/repo.test.mjs`(저장소·데이터)에 테스트 하나로 쓴다. 이름은 한국어로, 지켜야 할 동작을 문장으로 쓴다.
- 화면은 `tests/harness.mjs`의 `open()`으로 띄운다. `index.html`을 고치지 않고 그 `<script>`를 그대로 돌린다.
  - `open({ now, hash, body })`: `now`는 앱이 보는 현재 시각(ms), `hash`는 처음 화면(`#/p/{PKLT_CD}`), `body`는 fetch 응답(`null`이면 실패).
  - `app.rowOf(id)` 목록 한 행 HTML, `app.screen()` 전체 HTML, `app.text()` 태그 뺀 글자, `app.serve(b)` 다음 응답 교체, `app.click(act)` `data-act` 버튼 누르기.
  - 기준 시각은 `kst(row(id).NOW_PRK_VHCL_UPDT_TM)`로 얻고, 오래됨은 `now`를 옮겨서 만든다.
- **숫자는 `data/parking.json`의 실제 값만 쓴다.** 주차 대수·요금을 지어내지 않는다. 만차·미연계·버스전용은 실제 행이 있다(예: 172971 만차, 1235522 미연계, 171721 실시간).
- 실제 응답에 없는 상태가 필요하면 `structuredClone(response)`로 복사해 코드 안에서 바꾼다. `data/parking.json`은 고치지 않는다.
- 돌려서 **실패하는 것을 보고, 실패 이유가 바꾸려는 동작 때문인지** 확인한다. 문법 오류·잘못된 선택자로 실패하면 테스트부터 고친다.

## 2. 초록 — 최소 수정
- 테스트를 통과시킬 만큼만 `index.html`을 고친다. 테스트를 약하게 바꿔 통과시키지 않는다.
- `.claude/rules/web-ui.md`를 따른다: 색·간격은 `:root` 변수만, 외부 문자열은 `esc()`, 상태는 색+글자+아이콘, 누를 요소 44px 이상.
- 파일을 고치면 훅(`.claude/hooks/after-edit.sh`)이 테스트와 `lint:web`을 돌린다. 훅이 실패를 돌려주면 그걸 먼저 고친다.

## 3. 정리
- 초록인 채로 중복을 줄이거나 이름을 다듬는다. 동작은 바꾸지 않는다.
- 끝내기 전에 모두 돌린다:
  - `node --test tests/*.test.mjs` — 전부 통과
  - `design-harness lint:web index.html` — 오류 0개
- 화면을 바꿨으면 `python3 -m http.server`로 띄워 360px에서 목록·상세, 오래됨·실시간 없음 행을 직접 본다.

## 보고
- 추가한 테스트 이름, 처음 실패했을 때 메시지 한 줄, 고친 곳, 마지막 테스트·lint 결과를 그대로 적는다. 돌리지 못한 검사가 있으면 못 했다고 쓴다.
