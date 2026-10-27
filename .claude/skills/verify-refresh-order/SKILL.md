---
name: verify-refresh-order
description: seoul-parking의 30초 자동 새로고침(PRD F9)·구 선택(F2)·즐겨찾기 빈자리 알림(F10) 순서 검증(TLA+). index.html의 load()·openings()·pickDistrict()·새로고침/다시 시도/닫기 처리·setInterval·visibilitychange, 또는 server/index.mjs의 cachedParking()을 바꿀 때, "새로고침 순서", "알림 두 번", /verify-refresh-order에 쓴다.
---

# /verify-refresh-order — 새로고침·빈자리 알림 순서 검증

## 지키는 약속
- **약속 1 (`ScreenLatest`)**: 목록·상세의 빈자리 숫자는 이 브라우저가 받아 반영한 응답 가운데 가장 새 것이다(뒤로 가지 않는다). 구를 바꿔서 버린 앞 응답은 다른 구 목록이라 반영 대상이 아니다. 깨지면 운전자가 이미 지나간 숫자를 보고 출발한다.
- **약속 2 (`NotifyOnce`)**: 즐겨찾기 주차장이 만차에서 빈자리로 바뀐 한 번의 사건에 배너는 한 번만 뜬다(닫은 뒤 같은 사건으로 다시 뜨는 것도 두 번). 깨지면 이미 본 알림이 다시 떠서 새 빈자리로 오해한다.

테스트는 누가 떠올린 순서만 본다. 이 검증은 아래 범위 안에서 가능한 모든 순서(타이머·버튼·구 칩·탭 전환·응답 도착 순서·서버 캐시 만료·다른 브라우저 요청·실패)를 다 본다.

## 실행

```
verify/refresh-order/run.sh          # 20초쯤. load 4번, Open API 스냅숏 4개
DEEP=1 verify/refresh-order/run.sh   # 1분 반쯤. load 5번
```

필요한 것: Java 11 이상, TLA+ tools 1.7.4(`~/.cache/tlaplus/tla2tools-1.7.4.jar`, 다른 곳이면 `TLA2TOOLS_JAR`). 없으면 스크립트가 받는 명령과 sha256을 알려 준다. TLC 출력은 `$TMPDIR/seoul-parking-tlc/*.out`.

스크립트가 하는 일과 결과 읽기:

| 단계 | 정상 | 아니면 |
|---|---|---|
| `anchors.mjs`: 모델이 기대는 코드 줄 22개와 `load()` 호출 5곳이 그대로인지 | `코드 앵커 23개 그대로` | exit 2. 바뀐 줄과 모델 동작 이름을 찍는다. 아래 "코드를 바꿨을 때" |
| `RefreshOrder.cfg`: 약속 1·2 | `통과` | exit 1. 진짜 버그이거나 모델 오류. 아래 "깨졌을 때" |
| `mutant-*.cfg`: `DiscardSuperseded = FALSE`(구를 바꿔 겹친 load의 늦은 앞 응답도 반영) | 둘 다 `잡힘` | exit 1. 검증이 무뎌졌다. 모델을 고친다 |
| `finding-banner.cfg` + `replay-banner.mjs`: 알려진 발견 F1 | `F1 남아 있음`, `F1 재현됨` | 둘 다 사라지면 F1이 고쳐진 것. 아래 발견 목록을 고친다 |

exit 0은 앵커·약속·변형이 모두 맞다는 뜻이다. F1은 exit 코드를 바꾸지 않는다(사용자가 정할 일이라 열어 둔 발견).

TLC 결과(통과든 반례든)는 pstack `/statechart` 스킬로 읽는다. 반례는 가장 짧은 경로를 쉬운 말로 보여 주고, 고친 모델을 주면 어떤 반례가 사라지는지 보여 준다. 통과하면 상태가 어떻게 옮겨 가는지 그림으로 보여 준다. 쓰는 법은 그 스킬을 따른다.

