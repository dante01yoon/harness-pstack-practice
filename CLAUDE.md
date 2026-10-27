# seoul-parking

휴대폰 웹에서 서울시 공영주차장 빈자리를 3D 지도로 보여 주는 앱. 기준 문서는 `work/seoul-parking/PRD.md`.

## 늘 지킬 것
- 숫자는 서울 열린데이터광장 실제 응답에서만 가져온다. 빈자리·요금·시각을 지어내거나 추정하지 않는다.
- 인증키(`.env`의 `SEOUL_OPENAPI_KEY`)는 커밋하지 않고, 브라우저 코드·정적 파일에 넣지 않는다. API는 서버(또는 서버리스 함수)를 거쳐 부른다.
- 빈자리 숫자 옆에는 항상 기준 시각을 둔다. 20분 넘으면 "오래됨", 실시간 연계가 없으면 숫자 대신 "실시간 정보 없음".
- 운전 중 사용을 권하거나 전제하는 문구를 쓰지 않는다.
- 범위 밖(PRD "범위 밖")인 기능은 만들지 않는다. 필요해 보이면 먼저 묻는다.
- 휴대폰 웹(390×844)이 기준이다. 데스크톱은 같은 화면을 가운데 폭 고정으로 보인다.
- 디자인 판단이 PRD·승인된 산출물(`work/seoul-parking/`)과 코드가 다르면 산출물이 맞다. 코드를 산출물에 맞춘다.

## 구조
- `index.html` — 앱 전체(HTML·CSS·JS 한 파일, 빌드 없음)
- `data/parkings.json` — API 응답 결합 스냅샷
- `work/seoul-parking/` — 디자인 하네스 산출물(PRD·토큰·카피·IA·핸드오프), `out/` — 내보낸 와이어프레임
- `scripts/lint-web.mjs` — 앱을 상태별로 띄워 design-harness `lint:web`에 넘기는 드라이버

확인은 저장소 루트에서 정적 서버로 연다: `python3 -m http.server` → http://localhost:8000
테스트(의존성 없음, Node 18+): `node --test tests/*.test.mjs`

## 디자인 하네스 검사
design-harness 플러그인(`.claude/settings.json`의 `enabledPlugins`)이 디자인 원본(`work/seoul-parking/`)을 관리하고, 앱 쪽 검사는 아래처럼 나눠 돈다.

| 검사 | 무엇을 | 언제 |
|---|---|---|
| `node --test tests/*.test.mjs` (`design.test.mjs` 포함) | 승인 해시(approvals.json) 그대로인지, DESIGN.md front matter·`:root`·`T` 색·index.html 색 값이 tokens.json과 같은지 | 파일 고칠 때마다(PostToolUse 훅), CI |
| `node scripts/lint-web.mjs` | 불러오는 중·실패·WebGL 없음·지도·목록·검색·검색 결과 없음·상세(실시간 없음·위치 없음) 화면을 실제로 그려 토큰 밖 색·글자 크기·44px 미만 버튼·금지 문구 | 답을 끝낼 때(Stop 훅, 입력이 지난 통과 뒤 바뀐 경우만), 직접 실행 |
| `design-harness check` | 단계 게이트: PRD~핸드오프, Figma 노드 린트, DESIGN.md가 원본으로 새로 만든 것과 같은지·공식 린트, 사람 승인 | 답을 끝낼 때(플러그인 Stop 훅) |

- `design-harness lint:web index.html`을 그냥 돌리면 첫 화면(file://이면 불러오기 실패)만 본다. 화면 검사는 `scripts/lint-web.mjs`로 한다.
- DESIGN.md는 손으로 고치지 않는다. 원본(tokens·components·copy)을 바꾸고 승인받은 뒤 `design-harness design-md`로 다시 만든다.
- CI에는 플러그인이 없다(로컬 폴더 마켓플레이스). CI는 `node --test`만 돌고, 렌더링 검사와 DESIGN.md 재생성 비교는 로컬 Stop 훅이 맡는다.
- Stop 훅은 같은 답에서 한 번만 막는다(`stop_hook_active`). 플러그인·브라우저·외부 리소스가 없으면 건너뛰고 그 사실만 알린다.
