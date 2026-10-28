# 핸드오프: seoul-parking

- Figma: https://www.figma.com/design/07P8F0Xqvv9PK4aJGGV32M
- 노드 내보낸 시각: 2026-10-27T16:55:42.921Z
- 화면 크기: 390×844

## 화면과 상태

| 화면 | 기능 | default | empty | error | loading |
|---|---|---|---|---|---|
| 3D 지도 (첫 화면) (`map`) | F1, F2, F5, F6, F7, F8 | 있음 | 있음 | 있음 | 있음 |
| 목록 (거리순/빈자리순) (`list`) | F4, F6, F7, F8 | 있음 | 있음 | 있음 | 있음 |
| 검색 (이름·자치구) (`search`) | F5, F6, F8 | 있음 | 있음 | 해당 없음 | 해당 없음 |
| 주차장 상세 바텀시트 (`detail`) | F3, F6 | 있음 | 해당 없음 | 해당 없음 | 해당 없음 |

## 흐름

- 목적지 근처 빈자리 수와 기준 시각을 지도에서 읽는다: map:loading → map → detail
- 이름이나 구로 찾아 그 주차장 상세를 본다: map → search → map → detail
- 검색 결과가 없을 때 다시 입력한다: map → search:empty → search
- 목록에서 거리순/빈자리순으로 비교하고 상세를 연다: map → list → detail
- 불러오기 실패 후 다시 시도한다: map:error → map:loading → map
- 위치 권한을 거부해도 시청 근처에서 시작해 탐색한다: map:permission-denied → map
- 화면 안에 주차장이 없을 때 목록이나 다른 곳으로 이동한다: map:empty → list → map
- 3D를 못 그리는 기기에서 목록으로 시작해 상세를 본다: list:no-webgl → detail
- 숫자가 오래됐거나 실시간이 아닌 곳을 구분한다: map:stale → detail:stale → list:no-realtime → detail:no-realtime
- 위치 정보 없는 주차장을 목록·검색에서 확인한다: list:no-location → detail:no-location

## 토큰

