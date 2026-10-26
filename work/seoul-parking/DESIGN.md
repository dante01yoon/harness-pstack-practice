---
version: "alpha"
name: "seoul-parking"
description: "서울 공영주차장 빈자리 확인(휴대폰 웹, 360px부터). 방향: 도로 주차 표지판의 청색 판과 흰 글자를 빌린 '안내판' 언어 — 둥근 카드와 그림자 대신 구분선으로 나눈 단일 열 행, 빈자리 숫자는 크게, 기준 시각은 숫자 바로 옆. 상태는 색 + 글자 + 아이콘을 함께 쓰고 색만으로 구분하지 않는다. primitive(값) -> semantic(의도) 두 층이며 화면·코드는 semantic만 쓴다."
colors:
  primary: "{colors.brand}"
  brand: "#0A4A94"
  brand-soft: "#E6EEF8"
  on-brand: "#FFFFFF"
  text: "#16202A"
  text-muted: "#475563"
  surface: "#FFFFFF"
  surface-sunken: "#F2F4F6"
  border: "#D3DAE1"
  border-strong: "#7A8794"
  warning: "#6E4300"
  warning-soft: "#FFF1D6"
  danger: "#B0261C"
  danger-soft: "#FCEBEA"
  focus: "#0A4A94"
typography:
  caption:
    fontFamily: "IBM Plex Sans KR"
    fontSize: "13px"
  label:
    fontFamily: "IBM Plex Sans KR"
    fontSize: "15px"
  body:
    fontFamily: "IBM Plex Sans KR"
    fontSize: "16px"
  title:
    fontFamily: "IBM Plex Sans KR"
    fontSize: "18px"
  heading:
    fontFamily: "IBM Plex Sans KR"
    fontSize: "22px"
  count:
    fontFamily: "IBM Plex Sans KR"
    fontSize: "32px"
  count-lg:
    fontFamily: "IBM Plex Sans KR"
    fontSize: "48px"
rounded:
  sm: "4px"
  md: "8px"
spacing:
  "1": "4px"
  "2": "8px"
  "3": "12px"
  "4": "16px"
  "5": "20px"
  "6": "24px"
  "8": "32px"
components:
  app-bar:
    backgroundColor: "{colors.surface}"
    height: "48px"
    typography: "{typography.title}"
    textColor: "{colors.text}"
  icon-button:
    size: "44px"
    rounded: "{rounded.sm}"
  search-field:
    size: "44px"
    height: "48px"
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.md}"
    typography: "{typography.body}"
    textColor: "{colors.text}"
  district-chip:
    size: "44px"
    backgroundColor: "{colors.surface}"
    typography: "{typography.label}"
    textColor: "{colors.text}"
    rounded: "{rounded.sm}"
  result-summary:
    typography: "{typography.label}"
    textColor: "{colors.text-muted}"
    height: "44px"
  stale-banner:
    backgroundColor: "{colors.warning-soft}"
    textColor: "{colors.warning}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "{spacing.3}"
  group-header:
    backgroundColor: "{colors.surface-sunken}"
    typography: "{typography.label}"
    textColor: "{colors.text}"
  parking-row:
    size: "96px"
    backgroundColor: "{colors.surface}"
  availability-count:
    textColor: "{colors.text}"
  timestamp:
    typography: "{typography.label}"
    textColor: "{colors.text-muted}"
  no-realtime-tag:
    backgroundColor: "{colors.surface-sunken}"
    typography: "{typography.label}"
    textColor: "{colors.text}"
    rounded: "{rounded.sm}"
  bus-only-tag:
    backgroundColor: "{colors.surface}"
    typography: "{typography.label}"
    textColor: "{colors.text}"
    rounded: "{rounded.sm}"
  button:
    size: "44px"
    backgroundColor: "{colors.brand}"
    textColor: "{colors.on-brand}"
    rounded: "{rounded.sm}"
  state-message:
    backgroundColor: "{colors.surface-sunken}"
    textColor: "{colors.text}"
    rounded: "{rounded.md}"
    padding: "{spacing.5}"
  skeleton-row:
    backgroundColor: "{colors.surface-sunken}"
    size: "96px"
    rounded: "{rounded.sm}"
  detail-hero:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    padding: "{spacing.4}"
  detail-section:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
  phone-link:
    size: "44px"
    textColor: "{colors.brand}"
    typography: "{typography.body}"
  source-note:
    backgroundColor: "{colors.surface-sunken}"
    typography: "{typography.caption}"
    textColor: "{colors.text-muted}"
    padding: "{spacing.4}"
