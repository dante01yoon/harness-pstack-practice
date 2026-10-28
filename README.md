# 하네스 2종 + pstack 실습 · 서울 공영주차장 빈자리 3D 지도 앱

무료 강의 「하네스 2종 + pstack으로 앱 하나 만들기」에서 처음부터 만든 앱과 하네스 전부예요.
커밋 기록이 곧 강의 순서예요. `git log --reverse --oneline v1..main`으로 한 장씩 따라갈 수 있어요.

1. 빈 폴더에서 디자인 하네스 만들기 → `design-harness-build/`
2. 디자인 하네스로 PRD부터 피그마·검증·핸드오프, 3D 지도 앱까지
3. 일반 하네스(규칙 · 테스트 · 훅 · 권한 · CI)와 두 하네스 겹침 정리
4. pstack 얹고 덜어내기 → 실데이터 서버 → 형식 검증(TLA+) → 고치기 → 상태 그림

이전 버전(목록·상세 화면 앱)은 `v1` 태그에 그대로 있어요.

## 들어 있는 것

| 위치 | 무엇 |
|---|---|
| `index.html` | 휴대폰 웹 화면 한 파일. MapLibre + OpenFreeMap 3D 지도에 빈자리만큼 솟은 기둥, 목록 · 검색 · 상세 |
| `server.mjs` | 앱과 `/api/parkings`(실시간 데이터)를 내보내는 작은 서버. 인증키는 여기서만 읽어요 |
| `data/parkings.json` | 테스트 · 화면 검사용으로 저장해 둔 실제 응답 |
| `work/seoul-parking/`, `out/` | 디자인 하네스 산출물: PRD · 리서치 · IA · 와이어프레임 · 디자인 시스템 · 피그마 노드 · 검토 점수 · 핸드오프 · 승인 기록 |
| `CLAUDE.md`, `.claude/` | 일반 하네스: 규칙 · 경로 규칙 · `/tdd` 스킬 · 편집 훅 · Stop 훅 · 권한 |
| `tests/`, `.github/workflows/test.yml`, `scripts/lint-web.mjs` | 테스트, CI, 상태별 화면 검사 드라이버 |
| `formal/refresh-order/` | 형식 검증(TLA+): 새로고침 순서 모델 · 약속 · 반례 기록 · 상태 그림(고치기 전 · 뒤) |
| `.claude/skills/verify-refresh-order/` | 다음 사람(에이전트)이 검증을 이어 가는 스킬 |
| `design-harness-build/` | 강의에서 빈 폴더부터 만든 디자인 하네스 |
| `design-harness/` | 앱 시연에 쓴, 같은 설계로 다듬은 디자인 하네스 완성판 |
| `PROMPTS.md` | 영상 속 프롬프트 원문 |

## 실행

```bash
cp .env.example .env    # 서울 열린데이터광장 인증키를 넣는다
node --env-file=.env server.mjs
```

브라우저에서 `http://localhost:8000/`. 테스트는 `node --test tests/*.test.mjs` (의존성 없음, Node 18 이상).

## 하네스 붙이기 (Claude Code)

```bash
claude plugin marketplace add ./design-harness
claude plugin install design-harness@design-harness --scope project
claude plugin marketplace add cursor/plugins
claude plugin install pstack@cursor-plugins --scope project
```

디자인 하네스 CLI(`design-harness`)는 Node 20 이상이 필요해요. 형식 검증을 다시 돌리려면 Java와 TLA+ 도구(`tla2tools.jar`)가 필요하고, 방법은 `.claude/skills/verify-refresh-order/`에 있어요.

## 데이터

서울 열린데이터광장 「서울시 시영주차장 실시간 주차대수 정보」(GetParkingInfo)와 「서울시 공영주차장 안내 정보」(GetParkInfo)의 위치(LAT · LOT). 지도 바탕은 OpenFreeMap.

## 라이선스

MIT. `design-harness/`는 그 안의 LICENSE를 따라요.
