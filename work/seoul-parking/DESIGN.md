---
version: "alpha"
name: "seoul-parking"
description: "seoul-parking 토큰. primitive(값) -> semantic(의도). 화면·코드는 semantic만 쓴다. 원칙: 지도와 화면 틀(검색창·버튼·시트)은 무채색, 채도 있는 색은 빈자리 기둥(데이터)에만 쓴다. 기둥 색은 빈자리 비율 구간이고 항상 숫자 라벨을 같이 보인다."
colors:
  primary: "{colors.brand}"
  brand: "#15191E"
  action: "#15191E"
  on-action: "#FFFFFF"
  text: "#15191E"
  text-muted: "#4B525B"
  text-disabled: "#5A616A"
  surface: "#FFFFFF"
  surface-sunken: "#F3F4F6"
  skeleton: "#E4E7EA"
  border: "#DADDE1"
  border-float: "#B9BEC5"
  focus: "#15191E"
  inverse: "#15191E"
  on-inverse: "#FFFFFF"
  danger: "#B42318"
  danger-soft: "#FDECEA"
  badge-stale-bg: "#FFFFFF"
  badge-stale-text: "#15191E"
  badge-stale-border: "#15191E"
  badge-muted-bg: "#ECEEF1"
  badge-muted-text: "#3A4048"
  map-ground: "#EEF0F2"
  map-building: "#DADDE1"
  map-building-front: "#E4E7EA"
  map-building-side: "#ECEEF1"
  map-shadow: "#15191E"
  map-road: "#FFFFFF"
  map-water: "#ECEEF1"
  map-label: "#5A616A"
  column-plenty: "#0B7A5E"
  column-some: "#A86F00"
  column-few: "#C2410C"
  column-full: "#B0124A"
  column-no-realtime: "#6A717A"
  column-face-plenty-top: "#2D8D75"
  column-face-plenty-side: "#085D47"
  column-face-some-top: "#B17D1A"
  column-face-some-side: "#805400"
  column-face-few-top: "#CB5C2E"
  column-face-few-side: "#933109"
  column-face-full-top: "#BB3363"
  column-face-full-side: "#860E38"
  column-face-no-realtime-top: "#80868E"
  column-face-no-realtime-side: "#4B525B"
  leader: "#4B525B"
typography:
  caption:
    fontFamily: "Noto Sans KR"
    fontSize: "12px"
  label:
    fontFamily: "Noto Sans KR"
    fontSize: "14px"
  body:
    fontFamily: "Noto Sans KR"
    fontSize: "16px"
  title:
    fontFamily: "Noto Sans KR"
    fontSize: "20px"
  headline:
    fontFamily: "Noto Sans KR"
    fontSize: "28px"
  display:
    fontFamily: "Noto Sans KR"
    fontSize: "44px"
rounded:
  tag: "4px"
  sheet: "20px"
  pill: "999px"
spacing:
  "1": "4px"
  "2": "8px"
  "3": "12px"
  "4": "16px"
  "5": "20px"
  "6": "24px"
  "8": "32px"
components:
  floating-search-bar:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-muted}"
    rounded: "{rounded.pill}"
    size: "44px"
    height: "48px"
    typography: "{typography.body}"
  view-toggle:
    backgroundColor: "{colors.action}"
    textColor: "{colors.on-action}"
    rounded: "{rounded.pill}"
    size: "44px"
    typography: "{typography.label}"
  map-fab:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.pill}"
    size: "44px"
  updated-at:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-muted}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
  vacancy-column:
    size: "44px"
  column-label:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.tag}"
    size: "44px"
    typography: "{typography.title}"
  map-legend:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-muted}"
    typography: "{typography.label}"
    rounded: "{rounded.tag}"
    padding: "{spacing.3}"
  attribution-chip:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-muted}"
    typography: "{typography.caption}"
    rounded: "{rounded.pill}"
  bottom-sheet:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.sheet}"
    padding: "{spacing.4}"
  sheet-handle:
    size: "44px"
    height: "44px"
    rounded: "{rounded.pill}"
  detail-vacancy:
    textColor: "{colors.text}"
    typography: "{typography.display}"
  info-row:
    textColor: "{colors.text}"
    typography: "{typography.body}"
  button:
    backgroundColor: "{colors.action}"
    textColor: "{colors.on-action}"
    rounded: "{rounded.pill}"
    size: "44px"
    height: "48px"
    typography: "{typography.body}"
  list-item:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    size: "44px"
    height: "96px"
  sort-toggle:
    backgroundColor: "{colors.action}"
    textColor: "{colors.on-action}"
    rounded: "{rounded.pill}"
    size: "44px"
    typography: "{typography.label}"
  status-badge:
    backgroundColor: "{colors.badge-muted-bg}"
    textColor: "{colors.badge-muted-text}"
    rounded: "{rounded.tag}"
    typography: "{typography.label}"
  error-banner:
    backgroundColor: "{colors.danger-soft}"
    textColor: "{colors.text}"
    rounded: "{rounded.tag}"
    padding: "{spacing.3}"
    typography: "{typography.body}"
  toast:
    backgroundColor: "{colors.inverse}"
    textColor: "{colors.on-inverse}"
    rounded: "{rounded.tag}"
    padding: "{spacing.3}"
    typography: "{typography.body}"
  state-message:
    textColor: "{colors.text}"
    typography: "{typography.body}"
  skeleton:
    backgroundColor: "{colors.skeleton}"
    rounded: "{rounded.tag}"
  search-field:
    backgroundColor: "{colors.surface-sunken}"
    textColor: "{colors.text}"
    rounded: "{rounded.pill}"
    size: "44px"
    height: "48px"
    typography: "{typography.body}"
  icon-button:
    size: "44px"
    rounded: "{rounded.pill}"
  search-result-row:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    size: "44px"
    typography: "{typography.body}"
