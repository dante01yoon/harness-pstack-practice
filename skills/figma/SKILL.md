---
name: figma
description: 디자인 하네스 6단계 피그마 지침. Figma MCP 로 토큰을 변수/스타일로, components.json 을 컴포넌트·variant 로, 와이어프레임을 화면으로 옮기고 figma.md 와 node-map.json 을 쓴다. 쓰기 권한이 없으면 매핑 모드로 진행한다. figma-builder 에이전트가 쓴다.
---

# 피그마 (06-figma)

입력: 승인된 `05-design-system/`(tokens·components·copy), `04-wireframe/*.md`, `03-ia/screens.md`
출력: `06-figma/figma.md`, `06-figma/node-map.json`
통과 조건: 토큰이 Figma 변수/스타일로 등록, 모든 화면ID·컴포넌트가 node-map 에 노드 ID 로 연결. 사람 승인은 필요 없고 검증 단계에서 함께 본다.

## 모드 정하기

1. 사용할 수 있는 Figma MCP 도구를 확인한다. 도구가 없거나 읽기만 되면 **매핑 모드**.
2. 대상 파일 URL 이 정해지지 않았으면 사람에게 묻는다. 새 파일을 만들거나 공유 범위를 바꾸는 것은 사람이 한다.

| 모드 | AI 가 하는 일 | 사람이 하는 일 |
|------|---------------|----------------|
| 작성 모드 | 변수·컴포넌트·화면을 Figma 에 만들고 node-map 작성 | 파일 준비, 결과 확인 |
| 매핑 모드 | 사람이 만든 파일을 읽어 node-map 작성, 토큰과 다른 값 지적 | Figma 에서 직접 작성 |

## 작성 순서 (작성 모드)

1. **변수/스타일**: `tokens.json` 그룹별로 컬렉션을 만든다. 이름은 토큰 이름 그대로(`color/primary`, `spacing/md`).
2. **컴포넌트**: `components.json` 의 컴포넌트마다 컴포넌트 세트, `variants` 마다 variant. 색·간격·글자 크기는 1의 변수로만 바인딩한다.
3. **화면**: `screens.md` 의 화면ID마다 프레임 하나, 와이어프레임의 `## 상태:` 마다 프레임 하나 더. 프레임 이름은 `S01 로그인`, `S01 로그인 / 오류`. 문구는 `copy.json` 의 messages·terms 를 따른다.
4. 토큰에 없는 값이 필요하면 만들지 말고 멈춘다. 디자인 시스템 단계로 되돌아갈 일이므로 사람에게 보고한다.

## node-map.json

```json
{
  "fileUrl": "https://www.figma.com/design/<fileKey>/<이름>",
  "screens": {
    "S01": { "node": "12:34", "states": { "오류": "12:80" } }
  },
  "components": {
    "Button": { "node": "5:10", "variants": { "primary": "5:11", "disabled": "5:12" } }
  },
  "variables": { "color.primary": "VariableID:1:2" }
}
```

`screens.md` 의 모든 화면ID, `components.json` 의 모든 컴포넌트·variant 가 들어가야 한다. 못 채운 것은 값을 지어내지 말고 `null` 로 두고 figma.md 에 적는다.

## figma.md

- 파일 URL, 모드, 작업 시각
- 페이지 구성 (예: `00 토큰`, `01 컴포넌트`, `02 화면`)
- 와이어프레임 대비 변경: 화면ID, 바꾼 것, 이유
- node-map 에서 빠진 항목, 토큰과 다른 값이 쓰인 노드(매핑 모드)

## 하지 않는 것

- Figma 파일 공유·게시, 다른 외부 서비스로 내보내기
- 토큰 밖 하드코딩 값
- `design-harness approve`·`review` 실행
