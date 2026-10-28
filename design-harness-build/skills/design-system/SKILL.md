---
name: design-system
description: 디자인 하네스 5단계 디자인 시스템 지침. tokens.json, components.json, copy.json, principles.md 를 형식에 맞게 만들고, 와이어프레임 요소 대조와 WCAG AA 대비 검사 후 design-harness design-md 로 DESIGN.md 를 생성한다. design-system-designer 에이전트가 쓴다.
---

# 디자인 시스템 (05-design-system)

입력: 승인된 `04-wireframe/*.md`, `02-research/insights.md`, `01-prd/prd.md`
출력: `tokens.json`, `components.json`, `copy.json`, `DESIGN.md`(생성), `principles.md`
통과 조건: 와이어프레임 요소가 모두 컴포넌트 목록에 있음, 텍스트/배경 조합 WCAG AA, JSON 스키마 통과, DESIGN.md 가 JSON 과 일치. **사람 승인 필요.**

## tokens.json

그룹 → `{ 이름: 값 }` 한 단계만. `color`, `fontSize` 는 필수. 가능한 그룹: `color`, `fontSize`, `fontFamily`, `fontWeight`, `lineHeight`, `spacing`, `radius`, `shadow`.

```json
{
  "color": { "primary": "#1A73E8", "onPrimary": "#FFFFFF", "text": "#111111", "textMuted": "#5F6368", "bg": "#FFFFFF", "danger": "#C5221F" },
  "fontSize": { "caption": "12px", "body": "16px", "title": "24px" },
  "spacing": { "xs": 4, "sm": 8, "md": 16, "lg": 24 },
  "radius": { "sm": 4, "md": 8 }
}
```

- 색은 `#hex`, `rgb()`, `hsl()`. 길이는 px·rem·pt 또는 숫자(px).
- 이름은 쓰임새로 짓는다(`primary`, `textMuted`). `blue500` 같은 원색 이름만 두지 않는다. 핸드오프에서 `--color-text-muted` 같은 CSS 변수가 된다.

## components.json

```json
{
  "Button": { "description": "화면의 주 동작. 화면당 primary 하나", "variants": ["primary", "secondary", "disabled", "loading"] },
  "TextField": { "description": "한 줄 입력", "variants": ["default", "focus", "error", "disabled"] }
}
```

와이어프레임 요소 종류(`header, tabbar, title, text, input, button, link, image, card, list, alert, empty, loading, divider, spacer`)와 화면별 `## 상태:` 절을 훑어 대조표를 만든다. 레이아웃 보조(`spacer`, `divider`)를 빼고 모든 요소가 어떤 컴포넌트·variant 로 그려지는지 `principles.md` 에 적는다. 빠진 것이 있으면 컴포넌트를 추가한다.

## copy.json

```json
{
  "terms": [{ "use": "로그인", "avoid": ["사인인", "로그온"] }],
  "banned": ["클릭하세요", { "phrase": "오류가 발생했습니다", "reason": "원인과 할 일을 적는다" }],
  "messages": { "login.failed": "이메일 또는 비밀번호가 맞지 않아요" }
}
```

와이어프레임의 문구(버튼 라벨, 빈 상태, 오류)를 모아 용어를 하나로 정하고, 오류 메시지는 "무엇이 잘못됐고 무엇을 하면 되는지"가 들어가게 쓴다. `banned`·`avoid` 는 `lint:web` 이 화면 HTML 에서 찾아낸다.

## 대비 검사

텍스트로 쓸 색 × 배경으로 쓸 색 조합을 모두 계산한다(WCAG 상대 휘도: sRGB 채널 c/255 → c≤0.03928 ? c/12.92 : ((c+0.055)/1.055)^2.4, L = 0.2126R+0.7152G+0.0722B, 대비 = (L밝은+0.05)/(L어두운+0.05)). `node -e` 로 계산해도 된다. 기준: 일반 4.5:1, 큰 글씨(24px 이상, 또는 굵게 18.66px 이상) 3:1. 결과 표를 `principles.md` 에 남기고, 미달 조합은 색을 고치거나 "이 조합은 쓰지 않음"으로 명시한다.

## principles.md

- 시각 방향 3~5줄 (리서치 인사이트 근거와 함께)
- 와이어프레임 요소 → 컴포넌트 대조표
- 대비 검사 표
- 사람이 정해야 할 선택지 (예: 주색 후보 두 개와 각각의 근거)

## 마무리

1. `design-harness design-md` — 스키마 오류가 나오면 JSON 을 고치고 다시 실행. DESIGN.md 는 손으로 고치지 않는다.
2. `design-harness check` 로 디자인 시스템 단계에 빠진 것이 없는지 확인.
3. 이 단계는 승인이 필요하므로 멈춘다. `design-harness approve` 는 실행하지 않는다.
