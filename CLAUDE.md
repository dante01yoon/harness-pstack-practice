# seoul-parking

출발 전에 서울시 공영(시영)주차장 빈자리를 휴대폰 웹에서 확인하는 앱. 기준 문서는 `work/seoul-parking/PRD.md`.

## 지금 상태
- 화면은 `index.html` 한 파일(HTML·CSS·JS, 빌드 없음). 목록과 상세(`#/p/{PKLT_CD}`) 두 화면.
- 데이터는 저장해 둔 실제 API 응답 `data/parking.json`을 읽는다. Open API를 부르는 서버(프록시)는 아직 없다.
- 로컬 확인: `fetch`를 쓰므로 `file://`로 열지 말고 `python3 -m http.server`로 띄운다.
- 화면 검사: `design-harness lint:web index.html` (토큰 밖 색·글자 크기, 44px 미만 버튼, 금지 카피). 화면을 바꾸면 돌리고 오류 0개를 확인한다. 파일 인자를 꼭 준다(인자가 없으면 플러그인 기본값 `work/seoul-parking/web/*.html`을 찾다가 아무것도 검사하지 않는다).
- 테스트: `node --test tests/*.test.mjs` (의존성 없음). 동작을 바꿀 때는 `/tdd` 순서를 따른다.
- 디자인 원본 대조: `design-harness check`(단계 게이트, DESIGN.md가 tokens·components·copy.json으로 다시 만든 것과 글자 단위로 같은지 + 공식 린트). `tests/design.test.mjs`는 같은 대조를 값 수준(DESIGN.md front matter·컴포넌트·금지어, `index.html` `:root`)으로 해서 CI에서도 돈다.

검사가 도는 곳:

| 언제 | 무엇 |
|---|---|
| 파일 편집 직후 (`.claude/hooks/after-edit.sh`) | 인증키 값, 승인 산출물 수정 알림, 화면·데이터·테스트·디자인 원본이면 `node --test`, 화면·`tokens`·`copy`·`ia.json`이면 `lint:web` |
| 답을 끝낼 때 (Stop) | `.claude/hooks/before-stop.sh`: 커밋 안 된 변경이 있는 영역만 `node --test`·`lint:web`. 플러그인 Stop 훅: `design-harness check`. FAIL에서만 막고 WAIT(승인 대기·승인 뒤 산출물이 바뀜)은 막지 않으니, 승인 상태는 `design-harness check` 출력에서 직접 본다 |
| PR·main 푸시 (`.github/workflows/check.yml`) | `node --test`(design.test 포함), 설정·훅 문법. `lint:web`·`check`는 로컬 플러그인이라 없으니 PR 전에 직접 돌린다 |

## 무엇을 기준으로 삼나
- 기능과 범위: `PRD.md`. 범위 밖(지도·현재 위치·예약·결제·로그인·즐겨찾기·빈자리 예측)은 요청이 없으면 만들지 않는다.
- 색·간격·글자: `work/seoul-parking/tokens.json`. 문구: `work/seoul-parking/copy.json`. 둘 다 사람이 승인한 값이다.
- 문서끼리 어긋나면 고치기 전에 사용자에게 묻는다. 어느 한쪽을 임의로 맞추지 않는다.

## 항상 지킬 것
- 인증키(`.env`의 `SEOUL_OPENAPI_KEY`)는 커밋하지 않고, 브라우저로 가는 코드·응답·로그·URL에 넣지 않는다. Open API는 서버에서만 부른다.
- 빈자리 숫자에는 언제나 기준 시각(`NOW_PRK_VHCL_UPDT_TM`, KST)을 함께 보여 준다. 기준 시각이 20분을 넘으면 오래됨으로 표시한다.
- 실시간 미연계(`PRK_STTS_YN=0`)는 "실시간 정보 없음"이다. 0자리·"-"·빈칸으로 보이게 하지 않는다. 계산값 0은 "만차"로 따로 구분한다.
- 값이 비었거나 뜻이 불분명하면 "정보 없음". 추측해서 채우지 않는다.
- 화면·예시·테스트에 넣는 숫자는 실제 API 응답 값만 쓴다. 주차 대수나 요금을 지어내지 않는다.
- 화면 하단 출처 표시(공공누리 제1유형 조건)를 지우지 않는다.
- 검사를 통과시키려고 테스트(`tests/`)·훅·하네스 검사를 약하게 고치지 않는다. 화면을 고치거나, 원본이 틀렸으면 사용자에게 묻는다.
- 문구는 해요체, 짧고 담담하게. 도착 시점의 빈자리를 약속하는 말("확실", "보장", "자리 있어요" 등)을 쓰지 않는다. 금지어 전체는 `copy.json`의 `banned`.

파일별 세부 규칙은 `.claude/rules/`에 있고, 해당 파일을 만질 때 함께 읽힌다.