| 토큰 | 값 | 종류 |
|---|---|---|
| `color.brand` | #15191E | color |
| `color.action` | #15191E | color |
| `color.on-action` | #FFFFFF | color |
| `color.text` | #15191E | color |
| `color.text-muted` | #4B525B | color |
| `color.text-disabled` | #5A616A | color |
| `color.surface` | #FFFFFF | color |
| `color.surface-sunken` | #F3F4F6 | color |
| `color.skeleton` | #E4E7EA | color |
| `color.border` | #DADDE1 | color |
| `color.border-float` | #B9BEC5 | color |
| `color.focus` | #15191E | color |
| `color.inverse` | #15191E | color |
| `color.on-inverse` | #FFFFFF | color |
| `color.danger` | #B42318 | color |
| `color.danger-soft` | #FDECEA | color |
| `color.badge.stale-bg` | #FFFFFF | color |
| `color.badge.stale-text` | #15191E | color |
| `color.badge.stale-border` | #15191E | color |
| `color.badge.muted-bg` | #ECEEF1 | color |
| `color.badge.muted-text` | #3A4048 | color |
| `color.map.ground` | #EEF0F2 | color |
| `color.map.building` | #DADDE1 | color |
| `color.map.building-front` | #E4E7EA | color |
| `color.map.building-side` | #ECEEF1 | color |
| `color.map.shadow` | #15191E | color |
| `color.map.road` | #FFFFFF | color |
| `color.map.water` | #ECEEF1 | color |
| `color.map.label` | #5A616A | color |
| `color.column.plenty` | #0B7A5E | color |
| `color.column.some` | #A86F00 | color |
| `color.column.few` | #C2410C | color |
| `color.column.full` | #B0124A | color |
| `color.column.no-realtime` | #6A717A | color |
| `color.column.face.plenty-top` | #2D8D75 | color |
| `color.column.face.plenty-side` | #085D47 | color |
| `color.column.face.some-top` | #B17D1A | color |
| `color.column.face.some-side` | #805400 | color |
| `color.column.face.few-top` | #CB5C2E | color |
| `color.column.face.few-side` | #933109 | color |
| `color.column.face.full-top` | #BB3363 | color |
| `color.column.face.full-side` | #860E38 | color |
| `color.column.face.no-realtime-top` | #80868E | color |
| `color.column.face.no-realtime-side` | #4B525B | color |
| `color.leader` | #4B525B | color |
| `opacity.column-stale` | 0.35 | number |
| `opacity.scrim` | 0.32 | number |
| `opacity.building` | 0.9 | number |
| `opacity.map-shadow` | 0.08 | number |
| `space.1` | 4px | dimension |
| `space.2` | 8px | dimension |
| `space.3` | 12px | dimension |
| `space.4` | 16px | dimension |
| `space.5` | 20px | dimension |
| `space.6` | 24px | dimension |
| `space.8` | 32px | dimension |
| `radius.tag` | 4px | dimension |
| `radius.sheet` | 20px | dimension |
| `radius.pill` | 999px | dimension |
| `size.touch` | 44px | dimension |
| `size.control` | 48px | dimension |
| `size.header` | 56px | dimension |
| `size.list-item` | 96px | dimension |
| `size.sheet-handle` | 44px | dimension |
| `size.icon` | 24px | dimension |
| `size.border` | 1px | dimension |
| `size.focus-ring` | 2px | dimension |
| `size.column-label-swatch` | 4px | dimension |
| `size.column-min-height` | 24px | dimension |
| `size.leader-width` | 2px | dimension |
| `size.label-offset-max` | 64px | dimension |
| `size.column-max-height` | 170px | dimension |
| `font-family.base` | Noto Sans KR, Apple SD Gothic Neo, sans-serif | fontFamily |
| `font-size.caption` | 12px | dimension |
| `font-size.label` | 14px | dimension |
| `font-size.body` | 16px | dimension |
| `font-size.title` | 20px | dimension |
| `font-size.headline` | 28px | dimension |
| `font-size.display` | 44px | dimension |
| `font-weight.regular` | 400 | fontWeight |
| `font-weight.medium` | 500 | fontWeight |
| `font-weight.bold` | 700 | fontWeight |
| `line-height.tight` | 1.2 | number |
| `line-height.body` | 1.5 | number |
| `motion.duration.press` | 100ms | duration |
| `motion.duration.toggle` | 200ms | duration |
| `motion.duration.sheet-fallback` | 320ms | duration |
| `motion.duration.view-height` | 320ms | duration |
| `motion.duration.height-transition` | 600ms | duration |
| `motion.duration.column-rise` | 700ms | duration |
| `motion.duration.column-rise-stagger-max` | 320ms | duration |
| `motion.duration.camera-flight` | 2400ms | duration |
| `motion.duration.camera-to-result` | 1200ms | duration |
| `motion.duration.highlight` | 900ms | duration |
| `motion.duration.spinner` | 900ms | duration |
| `motion.duration.skeleton` | 1200ms | duration |
| `motion.duration.toast-enter` | 200ms | duration |
| `motion.duration.toast-hold` | 4000ms | duration |
| `motion.easing.standard` | 0.2, 0, 0, 1 | cubicBezier |
| `motion.easing.enter` | 0.05, 0.7, 0.1, 1 | cubicBezier |
| `motion.easing.exit` | 0.3, 0, 0.8, 0.15 | cubicBezier |
| `motion.easing.camera` | 0.45, 0.05, 0.15, 1 | cubicBezier |
| `motion.easing.spinner` | 0, 0, 1, 1 | cubicBezier |
| `motion.spring.sheet-stiffness` | 380 | number |
| `motion.spring.sheet-damping` | 34 | number |
| `motion.spring.sheet-mass` | 1 | number |
| `motion.spring.press-scale` | 0.96 | number |
| `motion.reduced.camera-flight` | 0ms | duration |
| `motion.reduced.camera-to-result` | 0ms | duration |
| `motion.reduced.column-rise` | 0ms | duration |
| `motion.reduced.height-transition` | 0ms | duration |
| `motion.reduced.sheet` | 0ms | duration |
| `motion.reduced.view-height` | 0ms | duration |
| `motion.reduced.spinner` | 0ms | duration |
| `motion.reduced.skeleton` | 0ms | duration |
| `motion.reduced.press-scale` | 1 | number |
| `motion.reduced.crossfade` | 150ms | duration |
| `map.pitch-default` | 55 | number |
| `map.pitch-reduced` | 45 | number |

