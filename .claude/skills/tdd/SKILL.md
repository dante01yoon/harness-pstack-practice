---
name: tdd
description: seoul-parking에서 테스트부터 쓰고 고치는 순서(실패 확인 → 최소 수정 → 통과 → 정리). 기능 추가·버그 수정·"테스트부터", /tdd 요청에 쓴다.
argument-hint: "[바꿀 동작 한 줄]"
---

# /tdd — 테스트 먼저

바꿀 동작: $ARGUMENTS

빨강 → 초록 → 정리 순서와 보고 방식은 pstack `tdd` 스킬(`/pstack:tdd`)을 따른다. 이 파일에는 이 앱의 사실만 둔다. 다만 pstack은 테스트 경로가 불분명하면 건너뛰라고 하는데, 여기서는 아래 하네스로 늘 테스트할 수 있으니 `index.html` 동작을 바꿀 때는 버그든 기능이든 건너뛰지 않는다.

## 시작 전
- 바꿀 동작이 `work/seoul-parking/PRD.md` 범위 안인지 본다. 범위 밖(지도·현재 위치·예약·결제·로그인·즐겨찾기·빈자리 예측)이면 멈추고 묻는다.
- 문구가 필요하면 `work/seoul-parking/copy.json`의 `examples`부터 찾는다. PRD·tokens·copy가 서로 어긋나면 고치기 전에 사용자에게 묻는다.
- 지금 상태가 초록인지 먼저 확인한다: `node --test tests/*.test.mjs`

## 테스트 쓰는 곳과 도구
- `node:test`만 쓴다(설치할 것 없음, 빌드 도구·프레임워크 금지).
- 화면은 `tests/screen.test.mjs`, 저장소·데이터는 `tests/repo.test.mjs`. 테스트 이름은 한국어로, 지켜야 할 동작을 문장으로 쓴다.
- 화면은 `tests/harness.mjs`의 `open()`으로 띄운다. `index.html`을 고치지 않고 그 `<script>`를 그대로 돌린다.
  - `open({ now, hash, body })`: `now`는 앱이 보는 현재 시각(ms), `hash`는 처음 화면(`#/p/{PKLT_CD}`), `body`는 fetch 응답(`null`이면 실패).
  - `app.rowOf(id)` 목록 한 행 HTML, `app.screen()` 전체 HTML, `app.text()` 태그 뺀 글자, `app.serve(b)` 다음 응답 교체, `app.click(act)` `data-act` 버튼 누르기.
  - 기준 시각은 `kst(row(id).NOW_PRK_VHCL_UPDT_TM)`로 얻고, 오래됨은 `now`를 옮겨서 만든다.
- **숫자는 `data/parking.json`의 실제 값만 쓴다.** 만차·미연계·버스전용은 실제 행이 있다(예: 172971 만차, 1235522 미연계, 171721 실시간).
- 실제 응답에 없는 상태가 필요하면 `structuredClone(response)`로 복사해 코드 안에서 바꾼다. `data/parking.json`은 고치지 않는다.

## 고칠 때
- `.claude/rules/web-ui.md`를 따른다.
- 파일을 고치면 편집 훅이 테스트와 `lint:web`을 돌리고, 답을 끝낼 때 Stop 훅이 다시 돌린다. 훅이 실패를 돌려주면 그걸 먼저 고친다.
- 화면을 바꿨으면 `web-ui.md`의 "끝내기 전"대로 360px에서 직접 본다.
- 보고에는 마지막 `node --test`와 `design-harness lint:web index.html` 결과를 함께 적는다.
