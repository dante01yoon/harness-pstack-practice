---
name: verify-refresh-order
description: 새로고침·불러오기 순서(index.html의 load·refresh·start·showError, 새로고침/다시 시도 버튼, #veil)를 TLA+ 모델로 형식 검증한다. 이 코드를 바꾸거나 리뷰할 때, "새로고침 순서", "응답 늦게 오면", "버튼 여러 번" 같은 동시성 질문이나 /verify-refresh-order에 쓴다.
---

# /verify-refresh-order — 새로고침 순서 형식 검증

## 지키는 약속 두 개

| 이름 | 약속(한 문장) | 깨지면 생기는 일 |
|---|---|---|
| `LatestWins` | 화면이 읽는 숫자(`S.rows`)는 가장 마지막에 보낸 요청의 응답이다: (가) 한 번 넣은 응답보다 먼저 보낸 요청의 응답으로 되돌아가지 않고, (나) 가장 마지막 요청이 성공했으면 그 응답이다. | 새로고침을 연달아 눌렀을 때 늦게 온 옛 응답이 새 숫자를 덮어, 빈자리가 과거 값으로 돌아간다. |
| `NoWipe` | 불러오기 실패가 이미 보이는 숫자를 지우지 않는다. | 연결이 흔들릴 때 보던 목록이 통째로 사라진다. |

더 나중 요청이 아직 오는 중이거나 실패해서 이전 숫자를 두는 것은 두 약속 모두에 맞다. 그동안 도착한 중간 요청의 응답은 버려도 넣어도 된다. 요청 번호는 `load()`를 부른 순서이고, `start()`와 `refresh()`가 한 줄로 번호를 나눠 쓴다.

## 이 변경이 대상인가

`index.html`에서 아래 중 하나라도 바뀌면 이 검사를 돈다. `check.mjs`가 이 조각들의 해시를 `formal/refresh-order/coverage.json`과 비교해 알려 준다.

| 조각 | 모델에서 |
|---|---|
| `async function load()` | 요청 하나 = `load()` 호출 하나. 번호는 부른 순서 |
| `function showError(on)` | `banner`, 지도의 "다시 시도"(`#retry` → `start()`) |
| `async function refresh()` | `YouTapRefresh`(숫자를 받기 전이면 `start()`), `RefreshArrives`, `RefreshFails` |
| `async function start()` | `YouTapRetry`(목록의 `#retry2` 포함), `StartArrives`, `StartFails`, `started`, `HasMap` |
| `$("refresh").onclick = $("refresh2").onclick = refresh;` | 두 새로고침 버튼 모두 `YouTapRefresh` |
| `.loading-veil` / `.loading-veil.gone` CSS | `veil`: 덮여 있는 동안 버튼을 못 누름 |
| `listSkeleton();` `start();` (스크립트 끝) | `Init`: 첫 요청 #1이 나가 있고 #veil이 덮임 |

`S.rows`를 읽는 그리기 함수(`renderList`, `setColumns`, `doPlaceLabels`, `renderUpdated`)는 `Redraw`·`screen`으로 뭉뚱그렸다. 이 함수들이 `S.rows`를 바꾸거나 화면을 비우게 되면 그것도 대상이다.

**마지막으로 모델이 코드를 그대로 옮긴다고 확인한 커밋: `8e63ca3`**

이 커밋 뒤 대상 코드가 바뀌었는지는 `git diff 8e63ca3 -- index.html`에서 위 조각을 보거나, `check.mjs`의 "근거 코드가 바뀌었습니다" 줄로 안다.

## 돌리기

저장소 루트에서:

```sh
node formal/refresh-order/check.mjs
```

- 필요: Node 18+, Java 11+. TLC는 `tla2tools.jar` 1.7.4(sha256 고정)를 `TLA2TOOLS_JAR` 또는 `~/.cache/tla/tla2tools-1.7.4.jar`에서 찾고, 없으면 GitHub 릴리스에서 받는다.
- 약속마다 TLC를 따로 돌린다. 2초 안팎.
- 종료 코드: `0` 예상대로(통과이거나 알려진 발견만), `1` 새 반례 또는 알려진 발견이 사라짐, `2` TLC를 못 돌림, `3` 결과는 예상대로지만 근거 코드가 바뀜.
- CI(`node --test`)에는 넣지 않았다. CI에 Java가 없다.

모든 결과는 pstack `/statechart` 스킬로 읽는다(Claude Code에서는 `/pstack:statechart`, 사용법은 그 스킬 문서를 따른다). 반례는 가장 짧은 경로를 쉬운 말로 보여 주고, 통과하면 상태 사이를 어떻게 오가는지 그림으로 보여 준다. `check.mjs`도 반례를 코드 말로 풀어 쓴다.

## 지금 알려진 발견 (없음)

`formal/refresh-order/known-findings.json`이 비어 있다. 일부러 고치지 않고 두는 반례만 그 파일에 서명을 적는다. `check.mjs`는 같은 반례를 "알려진 발견"이라고 적는다.

`bc64f30`에서 찾은 두 반례와 고친 방법:

1. **`LatestWins`** — 첫 불러오기 성공(#1) → 새로고침(#2) → 새로고침(#3) → #3 도착 → 늦은 #2 도착으로 화면이 #2로 되돌아감. 지금은 `refresh()`와 `start()`가 `S.seq`를 같이 올리고, `refresh()`는 `await load()` 뒤 `my !== S.seq`면 숫자도 toast도 건드리지 않는다.
2. **`NoWipe`** — 첫 실패(#1) → 새로고침(#2) → "다시 시도"(#3) → #2 도착 → #3 실패로 `#listBody`가 비워짐. 브라우저에서 짚어 보니 3번 걸음은 불가능했다. 첫 실패 때 `start()`가 목록으로 바꾸고, 목록(z-index 7, 화면 전체)이 `#errorBanner`를 덮어 "다시 시도"가 보이지도 눌리지도 않았다(WebGL이 있어도 같음). 진짜 문제는 둘이었다. 실패 화면에 다시 시도가 없었고, 숫자를 받기 전 `refresh()`가 `start()`와 따로 돌아 성공해도 처음 시작(지도 만들기, WebGL 없음 처리)을 건너뛰었다. 지금은 실패 때 목록에 실패 문구와 `#retry2`를 그리고, 숫자를 받기 전(`started` 거짓) `refresh()`는 `start()`를 부른다. 그래서 `start()`가 실패할 때는 지울 숫자가 없다. 닿지 않던 `if (started) { ...; refresh(); return; }` 갈래는 지웠다. 다시 시도가 성공하면 지도의 `load`에서 목록을 지도로 되돌린다(IA 흐름 recover-error).

## 결과 읽기: 진짜 버그인가, 모델 잘못인가

반례가 나오면 걸음마다 코드에서 같은 순서가 정말 가능한지 짚는다.

- 버튼 걸음(`YouTap*`): 그때 그 버튼이 화면에 있고 #veil이 걷혀 있는가. 목록 화면이면 `#refresh2`, 지도면 `#refresh`. `hidden`이 아니어도 다른 층에 덮일 수 있으니, 브라우저에서 버튼 가운데의 `document.elementFromPoint`가 그 버튼인지 본다.
- 도착 걸음(`*Arrives`, `*Fails`): `await load()` 다음 줄부터 다음 `await` 또는 함수 끝까지가 정말 한 번에 도는가. 모델은 그 구간을 한 걸음으로 본다.
- `HasMap`: `map`은 첫 `start()` 성공 뒤 `webglOK()`일 때만 생긴다. 지도의 `load` 이벤트를 기다리는 시간은 한 걸음으로 묶었다.

모든 걸음이 코드에서 가능하면 진짜 버그다. 약속이나 모델을 약하게 고쳐 통과시키지 말고, 반례를 위 형식(걸음 순서, 코드 이름)으로 사용자에게 보고한다. 사용자가 고치라고 하기 전에는 앱 코드를 고치지 않는다.

가능하지 않은 걸음이 있으면 모델 잘못이다. 그 걸음의 조건을 코드에 맞게 고치고 왜 그런지 주석으로 남긴다.

## 코드를 일부러 바꿨을 때 모델 맞추기

1. 바뀐 조각을 읽고 `RefreshOrder.tla`의 해당 걸음(위 표)을 고친다. 단순한 경우는 `RefreshOrder.cfg` 상수로 된다:
   - `RefreshDropsStale` / `StartDropsStale`: 그 함수가 응답을 받은 뒤 "내 요청이 `start()`·`refresh()`를 통틀어 마지막 `load()` 호출인가"를 보고 아니면 `S.rows`를 건드리지 않으면 `TRUE`. 카운터를 `refresh()`에서만 올리면 `TRUE`가 아니다. "다시 시도" 성공 뒤 그보다 먼저 보낸 새로고침 응답이 가드를 통과해 덮는다(첫 실패 → 새로고침 #2 → 다시 시도 #3 → #3 도착 → #2 도착). 그런 코드는 상수로 표현되지 않으니, 가드가 세는 범위를 변수로 모델에 넣는다.
   - `ClearsListOnStartFail`: `start()` 실패가 `map` 없을 때 `#listBody`를 숫자 없는 화면(지금은 실패 문구)으로 바꾸면 `TRUE`. 숫자가 없을 때만 바꾸면 `FALSE`.
   - 지금 코드의 값은 `RefreshDropsStale = TRUE`, `StartDropsStale = FALSE`, `ClearsListOnStartFail = TRUE`.
   - `MaxClicks`: 사람이 누르는 횟수 상한. 5에서 1초 안쪽이다. 새 버튼이나 새 요청 경로를 넣으면 올려서 한 번 더 돌린다.
2. `node formal/refresh-order/check.mjs`. 알려진 발견이 사라졌다고 나오면(코드가 고쳐짐) `known-findings.json`에서 그 항목을 지운다. 새 반례면 위 "결과 읽기"를 따른다.
3. 모델이 새 코드를 그대로 옮긴다고 확인한 뒤에만 `node formal/refresh-order/check.mjs --print-coverage` 결과로 `coverage.json`의 `snippets`를 바꾸고, 이 문서의 확인 커밋을 그 코드가 들어간 커밋으로 옮긴다. 확인하지 않았으면 둘 다 그대로 둔다.

## 이 검사가 실패할 수 있다는 근거

`bc64f30`에서 이 문서대로 해 봤다(임시 변경, 커밋 안 함):

- 고친 판: `refresh()`와 `start()`가 같은 `S.seq`를 올리고, `refresh()`는 `await load()` 뒤 `my !== S.seq`면 돌아가며, `start()` 실패는 `S.rows`가 빌 때만 `#listBody`를 비운다. 상수 `RefreshDropsStale = TRUE`, `ClearsListOnStartFail = FALSE`로 두 약속 모두 통과(6342 상태).
- 그 위에 `start()`의 `++S.seq`만 뺀 판: 해시 비교가 `start()` 변경을 알렸고, 가드 범위를 모델에 넣자 `LatestWins`가 위 반례로 깨졌다.
- 되돌린 뒤 두 알려진 발견으로 돌아옴.

지금 코드에서 `RefreshDropsStale = FALSE`로만 바꿔 돌리면 `LatestWins`가 위 1번 반례로 다시 깨진다(54 상태).

## 다루지 않는 것

- 모델이지 코드 자체가 아니다. 코드와 모델의 대응은 위 표와 해시 비교로만 지킨다.
- 경계: 사람이 최대 5번 누름(새로고침 + 다시 시도), 따라서 요청은 최대 6개. 응답 도착 순서는 모두 섞어 본다. WebGL 있음·없음 둘 다.
- 숫자의 내용(빈자리 계산, 오래됨 20분, 실시간 없음)은 보지 않는다. 그건 `node --test`가 본다.
- 새로고침 버튼의 돌기(`spinning`) 표시, toast 문구, 기준 시각 문구가 맞는지는 보지 않는다.
- 서버(`server.mjs`)의 캐시·재시도, 브라우저 `fetch` 시간 초과, 탭 숨김·재방문은 모델에 없다.