## 컴포넌트

- **FloatingSearchBar** (default, pressed), 누를 수 있음: fill=`color.surface`, border=`color.border-float`, color=`color.text-muted`, radius=`radius.pill`, minSize=`size.touch`, height=`size.control`, paddingX=`space.4`, text=`font-size.body`, pressScale=`motion.spring.press-scale`, press=`motion.duration.press`
- **ViewToggle** (map-selected, list-selected, map-disabled), 누를 수 있음: fill=`color.action`, color=`color.on-action`, track=`color.surface-sunken`, unselected=`color.text`, disabled=`color.text-disabled`, radius=`radius.pill`, minSize=`size.touch`, text=`font-size.label`, weight=`font-weight.bold`, duration=`motion.duration.toggle`, easing=`motion.easing.standard`, reduced=`motion.reduced.crossfade`
- **MapFab** (locate, locate-disabled, refresh, refreshing), 누를 수 있음: fill=`color.surface`, border=`color.border-float`, icon=`color.text`, radius=`radius.pill`, minSize=`size.touch`, size=`size.control`, iconSize=`size.icon`, spinner=`motion.duration.spinner`, spinnerEasing=`motion.easing.spinner`, reducedSpinner=`motion.reduced.spinner`, disabledFill=`color.surface-sunken`, disabledIcon=`color.text-disabled`
- **UpdatedAt** (fresh, stale, refreshing, summary): fill=`color.surface`, color=`color.text-muted`, text=`font-size.label`, radius=`radius.pill`, paddingX=`space.3`
- **VacancyColumn** (plenty, some, few, full, stale, no-realtime), 누를 수 있음: plenty=`color.column.plenty`, some=`color.column.some`, few=`color.column.few`, full=`color.column.full`, noRealtime=`color.column.no-realtime`, plentyTop=`color.column.face.plenty-top`, plentySide=`color.column.face.plenty-side`, someTop=`color.column.face.some-top`, someSide=`color.column.face.some-side`, fewTop=`color.column.face.few-top`, fewSide=`color.column.face.few-side`, fullTop=`color.column.face.full-top`, fullSide=`color.column.face.full-side`, noRealtimeTop=`color.column.face.no-realtime-top`, noRealtimeSide=`color.column.face.no-realtime-side`, shadow=`color.map.shadow`, shadowOpacity=`opacity.map-shadow`, staleOpacity=`opacity.column-stale`, minSize=`size.touch`, rise=`motion.duration.column-rise`, riseEasing=`motion.easing.enter`, stagger=`motion.duration.column-rise-stagger-max`, heightChange=`motion.duration.height-transition`, heightEasing=`motion.easing.standard`, reducedRise=`motion.reduced.column-rise`, reducedHeight=`motion.reduced.height-transition`, minHeight=`size.column-min-height`, maxHeight=`size.column-max-height`
- **ColumnLabel** (plenty, some, few, full, stale, no-realtime, highlighted), 누를 수 있음: fill=`color.surface`, color=`color.text`, border=`color.border-float`, swatchWidth=`size.column-label-swatch`, radius=`radius.tag`, minSize=`size.touch`, text=`font-size.title`, weight=`font-weight.bold`, highlight=`motion.duration.highlight`, focus=`color.focus`, leader=`color.leader`, leaderWidth=`size.leader-width`, offsetMax=`size.label-offset-max`
- **MapLegend**: fill=`color.surface`, border=`color.border-float`, color=`color.text-muted`, text=`font-size.label`, radius=`radius.tag`, padding=`space.3`, plenty=`color.column.plenty`, some=`color.column.some`, few=`color.column.few`, full=`color.column.full`, noRealtime=`color.column.no-realtime`, staleOpacity=`opacity.column-stale`
- **AttributionChip**: fill=`color.surface`, color=`color.text-muted`, text=`font-size.caption`, radius=`radius.pill`, paddingX=`space.2`
- **BottomSheet** (peek, half, full): fill=`color.surface`, radius=`radius.sheet`, padding=`space.4`, scrim=`color.inverse`, scrimOpacity=`opacity.scrim`, stiffness=`motion.spring.sheet-stiffness`, damping=`motion.spring.sheet-damping`, mass=`motion.spring.sheet-mass`, fallback=`motion.duration.sheet-fallback`, reduced=`motion.reduced.sheet`
- **SheetHandle**, 누를 수 있음: bar=`color.border-float`, minSize=`size.touch`, height=`size.sheet-handle`, radius=`radius.pill`
- **DetailVacancy** (default, stale, no-realtime): color=`color.text`, text=`font-size.display`, weight=`font-weight.bold`, lineHeight=`line-height.tight`, secondary=`color.text-muted`, secondaryText=`font-size.body`
- **InfoRow**: label=`color.text-muted`, color=`color.text`, text=`font-size.body`, divider=`color.border`, paddingY=`space.3`
- **Button** (primary, secondary, disabled), 누를 수 있음: fill=`color.action`, color=`color.on-action`, secondaryFill=`color.surface`, secondaryText=`color.text`, secondaryBorder=`color.text`, disabled=`color.text-disabled`, radius=`radius.pill`, minSize=`size.touch`, height=`size.control`, text=`font-size.body`, weight=`font-weight.bold`, pressScale=`motion.spring.press-scale`, focus=`color.focus`
- **ListItem** (default, stale, no-realtime, no-location), 누를 수 있음: fill=`color.surface`, color=`color.text`, divider=`color.border`, minSize=`size.touch`, height=`size.list-item`, paddingX=`space.4`, gap=`space.2`, name=`font-size.title`, count=`font-size.headline`, meta=`color.text-muted`, metaText=`font-size.label`, swatchWidth=`size.column-label-swatch`
- **SortToggle** (distance, vacancy, distance-disabled), 누를 수 있음: fill=`color.action`, color=`color.on-action`, track=`color.surface-sunken`, unselected=`color.text`, disabled=`color.text-disabled`, radius=`radius.pill`, minSize=`size.touch`, text=`font-size.label`, duration=`motion.duration.toggle`
- **StatusBadge** (stale, no-realtime, no-location): fill=`color.badge.muted-bg`, color=`color.badge.muted-text`, staleFill=`color.badge.stale-bg`, staleText=`color.badge.stale-text`, staleBorder=`color.badge.stale-border`, radius=`radius.tag`, text=`font-size.label`, weight=`font-weight.medium`, paddingX=`space.2`
- **ErrorBanner**: fill=`color.danger-soft`, color=`color.text`, accent=`color.danger`, radius=`radius.tag`, padding=`space.3`, text=`font-size.body`
- **Toast** (permission-denied, refresh-failed): fill=`color.inverse`, color=`color.on-inverse`, radius=`radius.tag`, padding=`space.3`, text=`font-size.body`, enter=`motion.duration.toast-enter`, hold=`motion.duration.toast-hold`, easing=`motion.easing.enter`, reduced=`motion.reduced.crossfade`
- **StateMessage** (loading, empty, error, no-webgl, search-empty): color=`color.text`, muted=`color.text-muted`, text=`font-size.body`, titleText=`font-size.title`, gap=`space.3`
- **Skeleton**: fill=`color.skeleton`, radius=`radius.tag`, duration=`motion.duration.skeleton`, reduced=`motion.reduced.skeleton`
- **SearchField**, 누를 수 있음: fill=`color.surface-sunken`, color=`color.text`, placeholder=`color.text-muted`, radius=`radius.pill`, minSize=`size.touch`, height=`size.control`, text=`font-size.body`, focus=`color.focus`
- **IconButton** (close, back), 누를 수 있음: icon=`color.text`, minSize=`size.touch`, iconSize=`size.icon`, radius=`radius.pill`, focus=`color.focus`
- **SearchResultRow** (lot, district, no-realtime, no-location), 누를 수 있음: fill=`color.surface`, color=`color.text`, meta=`color.text-muted`, divider=`color.border`, minSize=`size.touch`, paddingX=`space.4`, text=`font-size.body`, metaText=`font-size.label`, flight=`motion.duration.camera-to-result`, flightEasing=`motion.easing.camera`, reducedFlight=`motion.reduced.camera-to-result`
- **MapCamera** (intro, to-result, reduced): flight=`motion.duration.camera-flight`, easing=`motion.easing.camera`, pitch=`map.pitch-default`, reducedFlight=`motion.reduced.camera-flight`, reducedPitch=`map.pitch-reduced`, ground=`color.map.ground`, building=`color.map.building`, buildingOpacity=`opacity.building`, road=`color.map.road`, water=`color.map.water`, label=`color.map.label`

