---
paths:
  - "index.html"
  - "**/*.html"
  - "**/*.css"
---

# 화면(HTML·CSS) 규칙

## 토큰
- 색·간격·크기·글자는 `:root`의 CSS 변수(`var(--color-text)` 등)로만 쓴다. 16진 색이나 임의 px 값을 새로 넣지 않는다.
- `:root` 값은 `work/seoul-parking/tokens.json`의 semantic 토큰을 그대로 옮긴 것이다. 값을 바꾸려면 tokens.json부터 바뀌어야 한다(승인 대상). 화면 쪽에서 먼저 바꾸지 않는다.
- 새 컴포넌트는 `work/seoul-parking/components.json`에 정의된 것만 쓰고, 거기 적힌 토큰 조합을 따른다.

## 휴대폰 화면
- 360px 너비에서 가로 스크롤이나 잘림이 없어야 한다. 단일 열, 최대 폭 480px.
- 누를 수 있는 요소(버튼·링크·칩·행)는 최소 44px(`--size-touch`). 목록 행은 `--size-row`.
- 상태는 색만으로 구분하지 않는다. 오래됨·실시간 없음·만차·버스전용·오류는 색 + 글자 + 아이콘을 함께 쓴다.
- 숫자에는 `.num`(tabular-nums)을 붙인다.

## 문구
- 화면 문구는 `work/seoul-parking/copy.json`의 `examples` 문구를 그대로 쓴다. 새 문구가 필요하면 `rules`와 `tone`에 맞춰 쓰고, 금지어(`banned`)가 들어가지 않았는지 확인한다.
- 버튼 문구는 동사로 끝내고 6자 이내, 느낌표 없음.
- 아이콘만 있는 버튼에는 한국어 `aria-label`을 단다(새로고침, 목록으로, 검색어 지우기).

## 상태
- 목록·상세 모두 loading, error(다시 시도), stale, no-realtime 상태를 가진다. 목록은 empty(검색 결과 없음)도 있다. 기능을 바꿀 때 이 상태들이 빠지지 않게 한다(`work/seoul-parking/ia.json`).
- 새로고침이 실패해도 이미 받은 목록은 지우지 않고, 언제 기준 목록인지 알린다.

## 코드
- `innerHTML`에 넣는 데이터 값은 반드시 `esc()`를 거친다. 주차장 이름·주소·전화번호도 API에서 온 외부 문자열이다.
- 빌드 도구·프레임워크·외부 스크립트를 들이지 않는다(웹폰트 제외). 필요하면 먼저 사용자에게 묻는다.

## 끝내기 전
- `design-harness lint:web index.html`을 돌려 오류 0개를 확인한다.
- 360px에서 목록·상세를 띄워 보고, 오래됨과 실시간 없음 행을 직접 확인한다.