## 알려진 발견
- **F1 (열림, `BannerLatest`)**: 빈자리 배너의 숫자는 배너를 띄운 응답에 고정된다. 다음 응답에서 그 주차장이 다시 만차가 되거나 빈자리 수가 바뀌어도 배너는 그대로라, 목록·상세는 최신 숫자인데 배너만 이전 응답 숫자를 보여 준다. 순서: 방화역(동) 만차 응답 → 빈자리 1면 응답(배너 "빈자리 1면 · 07:55 기준") → 다시 만차 응답 → 행은 "만차", 배너는 여전히 "빈자리 1면". 원인은 index.html `state.openings`가 새 응답에서 `openings()`에 다시 걸린 주차장만 바꾸고 나머지 배너는 그대로 두는 것(`:393`). 배너에 기준 시각이 붙어 있어 PRD F10이 이를 허용하는지는 문서에 없다. 사용자가 "배너도 최신 숫자로 바꾸거나 내린다"고 정하면 고치고, "배너는 그 때의 알림"이라 정하면 이 항목을 닫고 `finding-banner.cfg`를 지운다. 약속 1을 `BannerLatest` 없이 통과했다고 보고하지 않는다.

## 모델이 보는 것과 빼는 것
`verify/refresh-order/RefreshOrder.tla`. 동작마다 코드 줄을 주석에 적었다. 동작 하나는 JS 이벤트 루프에서 await 없이 도는 한 덩어리다.

| 모델 동작 | 코드 |
|---|---|
| `Begin` | index.html `load()` 시작~`fetch` 호출(`:375-382`). `latest`는 `latestLoad`(`:376`) |
| `Start`(`CanStart`) | 부르는 곳: 클릭 `:703`(새로고침은 status=ready일 때만, 다시 시도는 error이거나 고른 구를 못 받았을 때만 그려짐 `:532`, 둘 다 status가 ready·error), 30초 타이머 `:724`, visibilitychange `:726`, 처음 `:730`, `canAutoLoad` `:722` |
| `Switch` | 구 칩 `:699` → `pickDistrict()` `:409`. 칩은 status=ready일 때만 그려지고(`:513`) `refreshing`을 보지 않는다 |
| `Receive` / `NetFail` | `await fetch` 뒤 `res.ok` 검사 / fetch 거절 |
| `JsonFail` / `JsonDone` | `await res.json()` 뒤 rows 검사 실패 / `seq` 검사(`:384`) 뒤 `state.lots` 교체·`openings()`(`:356`)·`state.openings`(`:393`)·finally |
| `FailLoad` | catch `:399-401`(`seq` 검사)·finally `:402-407`(`seq`가 마지막일 때만 `refreshing` 해제) |
| `Current` | `seq === latestLoad`. 아니면 응답·실패를 버린다 |
| `Dismiss` | 닫기 `:712` |
| `Arrive` / `OtherArrive` | server/index.mjs `cachedParking()` `:34-40`: 저장분, 진행 중인 한 번 같이 기다리기, 새로 부르기 / 다른 브라우저 요청. `?gu=` 거르기(`onlyDistricts` `:69`)는 저장분을 받은 뒤의 순수 함수라 순서에 영향이 없다 |
| `UpstreamOk` / `UpstreamFail` / `Expire` / `Advance` | 저장, 실패는 저장 안 함, 30초 TTL 만료, Open API 숫자 변화 |

