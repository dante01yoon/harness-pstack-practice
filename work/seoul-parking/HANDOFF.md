# 핸드오프: seoul-parking

- Figma: 아직 없음
- 노드 내보낸 시각: -
- 화면 크기: 360×800

## 화면과 상태

| 화면 | 기능 | default | loading | empty | error | stale | no-realtime |
|---|---|---|---|---|---|---|---|
| 주차장 목록 (`list`) | F1, F2, F3, F4, F6, F7 | 없음 | 없음 | 없음 | 없음 | 없음 | 없음 |
| 주차장 상세 (`detail`) | F4, F5, F6, F7 | 없음 | 없음 | 해당 없음 | 없음 | 없음 | 없음 |

## 흐름

- 구로 찾아 빈자리 확인: list → list:loading → list → detail
- 이름 검색으로 빈자리 확인: list → list:empty → list → detail
- 오래된 숫자 확인 후 새로고침: list:stale → list:loading → list
- 불러오기 실패 후 다시 시도: list:error → list:loading → list
- 실시간 없는 주차장 상세 확인: list:no-realtime → detail:no-realtime
- 상세에서 요금·운영시간 확인: detail → detail:stale → detail:error → list

## 토큰

| 토큰 | 값 | 종류 |
|---|---|---|
| `color.brand` | #0A4A94 | color |
| `color.brand-soft` | #E6EEF8 | color |
| `color.on-brand` | #FFFFFF | color |
| `color.text` | #16202A | color |
| `color.text-muted` | #475563 | color |
| `color.surface` | #FFFFFF | color |
| `color.surface-sunken` | #F2F4F6 | color |
| `color.border` | #D3DAE1 | color |
| `color.border-strong` | #7A8794 | color |
| `color.warning` | #6E4300 | color |
| `color.warning-soft` | #FFF1D6 | color |
| `color.danger` | #B0261C | color |
| `color.danger-soft` | #FCEBEA | color |
| `color.focus` | #0A4A94 | color |
| `space.1` | 4px | dimension |
| `space.2` | 8px | dimension |
| `space.3` | 12px | dimension |
| `space.4` | 16px | dimension |
| `space.5` | 20px | dimension |
| `space.6` | 24px | dimension |
| `space.8` | 32px | dimension |
| `radius.sm` | 4px | dimension |
| `radius.md` | 8px | dimension |
| `size.touch` | 44px | dimension |
| `size.header` | 48px | dimension |
| `size.input` | 48px | dimension |
| `size.row` | 96px | dimension |
| `size.icon` | 20px | dimension |
| `size.icon-lg` | 24px | dimension |
| `size.focus-ring` | 2px | dimension |
| `font-size.caption` | 13px | dimension |
| `font-size.label` | 15px | dimension |
| `font-size.body` | 16px | dimension |
| `font-size.title` | 18px | dimension |
| `font-size.heading` | 22px | dimension |
| `font-size.count` | 32px | dimension |
| `font-size.count-lg` | 48px | dimension |
| `font-weight.regular` | 400 | fontWeight |
| `font-weight.semibold` | 600 | fontWeight |
| `font-weight.bold` | 700 | fontWeight |
| `line-height.tight` | 1.15 | number |
| `line-height.snug` | 1.35 | number |
| `line-height.body` | 1.5 | number |
| `font-family.base` | IBM Plex Sans KR, Noto Sans KR, Apple SD Gothic Neo, sans-serif | fontFamily |

## 컴포넌트

