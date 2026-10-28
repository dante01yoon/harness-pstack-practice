# design-harness

디자인 작업을 AI 에게 맡길 때 쓰는 Claude Code 플러그인. PRD → 리서치 → 화면 구조 → 와이어프레임 → 디자인 시스템 → 피그마 → 검증 → 핸드오프를 단계로 나누고, 단계마다 남길 파일과 통과 조건을 정해 두며, 판단이 필요한 단계는 사람이 승인해야 넘어간다. 설계는 [HARNESS-DESIGN.md](HARNESS-DESIGN.md).

## 설치

하네스를 쓸 프로젝트에서 Claude Code 를 열고:

```
/plugin marketplace add <이 저장소의 git URL 또는 로컬 경로>
/plugin install design-harness@design-harness
```

셸에서는 `claude plugin marketplace add <경로>`, `claude plugin install design-harness@design-harness --scope project` 로 같은 일을 한다(`--scope project` 면 프로젝트의 `.claude/settings.json` 에 켜져 팀원과 공유된다). Node.js 20 이상이 필요하다.

산출물은 그 프로젝트의 `work/<프로젝트>/` 아래에만 생긴다. 시작은 "디자인 작업 시작" 처럼 말하면 `design-flow` 스킬이 이끈다.

## 사람이 하는 일

- 승인: 프롬프트에 `! design-harness approve <단계> --by <이름>` (AI 는 승인할 수 없다 — 훅이 막는다)
- 검토 점수: `! design-harness review <단계> --by <이름> --score <1-5>`
- Figma 대상 파일 지정: AI 에게 URL 을 알려 주면 `work/<프로젝트>/06-figma/figma.json` 에 적는다. 그 파일에만 쓸 수 있다.

`design-harness` 가 PATH 에 없으면 `node <플러그인 경로>/bin/design-harness.js` 로 실행한다.

## 훅

| 시점 | 하는 일 |
|------|---------|
| 도구 호출 전 (Bash·Write·Edit) | `approve`·`review` 실행과 `approvals.json`·`reviews.json` 수정을 막는다 |
| Figma MCP 쓰기 전 | 디자인 시스템까지 승인됐고 `figma.json` 의 파일일 때만 통과. 파일을 알 수 없는 쓰기도 막는다 |
| Figma MCP 쓰기 후 | 바뀐 노드를 `06-figma/nodes/` 에 다시 내보내고 `lint:figma` 를 돌리라고 알린다 |
| 답을 끝낼 때 | `check` 를 돌려 현재 단계와 빠진 것을 보여 준다 |

`work/` 가 없는 폴더에서는 Figma·Stop 훅이 아무것도 하지 않는다.

## 명령

`design-harness --help` 참고. `check`, `approve`, `refs:capture`, `wireframe`, `design-md`, `lint:web`, `lint:figma`, `review`, `handoff`.

## 개발

```
npm test
claude plugin validate .
```