범위와 가정(통과는 이 안에서만 뜻이 있다):
- 이 브라우저의 load 4번(DEEP 5번), Open API 스냅숏 4개, 즐겨찾기 주차장 1곳. 빈자리는 0(만차)과 1 이상 두 값.
- 즐겨찾기 주차장은 어느 구를 고른 응답에도 들어 있다고 둔다(`dataUrl()`이 즐겨찾기의 구를 함께 넣는다. `tests/screen.test.mjs`의 "즐겨찾기가 있는 구를 함께 받아" 테스트가 지킨다). 구 칩은 어느 구로 바꾸는지 보지 않고 load 시작으로만 본다.
- 즐겨찾기는 켜진 채로 둔다. 숫자는 늘 실시간·20분 이내로 둔다(알림이 갈 수 있는 경우). 즐겨찾기 끄기·오래됨·실시간 없음은 알림을 막기만 하므로 뺐다.
- 보임·검색창 초점·30초 경과 조건은 load를 막기만 하므로 빼서 더 많은 순서를 본다.
- Open API는 스냅숏 번호가 뒤로 가지 않는다고 둔다. Open API 자체가 더 오래된 `NOW_PRK_VHCL_UPDT_TM`을 돌려주는 경우는 보지 않는다(코드로 막을 수 없음).
- 진행만 본다(안전 성질). fetch가 끝나지 않으면 `refreshing`이 풀리지 않아 새로고침이 멈추는 문제(index.html의 fetch에 시간 제한이 없음)는 이 검증이 보지 않는다.
- 상세/목록 화면 전환, 화면 그리기, 초점 복원은 상태를 바꾸지 않아 뺐다.

## 깨졌을 때: 버그인가 모델 오류인가
1. `/statechart`로 반례 경로를 쉬운 말로 펼친다.
2. 경로를 실제 코드로 한 단계씩 따라간다. `tests/harness.mjs`의 `open()`·`serve()`·`tick()`·`click()`으로 브라우저 쪽을 재현할 수 있다(`replay-banner.mjs`가 예시). 응답 순서를 바꿔야 하면 하네스의 `fetch`를 대신하는 스크립트를 `verify/refresh-order/`에 따로 만든다. `tests/`나 하네스를 약하게 고치지 않는다.
3. 재현되면 버그다. 반례를 코드 말로(어떤 클릭·타이머·응답이 어떤 순서로) 사용자에게 보고하고, 사용자가 고치라고 하기 전에는 제품 코드를 고치지 않는다. 약속이나 모델을 느슨하게 해서 통과시키지 않는다.
4. 재현이 안 되면 모델이 코드보다 넓거나 틀렸다고 보고, 어느 동작이 코드의 어느 줄과 다른지 찾아 모델을 고친다. 고친 뒤 `mutant-*`가 여전히 잡히는지 본다.

## 코드를 바꿨을 때
위 표의 파일·함수를 건드렸으면, 혹은 `anchors.mjs`가 exit 2를 냈으면:
1. 바뀐 코드가 표의 어느 동작인지 찾고, 그 동작이 여전히 코드와 같은 덩어리·같은 조건인지 읽는다. 새 await가 생겼으면 동작을 둘로 나눈다. load()를 부르는 곳이 새로 생기면 `CanStart`에 넣는다.
2. 모델을 코드에 맞춘다. 예: 클릭 처리에서 `!state.refreshing` 검사를 빼면 `RefreshOrder.cfg`의 `GuardRefreshing`을 `FALSE`로 한다(그러면 약속 1·2가 둘 다 깨진다).
3. `anchors.mjs`의 줄을 새 코드로 바꾸고 `run.sh`를 돌린다.
4. 모델이 새 커밋의 코드를 그대로 설명한다고 확인한 뒤에만 아래 동기화 커밋을 그 커밋으로 옮긴다. 앵커만 고치고 모델을 안 읽었으면 옮기지 않는다.

## 동기화 기록
- 덮는 코드: `index.html` 375-413(`load`·`pickDistrict`), 356-362(`openings`), 502·513·532·591(버튼·칩이 그려지는 조건), 699·703·712(클릭 처리), 722-730(`canAutoLoad`·타이머·visibilitychange·첫 load). `server/index.mjs` 12-40(`createApp`·`cachedParking`).
- 마지막으로 모델이 코드를 그대로 설명한다고 확인한 커밋: `ef51acf` (2026-10-26). 도구: TLA+ tools 1.7.4(TLC 2.19), Java 26.
- 이 커밋 뒤에 위 파일이 바뀌었는지: `git log --oneline ef51acf..HEAD -- index.html server/index.mjs`. 나오는 커밋이 있으면 위 "코드를 바꿨을 때"를 따른다.
- 오래 손보지 않은 검증을 다시 맞출 때는 pstack `/maintain-formal-verification-skill`.