---

# seoul-parking 디자인 시스템

> `design-harness design-md`가 `tokens.json`·`components.json`·`copy.json`에서 만든 파일이다. 여기를 고치지 말고 원본을 고친 뒤 다시 만든다.

## Overview

서울 공영주차장 빈자리 확인(휴대폰 웹, 360px부터). 방향: 도로 주차 표지판의 청색 판과 흰 글자를 빌린 '안내판' 언어 — 둥근 카드와 그림자 대신 구분선으로 나눈 단일 열 행, 빈자리 숫자는 크게, 기준 시각은 숫자 바로 옆. 상태는 색 + 글자 + 아이콘을 함께 쓰고 색만으로 구분하지 않는다. primitive(값) -> semantic(의도) 두 층이며 화면·코드는 semantic만 쓴다.

문구 톤: 해요체로 짧고 담담하게. 데이터가 말하는 만큼만 말하고(숫자에는 늘 기준 시각을 붙인다), 사용자를 탓하지 않으며 다음 행동을 한 가지 알려 준다.

## Colors

코드와 화면은 아래 semantic 색만 쓴다. primitive 값은 출처로만 적는다.

- **brand** (#0A4A94) ← `primitive.color.sign-blue-800`
- **brand-soft** (#E6EEF8) ← `primitive.color.sign-blue-50`
- **on-brand** (#FFFFFF) ← `primitive.color.paper-0`
- **text** (#16202A) ← `primitive.color.ink-900`
- **text-muted** (#475563) ← `primitive.color.ink-600`
- **surface** (#FFFFFF) ← `primitive.color.paper-0`
- **surface-sunken** (#F2F4F6) ← `primitive.color.paper-50`
- **border** (#D3DAE1) ← `primitive.color.ink-200`
- **border-strong** (#7A8794) ← `primitive.color.ink-400`
- **warning** (#6E4300) ← `primitive.color.amber-800`
- **warning-soft** (#FFF1D6) ← `primitive.color.amber-50`
- **danger** (#B0261C) ← `primitive.color.red-800`
- **danger-soft** (#FCEBEA) ← `primitive.color.red-50`
- **focus** (#0A4A94) ← `primitive.color.sign-blue-800`
- **primary**: `color.brand`의 별칭 (DESIGN.md의 대표 색 자리)

지켜야 할 명도 대비:

- `color.text` / `color.surface`: 4.5:1 이상 (현재 16.48:1)
- `color.text-muted` / `color.surface`: 4.5:1 이상 (현재 7.64:1)
- `color.text` / `color.surface-sunken`: 4.5:1 이상 (현재 14.95:1)
- `color.text-muted` / `color.surface-sunken`: 4.5:1 이상 (현재 6.93:1)
- `color.on-brand` / `color.brand`: 4.5:1 이상 (현재 8.68:1)
- `color.brand` / `color.surface`: 4.5:1 이상 (현재 8.68:1)
- `color.brand` / `color.brand-soft`: 4.5:1 이상 (현재 7.42:1)
- `color.text` / `color.brand-soft`: 4.5:1 이상 (현재 14.09:1)
- `color.warning` / `color.warning-soft`: 4.5:1 이상 (현재 7.63:1)
- `color.text` / `color.warning-soft`: 4.5:1 이상 (현재 14.76:1)
- `color.warning` / `color.surface`: 4.5:1 이상 (현재 8.52:1)
- `color.danger` / `color.danger-soft`: 4.5:1 이상 (현재 5.80:1)
- `color.text` / `color.danger-soft`: 4.5:1 이상 (현재 14.29:1)
- `color.danger` / `color.surface`: 4.5:1 이상 (현재 6.69:1)
- `color.border-strong` / `color.surface`: 3:1 이상 (현재 3.67:1)
- `color.focus` / `color.surface`: 3:1 이상 (현재 8.68:1)
- `color.brand` / `color.surface-sunken`: 3:1 이상 (현재 7.87:1)

## Typography

- 글꼴: IBM Plex Sans KR, Noto Sans KR, Apple SD Gothic Neo, sans-serif (`font-family.base`, 토큰에는 첫 글꼴만 적는다)
- `font-size.caption`: 13px
- `font-size.label`: 15px
- `font-size.body`: 16px
- `font-size.title`: 18px
- `font-size.heading`: 22px
- `font-size.count`: 32px
- `font-size.count-lg`: 48px
- `font-weight.regular`: 400
- `font-weight.semibold`: 600
- `font-weight.bold`: 700
- `line-height.tight`: 1.15
- `line-height.snug`: 1.35
- `line-height.body`: 1.5

굵기와 행간은 tokens.json에서 글자 크기와 짝지어 정하지 않았으므로 front matter의 typography에는 크기와 글꼴만 있다.

## Layout

- 격자: 기준 4px, 좌우 여백 16px, 4열, 열 간격 12px
- `space.1`: 4px
- `space.2`: 8px
- `space.3`: 12px
- `space.4`: 16px
- `space.5`: 20px
- `space.6`: 24px
- `space.8`: 32px
- `size.touch`: 44px
- `size.header`: 48px
- `size.input`: 48px
- `size.row`: 96px
- `size.icon`: 20px
- `size.icon-lg`: 24px
- `size.focus-ring`: 2px

## Shapes

- `radius.sm`: 4px
- `radius.md`: 8px
- 토큰 밖에서 허용하는 모서리: 0px

## Components

- **AppBar** (`app-bar`): 변형 list, detail
  - weight: `font-weight.bold` (700)
  - divider: `color.border` (#D3DAE1)
  - paddingX: `space.4` (16px)
  - list: 제목 '서울 공영주차장 빈자리' + 오른쪽 RefreshButton. detail: 왼쪽 BackButton + 주차장 이름(한 줄 말줄임) + 오른쪽 RefreshButton. 스크롤 시 상단 고정.
- **IconButton** (`icon-button`): 누를 수 있음, 변형 refresh, back
  - icon: `color.brand` (#0A4A94)
  - iconSize: `size.icon-lg` (24px)
  - pressed: `color.brand-soft` (#E6EEF8)
  - focus: `color.focus` (#0A4A94)
  - 아이콘만 보이지만 접근 이름 필수(refresh: '새로고침', back: '목록으로'). busy: 새로고침 중 아이콘 회전 + 접근 이름 '불러오는 중', 중복 탭 무시.
- **SearchField** (`search-field`): 누를 수 있음, 변형 empty, filled
  - border: `color.border-strong` (#7A8794)
  - focus: `color.focus` (#0A4A94)
  - placeholder: `color.text-muted` (#475563)
  - icon: `color.text-muted` (#475563)
  - paddingX: `space.3` (12px)
  - 왼쪽 돋보기 아이콘, placeholder '이름이나 주소로 찾기'. filled: 오른쪽에 44px 지우기 버튼(접근 이름 '검색어 지우기'). 이름·주소 부분 일치, 입력하는 대로 걸러 냄. 구 필터와 함께 적용.
- **DistrictChip** (`district-chip`): 누를 수 있음, 변형 default, selected
  - border: `color.border-strong` (#7A8794)
  - selectedFill: `color.brand-soft` (#E6EEF8)
  - selectedText: `color.brand` (#0A4A94)
  - selectedBorder: `color.brand` (#0A4A94)
  - paddingX: `space.3` (12px)
  - gap: `space.2` (8px)
  - focus: `color.focus` (#0A4A94)
  - 가로 스크롤 한 줄, 첫 칩 '전체' 다음 데이터에 있는 구만(가나다순). selected는 색과 함께 체크 아이콘 + 굵기(font-weight.semibold) + aria-pressed=true. 칩 라벨에 구별 개수를 붙이지 않는다(목록 결과 건수로 보여 줌).
- **ResultSummary** (`result-summary`)
  - paddingX: `space.4` (16px)
  - '{count}곳' + '{HH:MM}에 불러옴'. count는 필터·검색 후 실제 건수.
- **StaleBanner** (`stale-banner`): 변형 list, detail
  - border: `color.warning` (#6E4300)
  - icon: `color.warning` (#6E4300)
  - iconSize: `size.icon` (20px)
  - gap: `space.2` (8px)
  - 기준 시각이 20분을 넘은 경우만 표시. 경고 삼각 아이콘 + 글자 + 오른쪽 Button(secondary) '새로고침'. 목록에서는 표시 중인 연계 주차장 가운데 하나라도 20분을 넘으면 띠 1개만 보이고, 해당 행은 Timestamp stale로 따로 표시.
- **GroupHeader** (`group-header`)
  - weight: `font-weight.semibold` (600)
  - paddingX: `space.4` (16px)
  - 구 묶음 제목 '{구} {n}곳'. 높이 40px(space.8 + space.2), 스크롤 중 상단 바 아래 고정. 순번 표식(01/02)이나 영문 대문자 라벨 쓰지 않음.
- **ParkingRow** (`parking-row`): 누를 수 있음, 변형 realtime, full, stale, no-realtime, bus-only
  - pressed: `color.brand-soft` (#E6EEF8)
  - name: `font-size.title` (18px)
  - nameColor: `color.text` (#16202A)
  - address: `font-size.label` (15px)
  - addressColor: `color.text-muted` (#475563)
  - divider: `color.border` (#D3DAE1)
  - paddingX: `space.4` (16px)
  - paddingY: `space.3` (12px)
  - gap: `space.2` (8px)
  - focus: `color.focus` (#0A4A94)
  - 왼쪽: 이름(2줄까지) / 구·주소(1줄 말줄임). 오른쪽: AvailabilityCount + Timestamp를 한 덩어리로 세로 정렬, 숫자 오른쪽 맞춤. 행 전체가 상세로 가는 링크. 둥근 카드·그림자 없이 구분선으로 나눔. bus-only: 숫자 대신 BusOnlyTag, 연계 여부와 관계없이 구분 표시.
- **AvailabilityCount** (`availability-count`): 변형 realtime, full, no-realtime
  - count: `font-size.count` (32px)
  - countLarge: `font-size.count-lg` (48px)
  - weight: `font-weight.bold` (700)
  - lineHeight: `line-height.tight` (1.15)
  - unit: `font-size.label` (15px)
  - unitColor: `color.text-muted` (#475563)
  - realtime: '빈자리' 라벨 + 큰 숫자(TPKCT - NOW_PRK_VHCL_CNT) + '/ 총 {TPKCT}면'. full: 빈자리 계산이 0 이하일 때 숫자 '0' + 글자 '만차'(음수는 표시하지 않음 — 처리 방식은 사람 확인 필요). no-realtime(PRK_STTS_YN=0): 숫자 자리를 NoRealtimeTag로 대체하고 0, '-', 빈칸을 쓰지 않는다. 여유/혼잡 같은 임계값 색은 데이터 근거가 없어 쓰지 않는다. 숫자는 tabular-nums.
- **Timestamp** (`timestamp`): 변형 fresh, stale
  - staleColor: `color.warning` (#6E4300)
  - icon: `size.icon` (20px)
  - gap: `space.1` (4px)
  - 항상 빈자리 숫자 바로 아래/옆. fresh: 시계 아이콘 + '{HH:MM} 기준'. stale(20분 초과): 경고 아이콘 + '{HH:MM} 기준 · 20분 넘음', 색 warning, 굵기 semibold. 오늘이 아니면 '{M}월 {D}일 {HH:MM} 기준'. NOW_PRK_VHCL_UPDT_TM 값을 그대로 쓰고 지어내지 않는다.
- **NoRealtimeTag** (`no-realtime-tag`)
  - border: `color.border-strong` (#7A8794)
  - icon: `size.icon` (20px)
  - paddingX: `space.2` (8px)
  - 점선 테두리 + 줄 그은 신호 아이콘 + '실시간 정보 없음'. 숫자처럼 보이지 않게 숫자 크기를 쓰지 않는다. 상세에서는 아래에 '총 {TPKCT}면'만 따로 표시.
- **BusOnlyTag** (`bus-only-tag`)
  - border: `color.border-strong` (#7A8794)
  - subColor: `color.text-muted` (#475563)
  - icon: `size.icon` (20px)
  - paddingX: `space.2` (8px)
  - 버스 아이콘 + '버스전용', 아래 보조 글 '승용차 해당 없음'(text-muted). OPER_SE_NM이 버스전용인 주차장.
- **Button** (`button`): 누를 수 있음, 변형 primary, secondary
  - fontSize: `font-size.label` (15px)
  - weight: `font-weight.semibold` (600)
  - secondaryFill: `color.surface` (#FFFFFF)
  - secondaryText: `color.brand` (#0A4A94)
  - secondaryBorder: `color.brand` (#0A4A94)
  - paddingX: `space.4` (16px)
  - focus: `color.focus` (#0A4A94)
  - primary: 오류 상태의 '다시 시도'. secondary: 경고 띠의 '새로고침'. busy: 글자 '불러오는 중…'으로 바꾸고 비활성.
- **StateMessage** (`state-message`): 변형 loading, empty, error
  - errorFill: `color.danger-soft` (#FCEBEA)
  - title: `font-size.body` (16px)
  - titleWeight: `font-weight.semibold` (600)
  - errorColor: `color.danger` (#B0261C)
  - body: `font-size.label` (15px)
  - muted: `color.text-muted` (#475563)
  - icon: `size.icon-lg` (24px)
  - gap: `space.2` (8px)
  - 목록 영역을 대체(와이어프레임 상태 영역). loading: SkeletonRow 4개 + 화면 낭독용 '불러오는 중'. empty: 돋보기 아이콘 + 제목 + 검색어/구 안내 + Button(secondary) '검색 지우기'. error: 경고 아이콘(danger) + 제목 + 설명 + Button(primary) '다시 시도'. 이전에 받은 목록이 있으면 error는 StaleBanner 위치에 띠로 띄우고 목록은 남긴다.
- **SkeletonRow** (`skeleton-row`)
  - divider: `color.border` (#D3DAE1)
  - ParkingRow와 같은 높이의 회색 막대. 숫자 자리에 0을 미리 넣지 않는다. 움직임 줄이기 설정이면 깜빡임 없음.
- **DetailHero** (`detail-hero`): 변형 realtime, full, stale, no-realtime, bus-only
  - name: `font-size.heading` (22px)
  - weight: `font-weight.bold` (700)
  - gap: `space.2` (8px)
  - divider: `color.border` (#D3DAE1)
  - 주차장 이름 + 구분 태그(노상/노외, 버스전용) + AvailabilityCount(detail) + Timestamp. stale이면 바로 아래 StaleBanner(detail).
- **DetailSection** (`detail-section`)
  - title: `font-size.title` (18px)
  - weight: `font-weight.semibold` (600)
  - divider: `color.border` (#D3DAE1)
  - paddingX: `space.4` (16px)
  - paddingY: `space.4` (16px)
  - gap: `space.3` (12px)
  - 전화·주소, 운영시간, 요금, 유형·구분, 토·공휴일·야간 순. 섹션 제목에 번호를 붙이지 않는다.
- **InfoRow** (`info-row`): 변형 value, unknown, hidden
  - label: `font-size.label` (15px)
  - labelColor: `color.text-muted` (#475563)
  - value: `font-size.body` (16px)
  - valueColor: `color.text` (#16202A)
  - gap: `space.3` (12px)
  - paddingY: `space.2` (8px)
  - 왼쪽 라벨(고정 폭 96px) / 오른쪽 값. unknown: 운영시간 '0000~0000' 등 의미 불명 값은 '정보 없음'(text-muted + 물음표 아이콘 없이 글자만). hidden: DAY_MAX_CRG=0이면 행 자체를 그리지 않는다('없음'으로 쓰지 않음). '0000~2400'은 '24시간'.
- **PhoneLink** (`phone-link`): 누를 수 있음
  - weight: `font-weight.semibold` (600)
  - icon: `size.icon` (20px)
  - pressed: `color.brand-soft` (#E6EEF8)
  - focus: `color.focus` (#0A4A94)
  - 전화 아이콘 + 번호(tel: 링크), 밑줄. TELNO가 비면 InfoRow unknown '정보 없음'으로 바꾸고 링크를 만들지 않는다.
- **SourceNote** (`source-note`)
  - 목록·상세 하단 고정 문구(copy.json examples.source).

## Do's and Don'ts

- Do: primitive 값 대신 semantic 토큰을 쓴다.
- Do: 누를 수 있는 요소는 44px 이상으로 만든다.
- Do: 버튼 문구는 6자 이내로 쓴다.
- Don't: 「확실」 표현을 쓰지 않는다.
- Don't: 「보장」 표현을 쓰지 않는다.
- Don't: 「정확한」 표현을 쓰지 않는다.
- Don't: 「100%」 표현을 쓰지 않는다.
- Don't: 「최신 정보」 표현을 쓰지 않는다.
- Don't: 「지금 바로 주차」 표현을 쓰지 않는다.
- Don't: 「자리 있어요」 표현을 쓰지 않는다.
- Don't: 「LIVE」 표현을 쓰지 않는다.
- Don't: 「Error」 표현을 쓰지 않는다.
- Don't: 「실패하였습니다」 표현을 쓰지 않는다.
- Don't: 「오류가 발생하였습니다」 표현을 쓰지 않는다.
- Don't: 「잠시만 기다려 주십시오」 표현을 쓰지 않는다.
- Don't: 「!!」 표현을 쓰지 않는다.
- Don't: 「빈자리 없음」 표현을 쓰지 않는다.

## 문구 예

| 자리 | 문구 |
|---|---|
| appTitle | 서울 공영주차장 빈자리 |
| searchPlaceholder | 이름이나 주소로 찾기 |
| chipAll | 전체 |
| resultSummary | {count}곳 · {HH:MM}에 불러옴 |
| groupHeader | {district} {count}곳 |
| availableLabel | 빈자리 |
| availableCount | {available} / 총 {total}면 |
| full | 만차 |
| timestamp | {HH:MM} 기준 |
| timestampStale | {HH:MM} 기준 · 20분 넘음 |
| staleBanner | 20분 넘게 지난 숫자가 있어요. 새로고침해 보세요. |
| staleBannerDetail | 20분 넘게 지난 숫자예요. 지금은 다를 수 있어요. |
| noRealtime | 실시간 정보 없음 |
| noRealtimeDetail | 이 주차장은 빈자리 수를 보내지 않아요. 총 {total}면 |
| busOnly | 버스전용 |
| busOnlySub | 승용차 해당 없음 |
| loading | 불러오는 중… |
| emptyTitle | 찾는 주차장이 없어요 |
| emptyBody | '{query}'와 맞는 이름·주소가 없어요. 구를 '전체'로 바꾸거나 다른 말로 찾아보세요. |
| emptyAction | 검색 지우기 |
| errorTitle | 주차장 정보를 불러오지 못했어요 |
| errorBody | 인터넷 연결을 확인하고 다시 시도해 주세요. |
| errorInline | 새 정보를 불러오지 못했어요. {HH:MM} 기준 목록을 보여 드려요. |
| retry | 다시 시도 |
| refresh | 새로고침 |
| back | 목록으로 |
| clearSearch | 검색어 지우기 |
| call | 전화 걸기 |
| unknown | 정보 없음 |
| hours24 | 24시간 |
| sectionContact | 전화·주소 |
| sectionHours | 운영시간 |
| sectionFee | 요금 |
| sectionType | 유형·구분 |
| sectionHoliday | 토요일·공휴일·야간 |
| source | 출처: 서울 열린데이터광장, 서울시 시영주차장 실시간 주차대수 정보 (공공누리 제1유형) |