- **AppBar** (list, detail): fill=`color.surface`, height=`size.header`, text=`font-size.title`, weight=`font-weight.bold`, color=`color.text`, divider=`color.border`, paddingX=`space.4`
- **IconButton** (refresh, back), 누를 수 있음: minSize=`size.touch`, icon=`color.brand`, iconSize=`size.icon-lg`, pressed=`color.brand-soft`, focus=`color.focus`, radius=`radius.sm`
- **SearchField** (empty, filled), 누를 수 있음: minSize=`size.touch`, height=`size.input`, fill=`color.surface`, border=`color.border-strong`, focus=`color.focus`, radius=`radius.md`, text=`font-size.body`, color=`color.text`, placeholder=`color.text-muted`, icon=`color.text-muted`, paddingX=`space.3`
- **DistrictChip** (default, selected), 누를 수 있음: minSize=`size.touch`, fill=`color.surface`, border=`color.border-strong`, text=`font-size.label`, color=`color.text`, selectedFill=`color.brand-soft`, selectedText=`color.brand`, selectedBorder=`color.brand`, radius=`radius.sm`, paddingX=`space.3`, gap=`space.2`, focus=`color.focus`
- **ResultSummary**: text=`font-size.label`, color=`color.text-muted`, height=`size.touch`, paddingX=`space.4`
- **StaleBanner** (list, detail): fill=`color.warning-soft`, color=`color.warning`, text=`font-size.label`, border=`color.warning`, icon=`color.warning`, iconSize=`size.icon`, radius=`radius.md`, padding=`space.3`, gap=`space.2`
- **GroupHeader**: fill=`color.surface-sunken`, text=`font-size.label`, weight=`font-weight.semibold`, color=`color.text`, paddingX=`space.4`
- **ParkingRow** (realtime, full, stale, no-realtime, bus-only), 누를 수 있음: minSize=`size.row`, fill=`color.surface`, pressed=`color.brand-soft`, name=`font-size.title`, nameColor=`color.text`, address=`font-size.label`, addressColor=`color.text-muted`, divider=`color.border`, paddingX=`space.4`, paddingY=`space.3`, gap=`space.2`, focus=`color.focus`
- **AvailabilityCount** (realtime, full, no-realtime): count=`font-size.count`, countLarge=`font-size.count-lg`, weight=`font-weight.bold`, lineHeight=`line-height.tight`, color=`color.text`, unit=`font-size.label`, unitColor=`color.text-muted`
- **Timestamp** (fresh, stale): text=`font-size.label`, color=`color.text-muted`, staleColor=`color.warning`, icon=`size.icon`, gap=`space.1`
- **NoRealtimeTag**: fill=`color.surface-sunken`, border=`color.border-strong`, text=`font-size.label`, color=`color.text`, icon=`size.icon`, radius=`radius.sm`, paddingX=`space.2`
- **BusOnlyTag**: fill=`color.surface`, border=`color.border-strong`, text=`font-size.label`, color=`color.text`, subColor=`color.text-muted`, icon=`size.icon`, radius=`radius.sm`, paddingX=`space.2`
- **Button** (primary, secondary), 누를 수 있음: minSize=`size.touch`, fill=`color.brand`, text=`color.on-brand`, fontSize=`font-size.label`, weight=`font-weight.semibold`, secondaryFill=`color.surface`, secondaryText=`color.brand`, secondaryBorder=`color.brand`, radius=`radius.sm`, paddingX=`space.4`, focus=`color.focus`
- **StateMessage** (loading, empty, error): fill=`color.surface-sunken`, errorFill=`color.danger-soft`, title=`font-size.body`, titleWeight=`font-weight.semibold`, color=`color.text`, errorColor=`color.danger`, body=`font-size.label`, muted=`color.text-muted`, icon=`size.icon-lg`, radius=`radius.md`, padding=`space.5`, gap=`space.2`
- **SkeletonRow**: fill=`color.surface-sunken`, minSize=`size.row`, divider=`color.border`, radius=`radius.sm`
- **DetailHero** (realtime, full, stale, no-realtime, bus-only): fill=`color.surface`, name=`font-size.heading`, weight=`font-weight.bold`, color=`color.text`, padding=`space.4`, gap=`space.2`, divider=`color.border`
- **DetailSection**: fill=`color.surface`, title=`font-size.title`, weight=`font-weight.semibold`, color=`color.text`, divider=`color.border`, paddingX=`space.4`, paddingY=`space.4`, gap=`space.3`
- **InfoRow** (value, unknown, hidden): label=`font-size.label`, labelColor=`color.text-muted`, value=`font-size.body`, valueColor=`color.text`, gap=`space.3`, paddingY=`space.2`
- **PhoneLink**, 누를 수 있음: minSize=`size.touch`, color=`color.brand`, text=`font-size.body`, weight=`font-weight.semibold`, icon=`size.icon`, pressed=`color.brand-soft`, focus=`color.focus`
- **SourceNote**: fill=`color.surface-sunken`, text=`font-size.caption`, color=`color.text-muted`, padding=`space.4`

## 기계 검사 결과

오류 0개, 경고 0개

## 사람 검토

아직 없음 (`design-harness review`)