---

# seoul-parking 디자인 시스템

> `design-harness design-md`가 `tokens.json`·`components.json`·`copy.json`에서 만든 파일이다. 여기를 고치지 말고 원본을 고친 뒤 다시 만든다.

## Overview

seoul-parking 토큰. primitive(값) -> semantic(의도). 화면·코드는 semantic만 쓴다. 원칙: 지도와 화면 틀(검색창·버튼·시트)은 무채색, 채도 있는 색은 빈자리 기둥(데이터)에만 쓴다. 기둥 색은 빈자리 비율 구간이고 항상 숫자 라벨을 같이 보인다.

문구 톤: 합니다체, 짧고 사실만. 숫자와 기준 시각을 먼저 말하고, 사용자를 탓하지 않고 다음 행동 하나를 알려 준다.

## Colors

코드와 화면은 아래 semantic 색만 쓴다. primitive 값은 출처로만 적는다.

- **brand** (#15191E) ← `primitive.color.ink-900`
- **action** (#15191E) ← `primitive.color.ink-900`
- **on-action** (#FFFFFF) ← `primitive.color.white`
- **text** (#15191E) ← `primitive.color.ink-900`
- **text-muted** (#4B525B) ← `primitive.color.ink-600`
- **text-disabled** (#5A616A) ← `primitive.color.ink-550`
- **surface** (#FFFFFF) ← `primitive.color.white`
- **surface-sunken** (#F3F4F6) ← `primitive.color.ink-50`
- **skeleton** (#E4E7EA) ← `primitive.color.ink-150`
- **border** (#DADDE1) ← `primitive.color.ink-200`
- **border-float** (#B9BEC5) ← `primitive.color.ink-300`
- **focus** (#15191E) ← `primitive.color.ink-900`
- **inverse** (#15191E) ← `primitive.color.ink-900`
- **on-inverse** (#FFFFFF) ← `primitive.color.white`
- **danger** (#B42318) ← `primitive.color.red-700`
- **danger-soft** (#FDECEA) ← `primitive.color.red-50`
- **badge.stale-bg** (#FFFFFF) ← `primitive.color.white`
- **badge.stale-text** (#15191E) ← `primitive.color.ink-900`
- **badge.stale-border** (#15191E) ← `primitive.color.ink-900`
- **badge.muted-bg** (#ECEEF1) ← `primitive.color.ink-100`
- **badge.muted-text** (#3A4048) ← `primitive.color.ink-700`
- **map.ground** (#EEF0F2) ← `primitive.color.ink-75`
- **map.building** (#DADDE1) ← `primitive.color.ink-200`
- **map.building-front** (#E4E7EA) ← `primitive.color.ink-150`
- **map.building-side** (#ECEEF1) ← `primitive.color.ink-100`
- **map.shadow** (#15191E) ← `primitive.color.ink-900`
- **map.road** (#FFFFFF) ← `primitive.color.white`
- **map.water** (#ECEEF1) ← `primitive.color.ink-100`
- **map.label** (#5A616A) ← `primitive.color.ink-550`
- **column.plenty** (#0B7A5E) ← `primitive.color.teal-700`
- **column.some** (#A86F00) ← `primitive.color.amber-700`
- **column.few** (#C2410C) ← `primitive.color.orange-700`
- **column.full** (#B0124A) ← `primitive.color.crimson-700`
- **column.no-realtime** (#6A717A) ← `primitive.color.ink-500`
- **column.face.plenty-top** (#2D8D75) ← `primitive.color.teal-600`
- **column.face.plenty-side** (#085D47) ← `primitive.color.teal-800`
- **column.face.some-top** (#B17D1A) ← `primitive.color.amber-600`
- **column.face.some-side** (#805400) ← `primitive.color.amber-800`
- **column.face.few-top** (#CB5C2E) ← `primitive.color.orange-600`
- **column.face.few-side** (#933109) ← `primitive.color.orange-800`
- **column.face.full-top** (#BB3363) ← `primitive.color.crimson-600`
- **column.face.full-side** (#860E38) ← `primitive.color.crimson-800`
- **column.face.no-realtime-top** (#80868E) ← `primitive.color.ink-400`
- **column.face.no-realtime-side** (#4B525B) ← `primitive.color.ink-600`
- **leader** (#4B525B) ← `primitive.color.ink-600`
- **primary**: `color.brand`의 별칭 (DESIGN.md의 대표 색 자리)

지켜야 할 명도 대비:

- `color.text` / `color.surface`: 4.5:1 이상 (현재 17.65:1)
- `color.text-muted` / `color.surface`: 4.5:1 이상 (현재 7.90:1)
- `color.text-disabled` / `color.surface`: 4.5:1 이상 (현재 6.26:1)
- `color.text` / `color.surface-sunken`: 4.5:1 이상 (현재 16.04:1)
- `color.text-muted` / `color.surface-sunken`: 4.5:1 이상 (현재 7.18:1)
- `color.text-disabled` / `color.surface-sunken`: 4.5:1 이상 (현재 5.69:1)
- `color.on-action` / `color.action`: 4.5:1 이상 (현재 17.65:1)
- `color.on-inverse` / `color.inverse`: 4.5:1 이상 (현재 17.65:1)
- `color.danger` / `color.danger-soft`: 4.5:1 이상 (현재 5.75:1)
- `color.text` / `color.danger-soft`: 4.5:1 이상 (현재 15.44:1)
- `color.danger` / `color.surface`: 4.5:1 이상 (현재 6.57:1)
- `color.badge.stale-text` / `color.badge.stale-bg`: 4.5:1 이상 (현재 17.65:1)
- `color.badge.muted-text` / `color.badge.muted-bg`: 4.5:1 이상 (현재 9.00:1)
- `color.map.label` / `color.map.ground`: 4.5:1 이상 (현재 5.48:1)
- `color.map.label` / `color.map.building`: 4.5:1 이상 (현재 4.60:1)
- `color.map.label` / `color.map.water`: 4.5:1 이상 (현재 5.39:1)
- `color.column.plenty` / `color.map.ground`: 3:1 이상 (현재 4.64:1)
- `color.column.some` / `color.map.ground`: 3:1 이상 (현재 3.72:1)
- `color.column.few` / `color.map.ground`: 3:1 이상 (현재 4.53:1)
- `color.column.full` / `color.map.ground`: 3:1 이상 (현재 6.06:1)
- `color.column.no-realtime` / `color.map.ground`: 3:1 이상 (현재 4.32:1)
- `color.column.plenty` / `color.map.building`: 3:1 이상 (현재 3.89:1)
- `color.column.some` / `color.map.building`: 3:1 이상 (현재 3.12:1)
- `color.column.few` / `color.map.building`: 3:1 이상 (현재 3.80:1)
- `color.column.full` / `color.map.building`: 3:1 이상 (현재 5.08:1)
- `color.column.no-realtime` / `color.map.building`: 3:1 이상 (현재 3.62:1)
- `color.column.plenty` / `color.surface`: 3:1 이상 (현재 5.30:1)
- `color.column.some` / `color.surface`: 3:1 이상 (현재 4.25:1)
- `color.column.few` / `color.surface`: 3:1 이상 (현재 5.18:1)
- `color.column.full` / `color.surface`: 3:1 이상 (현재 6.93:1)
- `color.focus` / `color.surface`: 3:1 이상 (현재 17.65:1)
- `color.focus` / `color.map.ground`: 3:1 이상 (현재 15.45:1)
- `color.action` / `color.surface-sunken`: 3:1 이상 (현재 16.04:1)
- `color.column.face.plenty-top` / `color.map.ground`: 3:1 이상 (현재 3.55:1)
- `color.column.face.plenty-side` / `color.map.ground`: 3:1 이상 (현재 6.89:1)
- `color.column.face.some-top` / `color.map.ground`: 3:1 이상 (현재 3.16:1)
- `color.column.face.some-side` / `color.map.ground`: 3:1 이상 (현재 5.77:1)
- `color.column.face.few-top` / `color.map.ground`: 3:1 이상 (현재 3.60:1)
- `color.column.face.few-side` / `color.map.ground`: 3:1 이상 (현재 6.85:1)
- `color.column.face.full-top` / `color.map.ground`: 3:1 이상 (현재 4.88:1)
- `color.column.face.full-side` / `color.map.ground`: 3:1 이상 (현재 8.62:1)
- `color.column.face.no-realtime-top` / `color.map.ground`: 3:1 이상 (현재 3.21:1)
- `color.column.face.no-realtime-side` / `color.map.ground`: 3:1 이상 (현재 6.92:1)
- `color.column.plenty` / `color.map.building-front`: 3:1 이상 (현재 4.27:1)
- `color.column.some` / `color.map.building-front`: 3:1 이상 (현재 3.43:1)
- `color.column.few` / `color.map.building-front`: 3:1 이상 (현재 4.17:1)
- `color.column.full` / `color.map.building-front`: 3:1 이상 (현재 5.58:1)
- `color.column.no-realtime` / `color.map.building-front`: 3:1 이상 (현재 3.98:1)
- `color.map.label` / `color.map.building-front`: 4.5:1 이상 (현재 5.05:1)
- `color.column.plenty` / `color.map.building-side`: 3:1 이상 (현재 4.56:1)
- `color.column.some` / `color.map.building-side`: 3:1 이상 (현재 3.66:1)
- `color.column.few` / `color.map.building-side`: 3:1 이상 (현재 4.46:1)
- `color.column.full` / `color.map.building-side`: 3:1 이상 (현재 5.96:1)
- `color.column.no-realtime` / `color.map.building-side`: 3:1 이상 (현재 4.25:1)
- `color.map.label` / `color.map.building-side`: 4.5:1 이상 (현재 5.39:1)
- `color.leader` / `color.map.ground`: 3:1 이상 (현재 6.92:1)
- `color.leader` / `color.map.building`: 3:1 이상 (현재 5.80:1)
- `color.leader` / `color.map.building-front`: 3:1 이상 (현재 6.37:1)
- `color.leader` / `color.map.building-side`: 3:1 이상 (현재 6.80:1)
- `color.leader` / `color.map.water`: 3:1 이상 (현재 6.80:1)
- `color.leader` / `color.surface`: 3:1 이상 (현재 7.90:1)

## Typography

- 글꼴: Noto Sans KR, Apple SD Gothic Neo, sans-serif (`font-family.base`, 토큰에는 첫 글꼴만 적는다)
- `font-size.caption`: 12px
- `font-size.label`: 14px
- `font-size.body`: 16px
- `font-size.title`: 20px
- `font-size.headline`: 28px
- `font-size.display`: 44px
- `font-weight.regular`: 400
- `font-weight.medium`: 500
- `font-weight.bold`: 700
- `line-height.tight`: 1.2
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
- `size.control`: 48px
- `size.header`: 56px
- `size.list-item`: 96px
- `size.sheet-handle`: 44px
- `size.icon`: 24px
- `size.border`: 1px
- `size.focus-ring`: 2px
- `size.column-label-swatch`: 4px
- `size.column-min-height`: 24px
- `size.leader-width`: 2px
- `size.label-offset-max`: 64px
- `size.column-max-height`: 170px

## Shapes

- `radius.tag`: 4px
- `radius.sheet`: 20px
- `radius.pill`: 999px
- 토큰 밖에서 허용하는 모서리: 0px

## Components

- **FloatingSearchBar** (`floating-search-bar`): 누를 수 있음, 변형 default, pressed
  - border: `color.border-float` (#B9BEC5)
  - paddingX: `space.4` (16px)
  - pressScale: `motion.spring.press-scale` (0.96)
  - press: `motion.duration.press` (100ms)
  - 지도 위 상단 여백 16px에 떠 있음. 회색 그림자 없이 1px 테두리로 지도와 분리. 탭하면 검색 화면.
- **ViewToggle** (`view-toggle`): 누를 수 있음, 변형 map-selected, list-selected, map-disabled
  - track: `color.surface-sunken` (#F3F4F6)
  - unselected: `color.text` (#15191E)
  - disabled: `color.text-disabled` (#5A616A)
  - weight: `font-weight.bold` (700)
  - duration: `motion.duration.toggle` (200ms)
  - easing: `motion.easing.standard` (0.2, 0, 0, 1)
  - reduced: `motion.reduced.crossfade` (150ms)
  - [지도 | 목록] 알약. 채움 칸이 옆으로 미끄러지고, 화면은 높이 전환(motion.duration.view-height). 각 칸 44px 이상.
- **MapFab** (`map-fab`): 누를 수 있음, 변형 locate, locate-disabled, refresh, refreshing
  - border: `color.border-float` (#B9BEC5)
  - icon: `color.text` (#15191E)
  - size: `size.control` (48px)
  - iconSize: `size.icon` (24px)
  - spinner: `motion.duration.spinner` (900ms)
  - spinnerEasing: `motion.easing.spinner` (0, 0, 1, 1)
  - reducedSpinner: `motion.reduced.spinner` (0ms)
  - disabledFill: `color.surface-sunken` (#F3F4F6)
  - disabledIcon: `color.text-disabled` (#5A616A)
  - 우측 하단 엄지 영역, 위아래 간격 space.3. refreshing은 아이콘 회전, reduced-motion에서는 회전 대신 UpdatedAt에 '새로 받는 중'. locate-disabled(위치 권한 거부): 바탕 color.surface-sunken + 아이콘 color.text-disabled(대비 4.5:1 쌍 유지) + 사선 그은 위치 아이콘으로 모양까지 바꿔 색만으로 구분하지 않는다. aria-disabled로 포커스는 받고, 누르면 copy permission.locate.disabled 토스트. 접근성 이름 a11y.locate.disabled.
- **UpdatedAt** (`updated-at`): 변형 fresh, stale, refreshing, summary
  - paddingX: `space.3` (12px)
  - 항목별: '기준 2026-10-28 00:01:23' 형식. summary(지도 칩·목록 맨 위): copy updatedAt.summary — 화면 안 실시간 주차장 중 가장 오래된 기준 시각 '가장 오래된 정보 기준 HH:mm:ss'. 그 시각이 20분을 넘으면 뒤에 StatusBadge(stale). 숫자는 tabular-nums.
- **VacancyColumn** (`vacancy-column`): 누를 수 있음, 변형 plenty, some, few, full, stale, no-realtime
  - plenty: `color.column.plenty` (#0B7A5E)
  - some: `color.column.some` (#A86F00)
  - few: `color.column.few` (#C2410C)
  - full: `color.column.full` (#B0124A)
  - noRealtime: `color.column.no-realtime` (#6A717A)
  - plentyTop: `color.column.face.plenty-top` (#2D8D75)
  - plentySide: `color.column.face.plenty-side` (#085D47)
  - someTop: `color.column.face.some-top` (#B17D1A)
  - someSide: `color.column.face.some-side` (#805400)
  - fewTop: `color.column.face.few-top` (#CB5C2E)
  - fewSide: `color.column.face.few-side` (#933109)
  - fullTop: `color.column.face.full-top` (#BB3363)
  - fullSide: `color.column.face.full-side` (#860E38)
  - noRealtimeTop: `color.column.face.no-realtime-top` (#80868E)
  - noRealtimeSide: `color.column.face.no-realtime-side` (#4B525B)
  - shadow: `color.map.shadow` (#15191E)
  - shadowOpacity: `opacity.map-shadow` (0.08)
  - staleOpacity: `opacity.column-stale` (0.35)
  - rise: `motion.duration.column-rise` (700ms)
  - riseEasing: `motion.easing.enter` (0.05, 0.7, 0.1, 1)
  - stagger: `motion.duration.column-rise-stagger-max` (320ms)
  - heightChange: `motion.duration.height-transition` (600ms)
  - heightEasing: `motion.easing.standard` (0.2, 0, 0, 1)
  - reducedRise: `motion.reduced.column-rise` (0ms)
  - reducedHeight: `motion.reduced.height-transition` (0ms)
  - minHeight: `size.column-min-height` (24px)
  - maxHeight: `size.column-max-height` (170px)
  - MapLibre fill-extrusion. 높이=빈자리 수의 제곱근 비율(최소 높이 size.column-min-height, 최대 높이 size.column-max-height, 기준은 서울 전체 최대 빈자리로 고정 — 화면을 옮겨도 같은 빈자리는 같은 높이. 규칙은 tokens harness.map.columnHeight), 색=빈자리 비율 구간. full은 높이 0이라 바닥 원판. stale은 투명도 0.35. no-realtime은 회색, 최소 높이 고정, 숫자 없음. 탭 영역은 화면상 44px 이상. 3D 면 구성: 비스듬히 내려다볼 때 보이는 세 면 — 앞면(가장 넓음)=구간 색(color.column.*), 윗면=face.*-top(밝게), 오른쪽 옆면=face.*-side(어둡게). 광원은 화면 왼쪽 위 한 방향이라 그림자(color.map.shadow, opacity.map-shadow)는 바닥 오른쪽 아래로 떨어지고 길이는 기둥 화면 높이에 비례. 그림자는 지도 3D 물체(기둥·건물)에만 쓰고 UI 요소에는 쓰지 않는다. stale이면 세 면과 그림자 모두 opacity.column-stale 적용. full은 높이 0이라 그림자 없음.
- **ColumnLabel** (`column-label`): 누를 수 있음, 변형 plenty, some, few, full, stale, no-realtime, highlighted
  - border: `color.border-float` (#B9BEC5)
  - swatchWidth: `size.column-label-swatch` (4px)
  - weight: `font-weight.bold` (700)
  - highlight: `motion.duration.highlight` (900ms)
  - focus: `color.focus` (#15191E)
  - leader: `color.leader` (#4B525B)
  - leaderWidth: `size.leader-width` (2px)
  - offsetMax: `size.label-offset-max` (64px)
  - 기둥 꼭대기 바로 위 꼬리표. 왼쪽 4px 막대가 기둥 색. 숫자만 크게(예: 1067) — 높이·숫자가 빈자리라는 것은 범례(legend.height)가 말한다. 접근성 이름은 a11y.column('빈자리 n면' 포함). 지시선: 라벨 아래 변(비켰으면 기둥 쪽 모서리)에서 기둥 윗면 가운데까지 직선, color.leader·size.leader-width, 바로 위일 때도 짧게 그린다. 겹치면 tokens harness.map.labelDensity대로 빈자리 큰 값부터 자리를 잡고 작은 값은 지시선으로 옆으로 비켜 놓으며, 비킬 자리가 없을 때만 생략. stale은 숫자 옆 '오래됨' 배지, no-realtime은 숫자 대신 '실시간 정보 없음'(font-size.label).
- **MapLegend** (`map-legend`)
  - border: `color.border-float` (#B9BEC5)
  - plenty: `color.column.plenty` (#0B7A5E)
  - some: `color.column.some` (#A86F00)
  - few: `color.column.few` (#C2410C)
  - full: `color.column.full` (#B0124A)
  - noRealtime: `color.column.no-realtime` (#6A717A)
  - staleOpacity: `opacity.column-stale` (0.35)
  - 높이=빈자리 많을수록 높게(제곱근 비율), 색 구간 4개+회색, 흐린 기둥=오래됨(20분 초과). 색 칸마다 구간 글자 병기.
- **AttributionChip** (`attribution-chip`)
  - paddingX: `space.2` (8px)
  - 지도·목록·시트 하단. 링크로 만들면 interactive로 바꾸고 44px 확보.
- **BottomSheet** (`bottom-sheet`): 변형 peek, half, full
  - scrim: `color.inverse` (#15191E)
  - scrimOpacity: `opacity.scrim` (0.32)
  - stiffness: `motion.spring.sheet-stiffness` (380)
  - damping: `motion.spring.sheet-damping` (34)
  - mass: `motion.spring.sheet-mass` (1)
  - fallback: `motion.duration.sheet-fallback` (320ms)
  - reduced: `motion.reduced.sheet` (0ms)
  - 아래에서 스프링으로 올라옴. 뒤 지도는 해당 기둥으로 camera-to-result. full일 때만 덮개.
- **SheetHandle** (`sheet-handle`): 누를 수 있음
  - bar: `color.border-float` (#B9BEC5)
  - 보이는 막대 36x4, 끌기 영역 44px. 끌어 높이 전환, 아래로 밀면 닫힘. 키보드는 닫기 버튼으로.
- **DetailVacancy** (`detail-vacancy`): 변형 default, stale, no-realtime
  - weight: `font-weight.bold` (700)
  - lineHeight: `line-height.tight` (1.2)
  - secondary: `color.text-muted` (#4B525B)
  - secondaryText: `font-size.body` (16px)
  - '빈자리 1067 / 총 1260면 (현재 주차 193대)'. '빈자리' 글자를 큰 숫자 앞 같은 줄에(secondaryText, color.text-muted), 숫자는 display. 목록 '빈자리 {n} / 총 {total}면'과 같은 표기. no-realtime은 숫자 자리에 '실시간 정보 없음'(font-size.title).
- **InfoRow** (`info-row`)
  - label: `color.text-muted` (#4B525B)
  - divider: `color.border` (#DADDE1)
  - paddingY: `space.3` (12px)
  - 요금·운영시간·유무료. 일 최대 요금 0이면 줄 자체를 숨김.
- **Button** (`button`): 누를 수 있음, 변형 primary, secondary, disabled
  - secondaryFill: `color.surface` (#FFFFFF)
  - secondaryText: `color.text` (#15191E)
  - secondaryBorder: `color.text` (#15191E)
  - disabled: `color.text-disabled` (#5A616A)
  - weight: `font-weight.bold` (700)
  - pressScale: `motion.spring.press-scale` (0.96)
  - focus: `color.focus` (#15191E)
  - 다시 시도, 목록 보기, 전화 걸기, 길찾기. 글자 8자 이내.
- **ListItem** (`list-item`): 누를 수 있음, 변형 default, stale, no-realtime, no-location
  - divider: `color.border` (#DADDE1)
  - paddingX: `space.4` (16px)
  - gap: `space.2` (8px)
  - name: `font-size.title` (20px)
  - count: `font-size.headline` (28px)
  - meta: `color.text-muted` (#4B525B)
  - metaText: `font-size.label` (14px)
  - swatchWidth: `size.column-label-swatch` (4px)
  - 둥근 카드가 아닌 전폭 행 + 구분선. 왼쪽 4px 막대가 기둥 색(지도와 같은 부호). no-location은 정렬 맨 뒤, 거리 없음.
- **SortToggle** (`sort-toggle`): 누를 수 있음, 변형 distance, vacancy, distance-disabled
  - track: `color.surface-sunken` (#F3F4F6)
  - unselected: `color.text` (#15191E)
  - disabled: `color.text-disabled` (#5A616A)
  - duration: `motion.duration.toggle` (200ms)
  - [거리순 | 빈자리순]. 위치 거부 시 거리순 비활성.
- **StatusBadge** (`status-badge`): 변형 stale, no-realtime, no-location
  - staleFill: `color.badge.stale-bg` (#FFFFFF)
  - staleText: `color.badge.stale-text` (#15191E)
  - staleBorder: `color.badge.stale-border` (#15191E)
  - weight: `font-weight.medium` (500)
  - paddingX: `space.2` (8px)
  - 각진 꼬리표. 오래됨=흰 바탕+점선 먹색 테두리+시계, 실시간 정보 없음·지도 위치 없음=회색 바탕. 글자 항상 병기, 아이콘만 쓰지 않음.
- **ErrorBanner** (`error-banner`)
  - accent: `color.danger` (#B42318)
  - 지도 상단(검색창 아래). 안에 Button(secondary) '다시 시도'.
- **Toast** (`toast`): 변형 permission-denied, refresh-failed
  - enter: `motion.duration.toast-enter` (200ms)
  - hold: `motion.duration.toast-hold` (4000ms)
  - easing: `motion.easing.enter` (0.05, 0.7, 0.1, 1)
  - reduced: `motion.reduced.crossfade` (150ms)
  - 4초. 위치 규칙: 화면 상단, 검색창(FloatingSearchBar) 바로 아래 space.2, ErrorBanner가 있으면 그 아래. 지도 하단(범례·저작권·MapFab)과 BottomSheet·목록 항목 위에는 놓지 않는다. 토스트가 떠 있는 동안 그 영역은 ColumnLabel 배치 후보에서 빠지고, 첫 진입 카메라 도착점(permission-denied)은 토스트 영역을 카메라 위쪽 여백(padding)에 더해 기둥이 토스트 아래에 오게 한다. 목록 화면에서는 정렬 줄 바로 아래. 닫기 버튼을 넣으면 그 버튼은 IconButton.
- **StateMessage** (`state-message`): 변형 loading, empty, error, no-webgl, search-empty
  - muted: `color.text-muted` (#4B525B)
  - titleText: `font-size.title` (20px)
  - gap: `space.3` (12px)
  - 가운데 정렬 문구 + Button 하나. 그림 장식 없음.
- **Skeleton** (`skeleton`)
  - duration: `motion.duration.skeleton` (1200ms)
  - reduced: `motion.reduced.skeleton` (0ms)
- **SearchField** (`search-field`): 누를 수 있음
  - placeholder: `color.text-muted` (#4B525B)
  - focus: `color.focus` (#15191E)
  - 검색 화면 상단. 자동 포커스. 아래에 '주소·장소는 검색하지 않습니다'.
- **IconButton** (`icon-button`): 누를 수 있음, 변형 close, back
  - icon: `color.text` (#15191E)
  - iconSize: `size.icon` (24px)
  - focus: `color.focus` (#15191E)
- **SearchResultRow** (`search-result-row`): 누를 수 있음, 변형 lot, district, no-realtime, no-location
  - meta: `color.text-muted` (#4B525B)
  - divider: `color.border` (#DADDE1)
  - paddingX: `space.4` (16px)
  - metaText: `font-size.label` (14px)
  - flight: `motion.duration.camera-to-result` (1200ms)
  - flightEasing: `motion.easing.camera` (0.45, 0.05, 0.15, 1)
  - reducedFlight: `motion.reduced.camera-to-result` (0ms)
  - lot 탭: 카메라가 그 주차장으로 이동 후 ColumnLabel highlighted. district 탭: 구 전체로. no-location: 지도 이동 없이 상세만.
- **MapCamera** (`map-camera`): 변형 intro, to-result, reduced
  - flight: `motion.duration.camera-flight` (2400ms)
  - easing: `motion.easing.camera` (0.45, 0.05, 0.15, 1)
  - pitch: `map.pitch-default` (55)
  - reducedFlight: `motion.reduced.camera-flight` (0ms)
  - reducedPitch: `map.pitch-reduced` (45)
  - ground: `color.map.ground` (#EEF0F2)
  - building: `color.map.building` (#DADDE1)
  - buildingOpacity: `opacity.building` (0.9)
  - road: `color.map.road` (#FFFFFF)
  - water: `color.map.water` (#ECEEF1)
  - label: `color.map.label` (#5A616A)
  - 컴포넌트가 아닌 지도 연출 규칙. 첫 진입 서울 전체 -> 사용자 위치(거부 시 시청 근처) 비행 후 기둥 솟음. reduced-motion이면 목적지에서 바로 시작, 기둥 최종 높이로.

## Do's and Don'ts

- Do: primitive 값 대신 semantic 토큰을 쓴다.
- Do: 누를 수 있는 요소는 44px 이상으로 만든다.
- Do: 버튼 문구는 8자 이내로 쓴다.
- Don't: 「운전 중」 표현을 쓰지 않는다.
- Don't: 「운전하면서」 표현을 쓰지 않는다.
- Don't: 「운전하며」 표현을 쓰지 않는다.
- Don't: 「주행 중」 표현을 쓰지 않는다.
- Don't: 「달리면서」 표현을 쓰지 않는다.
- Don't: 「이동 중에도」 표현을 쓰지 않는다.
- Don't: 「실패하였습니다」 표현을 쓰지 않는다.
- Don't: 「오류가 발생」 표현을 쓰지 않는다.
- Don't: 「Error」 표현을 쓰지 않는다.
- Don't: 「!」 표현을 쓰지 않는다.
- Don't: 「잠시만 기다려」 표현을 쓰지 않는다.
- Don't: 「항상 최신」 표현을 쓰지 않는다.
- Don't: 「정확한 빈자리」 표현을 쓰지 않는다.
- Don't: 「보장」 표현을 쓰지 않는다.
- Don't: 「예상」 표현을 쓰지 않는다.
- Don't: 「곧 빈자리」 표현을 쓰지 않는다.
- Don't: 「앱 설치」 표현을 쓰지 않는다.
- Don't: 「앱에서 보기」 표현을 쓰지 않는다.

## 문구 예

| 자리 | 문구 |
|---|---|
| search.placeholder | 주차장 이름·구 검색 (예: 세종로, 종로구) |
| search.scope | 주소·장소는 검색하지 않습니다 |
| search.empty | ‘{검색어}’에 맞는 주차장이나 구가 없습니다 |
| search.empty.hint | 주차장 이름이나 구 이름으로 다시 검색하세요 |
| search.result.district | 종로구 · 주차장 {n}곳 |
| toggle.map | 지도 |
| toggle.list | 목록 |
| sort.distance | 거리순 |
| sort.vacancy | 빈자리순 |
| updatedAt | 기준 2026-10-28 00:01:23 |
| status.stale | 오래됨 |
| status.noRealtime | 실시간 정보 없음 |
| status.noLocation | 지도 위치 없음 |
| loading | 불러오는 중 |
| refreshing | 새로 받는 중 |
| error.title | 주차장 정보를 불러오지 못했습니다 |
| error.body | 연결을 확인한 뒤 다시 시도하세요 |
| error.retry | 다시 시도 |
| refresh.failed | 새로 받지 못했습니다. 이전 기준 시각의 숫자입니다 |
| permission.denied | 위치를 쓸 수 없어 시청 근처로 시작합니다 |
| empty.viewport | 이 화면 안에 주차장이 없습니다 |
| empty.viewport.hint | 지도를 옮기거나 목록에서 찾으세요 |
| empty.viewport.action | 목록 보기 |
| noWebgl | 이 기기에서는 3D 지도를 쓸 수 없어 목록으로 시작합니다 |
| list.item.name | 세종로 공영주차장(시) |
| list.item.district | 종로구 |
| list.item.vacancy | 빈자리 1067 / 총 1260면 |
| list.item.fee | 기본 430원/5분 |
| list.item2.name | 종묘주차장 공영주차장(시) |
| list.item2.vacancy | 빈자리 991 / 총 1312면 |
| list.item2.fee | 기본 400원/5분 |
| detail.vacancy | 빈자리 1067 / 총 1260면 (현재 주차 193대) |
| detail.fee.basic | 기본 430원/5분 |
| detail.fee.add | 추가 430원/5분 |
| detail.hours.weekday | 평일 24시간 |
| detail.hours.saturday | 토요일 24시간 |
| detail.hours.holiday | 공휴일 24시간 |
| detail.paid | 유료 |
| detail.phone | 02-2290-6566 |
| detail.call | 전화 걸기 |
| detail.directions | 길찾기 |
| detail.directions.hint | 외부 지도 앱에서 엽니다 |
| detail.noRealtime.body | 이 주차장은 실시간 주차 대수를 보내지 않습니다. 요금과 운영시간만 보입니다 |
| detail.noLocation.body | 원자료에 좌표가 없어 길찾기를 열 수 없습니다. 위 주소로 찾으세요 |
| legend.height | 높이 = 빈자리 많을수록 높게 |
| legend.color | 색 = 빈자리 비율 |
| legend.plenty | 넉넉 |
| legend.some | 보통 |
| legend.few | 적음 |
| legend.full | 0 |
| legend.stale | 흐린 기둥 = 오래됨(20분 넘음) |
| legend.noRealtime | 회색 = 실시간 정보 없음 |
| attribution | 서울 열린데이터광장 · © OpenFreeMap © OpenMapTiles © OpenStreetMap contributors |
| a11y.locate | 현위치로 이동 |
| a11y.refresh | 새로고침 |
| a11y.close | 닫기 |
| a11y.column | 세종로 공영주차장(시), 빈자리 1067면, 총 1260면, 기준 2026-10-28 00:01:23 |
| detail.hours.unknown | 공휴일 시간 정보 없음 |
| detail.address | 중구 을지로6가 17-442 |
| updatedAt.summary | 가장 오래된 정보 기준 00:01:23 |
| permission.locate.disabled | 위치 권한이 꺼져 있어 현위치를 쓸 수 없습니다 |
| a11y.locate.disabled | 현위치로 이동, 위치 권한 꺼짐 |

## 그 밖의 토큰

- `primitive.duration.0`: 0ms
- `primitive.duration.100`: 100ms
- `primitive.duration.150`: 150ms
- `primitive.duration.200`: 200ms
- `primitive.duration.320`: 320ms
- `primitive.duration.600`: 600ms
- `primitive.duration.700`: 700ms
- `primitive.duration.900`: 900ms
- `primitive.duration.1200`: 1200ms
- `primitive.duration.2400`: 2400ms
- `primitive.duration.4000`: 4000ms
- `primitive.easing.standard`: 0.2, 0, 0, 1
- `primitive.easing.decelerate`: 0.05, 0.7, 0.1, 1
- `primitive.easing.accelerate`: 0.3, 0, 0.8, 0.15
- `primitive.easing.in-out-long`: 0.45, 0.05, 0.15, 1
- `primitive.easing.linear`: 0, 0, 1, 1
- `opacity.column-stale`: 0.35
- `opacity.scrim`: 0.32
- `opacity.building`: 0.9
- `opacity.map-shadow`: 0.08
- `motion.duration.press`: 100ms ← `primitive.duration.100`
- `motion.duration.toggle`: 200ms ← `primitive.duration.200`
- `motion.duration.sheet-fallback`: 320ms ← `primitive.duration.320`
- `motion.duration.view-height`: 320ms ← `primitive.duration.320`
- `motion.duration.height-transition`: 600ms ← `primitive.duration.600`
- `motion.duration.column-rise`: 700ms ← `primitive.duration.700`
- `motion.duration.column-rise-stagger-max`: 320ms ← `primitive.duration.320`
- `motion.duration.camera-flight`: 2400ms ← `primitive.duration.2400`
- `motion.duration.camera-to-result`: 1200ms ← `primitive.duration.1200`
- `motion.duration.highlight`: 900ms ← `primitive.duration.900`
- `motion.duration.spinner`: 900ms ← `primitive.duration.900`
- `motion.duration.skeleton`: 1200ms ← `primitive.duration.1200`
- `motion.duration.toast-enter`: 200ms ← `primitive.duration.200`
- `motion.duration.toast-hold`: 4000ms ← `primitive.duration.4000`
- `motion.easing.standard`: 0.2, 0, 0, 1 ← `primitive.easing.standard`
- `motion.easing.enter`: 0.05, 0.7, 0.1, 1 ← `primitive.easing.decelerate`
- `motion.easing.exit`: 0.3, 0, 0.8, 0.15 ← `primitive.easing.accelerate`
- `motion.easing.camera`: 0.45, 0.05, 0.15, 1 ← `primitive.easing.in-out-long`
- `motion.easing.spinner`: 0, 0, 1, 1 ← `primitive.easing.linear`
- `motion.spring.sheet-stiffness`: 380
- `motion.spring.sheet-damping`: 34
- `motion.spring.sheet-mass`: 1
- `motion.spring.press-scale`: 0.96
- `motion.reduced.camera-flight`: 0ms ← `primitive.duration.0`
- `motion.reduced.camera-to-result`: 0ms ← `primitive.duration.0`
- `motion.reduced.column-rise`: 0ms ← `primitive.duration.0`
- `motion.reduced.height-transition`: 0ms ← `primitive.duration.0`
- `motion.reduced.sheet`: 0ms ← `primitive.duration.0`
- `motion.reduced.view-height`: 0ms ← `primitive.duration.0`
- `motion.reduced.spinner`: 0ms ← `primitive.duration.0`
- `motion.reduced.skeleton`: 0ms ← `primitive.duration.0`
- `motion.reduced.press-scale`: 1
- `motion.reduced.crossfade`: 150ms ← `primitive.duration.150`
- `map.pitch-default`: 55
- `map.pitch-reduced`: 45