## 기계 검사 결과

오류 0개, 경고 9개
- 경고 `consistency` SearchResultRow: 화면마다 높이가 다름: 49, 95, 74, 107
- 경고 `consistency` StateMessage: 화면마다 높이가 다름: 132, 67, 168, 108, 96
- 경고 `consistency` StatusBadge: 화면마다 높이가 다름: 29, 31
- 경고 `consistency` VacancyColumn: 화면마다 높이가 다름: 214, 95, 44, 80, 82, 81, 68, 72, 78, 87, 90, 77
- 경고 `consistency` UpdatedAt: 화면마다 높이가 다름: 29, 39
- 경고 `consistency` Skeleton: 화면마다 높이가 다름: 44, 24, 32
- 경고 `consistency` ListItem: 화면마다 높이가 다름: 117, 96
- 경고 `consistency` DetailVacancy: 화면마다 높이가 다름: 78, 88, 76
- 경고 `consistency` InfoRow: 화면마다 높이가 다름: 73, 97, 49

## 사람 검토

검토자: dante, 점수 19/24 (채점 12/12)
- [2] 와이어프레임 우선순위 1번 영역이 실제로 가장 먼저 눈에 들어오는가 — map/default·stale·no-realtime: 1067 기둥과 숫자 라벨(리더선 있음)이 먼저 읽힘. list는 '빈자리 1067' 큰 숫자, detail은 '빈자리 1067 / 총 1260면'이 시트에서 가장 큼. 약점: map/* 하단 범례+저작권이 y≈620–830(약 210px, 화면의 25%)을 덮고, search/default·no-realtime·no-location 결과 행은 빈자리 수가 회색 본문 크기 한 줄에 묻혀 큰 숫자가 없음.
- [1] 화면마다 주요 행동이 하나로 분명한가 — map: 검색·기둥 탭, detail/default·stale·no-realtime: 채운 '길찾기' 하나, detail/no-location '전화 걸기' 하나로 분명. 하지만 search/empty('광화문')와 list/empty는 문구만 있고 누를 다음 행동이 없음(map/empty에는 '목록 보기'가 있는 것과 대조).
- [1] 시스템 상태가 보이는가: 로딩·빈·오류가 무엇이 일어났고 무엇을 하면 되는지 말하는가 (Nielsen 1, 9) — map/error·list/error는 무엇이 일어났고 '다시 시도'가 분명. map/permission-denied 현위치 버튼이 사선 아이콘으로 비활성 표시됨. 남은 것: list/loading에 '새로 받는 중'과 '불러오는 중'이 동시에 떠 처음 받는지 갱신인지 모호, list/empty 안내가 '…목록에서 찾으세요'인데 이미 목록 화면이라 할 일이 안 맞음, map/loading의 '불러오는 중' 막대가 현위치 버튼 아래로 겹치고 회색 사각형 스켈레톤이 기둥 자리로 읽히지 않음.
- [2] 사용자 말로 쓰였는가: 실제 장소 이름·단위 그대로인가 (Nielsen 2) — list·detail 모두 '빈자리 {n} / 총 {m}면', detail '(현재 주차 193대)'로 큰 숫자의 뜻이 분명. 주소 끝 ' 0' 제거(detail/no-realtime '을지로6가 17-442'), '공휴일 시간 정보 없음', '지도 위치 없음'으로 사용자 위치 권한과 구분됨. 실제 주차장 이름·숫자 사용.
- [1] 같은 요소가 화면마다 같은 모양·위치인가 (Nielsen 4) — 지도/목록 토글과 새로고침 위치가 map(검색창 아래·우하단 원형)과 list(맨 위 왼쪽·우상단)에서 다르고 list에는 검색 진입점이 없음. 빈자리 수 표기가 list(큰 숫자)와 search(본문 크기 한 줄)에서 다름. search/no-location에서 '지도 위치 없음'이 첫 항목은 칩, 둘째 항목은 회색 본문 텍스트로 다르게 표시. 컴포넌트 높이 불일치는 린트 경고로 이미 잡힘.
- [2] 되돌아가기·다시 시도가 항상 가능한가 (Nielsen 3) — search 뒤로가기, 시트 닫기(X), map/list error '다시 시도', map/empty '목록 보기', 모든 화면에 토글 있음. list에서 검색하려면 지도로 돌아가야 하는 점만 약함. map/permission-denied에서는 토스트가 지도/목록 토글을 덮어 토스트가 떠 있는 동안 전환 수단이 가려짐.
- [2] 실시간처럼 보이는 숫자에 기준 시각·출처가 보이는가 — list·detail·search 항목마다 '기준 2026-10-28 00:01:23', stale은 항목·라벨·요약 칩마다 '오래됨'. map은 라벨이 숫자만이고 시각은 우하단 '가장 오래된 정보 기준 00:01:23' 칩 하나라 PRD '모든 숫자 옆에 기준 시각'을 글자 그대로 지키지는 않지만 보수적 하한이라 판단에는 충분. 출처는 모든 화면 하단 고정.
- [1] 누를 수 있는 것이 누를 수 있어 보이는가(화살표, 눌림 상태) — 원형 버튼·알약 토글·기둥 라벨(리더선)은 분명. list 항목에 화살표·눌림 표시가 없어 상세(요금·운영시간)로 들어갈 수 있는지 안 보임. search/default '종로구 · 주차장 16곳'은 굵은 구분 제목처럼 보여 탭해서 구로 이동하는 결과로 안 읽힘. '오래됨' 배지가 점선 테두리라 빈 자리표시나 버튼처럼 보임.
- [1] 필요 없는 장식·정보가 없는가 (Nielsen 8) — map 범례 6줄+저작권 2줄이 map의 모든 상태(error·empty·loading 포함)에 상시 노출되어 와이어프레임 56+40px 대비 약 2배. list 항목마다 '기준 2026-10-28' 날짜 전체가 반복돼 항목이 4줄이 되고 한 화면에 5개만 보임. 범례 '■0 ■회색 = 실시간 정보 없음'을 한 줄에 묶어 읽기 헷갈림.
- [2] 카피 톤이 copy.json의 tone과 맞는가 — 합니다체, 금지어·느낌표 없음, 오류 문구가 탓 없이 다음 행동 하나('연결을 확인한 뒤 다시 시도하세요'). 버튼 8자 이내. 줄바꿈 깨짐(search/empty '없습니/다', list/no-webgl '시/작합니다', detail/no-location '찾으/세요')은 Nit.
- [2] 기본값 같은 인상인가: 똑같은 둥근 카드+회색 그림자, 대문자 라벨, 의미 없는 숫자 표식 등이 없는가 — 비스듬한 3D 건물 위 셰이딩된 기둥과 왼쪽 색 띠 라벨로 지도 인상이 뚜렷함. 범례·빈 상태·오류 상자는 흰 둥근 카드 기본값 인상이고, 나침반·기울기 단서가 없어 정지 화면에서 '만지는 3D'는 약하게 전달됨.
- [2] 서비스 성격(공공 서비스, 쓰는 상황)에 맞는 인상인가 — 무채색 바탕에 의미 색(넉넉·보통·적음·0)만 쓰고 출처를 하단에 고정해 공공 서비스다운 인상. 3D 기둥으로 딱딱함이 덜함.
- **Medium** map/default·stale·no-realtime·permission-denied·loading·error·empty — MapLegend + AttributionChip: 범례 6줄과 저작권 2줄이 모든 map 상태에서 하단 약 210px(844px의 25%)를 상시 덮는다. 1순위 영역인 지도가 위 3/4로 줄고, 하단 기둥과 라벨이 현위치·새로고침 버튼 쪽으로 밀려 겹친다(아래 항목). 데이터가 없는 error·empty·loading에서도 범례가 남아 의미 없는 정보가 된다.
- **Medium** map/stale — ColumnLabel: map/default에서는 7·8 기둥에 라벨이 있는데 같은 화면 범위의 map/stale에서는 7·8 기둥(관철동·청계1(북))에 라벨이 없다. 오래됨 배지로 라벨이 넓어진 탓으로 보이며, 목적지가 작은 주차장이면 숫자를 지도에서 읽을 수 없어 기둥을 눌러야 한다(10초 판단 목표).
- **Medium** map/no-realtime 우하단 DDP동측 기둥(7), map/permission-denied 좌우 가장자리 라벨(1, 7): map/no-realtime의 '7' 라벨과 주황 기둥이 현위치·새로고침 버튼 뒤에 걸려 일부 가려진다. map/permission-denied는 '1' 라벨이 왼쪽 끝, '7' 라벨이 오른쪽 끝에서 잘린다. 잘린 숫자는 다른 값으로 읽힐 수 있다.
- **Medium** map/permission-denied — 토스트: '위치를 쓸 수 없어 시청 근처로 시작합니다' 토스트가 지도/목록 토글을 완전히 덮는다. 위치를 거부한 사용자는 거리순 목록이 막혀 목록 전환이 유력한 다음 행동인데, 토스트가 떠 있는 동안 그 수단이 사라진다.
- **Medium** search/default·no-realtime·no-location — SearchResultRow: 목적지 근처 주차장을 이름으로 찾는 경로인데 결과 행에서 빈자리 수가 '종로구 · 빈자리 1067 / 총 1260면 · 기준 …' 회색 본문 한 줄에 묻혀 있다(list는 큰 숫자). search/default에서는 기준 시각이 '2026-10-28 / 00:01:23'으로 줄이 갈린다. 검색 결과에서 바로 빈자리를 읽기 어렵다.
- **Medium** search/empty('광화문'): 목적지는 보통 장소명인데(세종로 공영주차장이 광화문 바로 옆) 장소 검색은 범위 밖이라 가장 흔한 입력이 막다른 상태가 된다. '이름이나 구 이름으로 다시 검색하세요'뿐이고 누를 다음 행동(구 선택, 지도에서 찾기 등)이 없다.
- **Medium** list/empty: 안내가 map/empty와 같은 '지도를 옮기거나 목록에서 찾으세요'라서 이미 목록에 있는 사용자에게 맞지 않고, 버튼도 없다. 무엇을 하면 되는지 말하지 못한다.
- **Medium** list/default·stale·no-realtime·no-location — ListItem, search/default 자치구 행: 목록 항목에 화살표·눌림 표시가 없어 눌러서 요금·운영시간(PRD가 말한 사용자가 알고 싶은 것 ③)을 볼 수 있다는 단서가 없다. search의 '종로구 · 주차장 16곳'은 구분 제목처럼 보여 탭하면 구로 이동하는 결과로 읽히지 않는다.
- **Medium** map ↔ list — 토글·새로고침·검색 위치: 토글은 map에서 검색창 아래, list에서 맨 위. 새로고침은 map 우하단 원형, list 우상단. list에는 검색이 없어 목록에서 찾던 사용자가 검색하려면 지도로 돌아가야 한다. 전환할 때마다 손이 갈 위치가 바뀐다.
- **Nit** list/loading: '새로 받는 중'과 '불러오는 중'이 동시에 떠 처음 불러오는지 갱신 중인지 모호하다.
- **Nit** map/loading: '불러오는 중' 막대 오른쪽 끝이 현위치 버튼 아래로 겹치고, 스켈레톤 회색 사각형 옆으로 지명 글자가 일부('ㅣ') 잘려 보인다. 스켈레톤이 기둥 자리로 읽히지 않는다.
- **Nit** StatusBadge '오래됨' (map/stale·list/stale·detail/stale): 점선 테두리라 미완성 자리표시나 누르는 버튼처럼 보인다.
- **Nit** MapLegend 둘째 줄: '■0 ■회색 = 실시간 정보 없음'이 한 줄이라 0도 실시간 정보 없음으로 읽힐 수 있다. '적음'(주황빨강)과 '0'(진홍) 색이 가깝다(0은 숫자 라벨·원판 모양으로 보완됨).
- **Nit** search/empty, list/no-webgl, detail/no-location: 줄바꿈이 낱말 중간에서 갈린다('없습니/다', '시/작합니다', '찾으/세요').
