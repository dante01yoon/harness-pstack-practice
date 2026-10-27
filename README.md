# 하네스 2종 + pstack 실습 · 서울 공영주차장 빈자리 앱

무료 강의 「하네스 2종 + pstack으로 앱 하나 만들기」에서 처음부터 만든 앱과 하네스 전부예요.
커밋 기록이 곧 강의 순서예요. `git log --reverse --oneline`으로 한 장씩 따라갈 수 있어요.

## 들어 있는 것

| 위치 | 무엇 |
|---|---|
| `index.html` | 휴대폰 웹 화면 한 파일(목록 · 검색 · 상세 · 즐겨찾기 · 빈자리 배너) |
| `server/index.mjs` | Open API를 대신 불러 주는 작은 서버. 인증키는 서버에만 있어요 |
| `work/seoul-parking/` | 디자인 하네스 산출물: PRD · 리서치 · IA · 와이어프레임 · 디자인 시스템 · 핸드오프 · 승인 기록 |
| `CLAUDE.md`, `.claude/` | 일반 하네스: 규칙 · 경로 규칙 · `/tdd` 스킬 · 편집 훅 · Stop 훅 · 권한 |
| `tests/`, `.github/workflows/check.yml` | 테스트와 CI |
| `verify/refresh-order/` | 형식 검증(TLA+): 순서 모델 · 약속 3개 · 변형(mutant) · 실제 코드 재현 · 상태 차트 |
| `.claude/skills/verify-refresh-order/` | 다음 사람(에이전트)이 검증을 이어 가는 스킬 |
| `design-harness/` | 강의에서 쓴 디자인 하네스 플러그인 |
| `PROMPTS.md` | 영상 속 프롬프트 원문 |

## 실행

```bash
cp .env.example .env    # 서울 열린데이터광장 인증키를 넣는다
node --env-file=.env server/index.mjs
```

브라우저에서 `http://127.0.0.1:8000/`. 테스트는 `node --test tests/*.test.mjs` (의존성 없음, Node 20 이상).

## 하네스 붙이기 (Claude Code)

```bash
claude plugin marketplace add ./design-harness
claude plugin install design-harness@design-harness --scope project
claude plugin marketplace add cursor/plugins
claude plugin install pstack@cursor-plugins --scope project
```

형식 검증을 다시 돌리려면 Java와 TLA+ 도구(`tla2tools.jar`)가 필요해요. 방법은 `verify/refresh-order/` 안의 `run.sh`와 스킬 문서에 있어요.

## 데이터

서울 열린데이터광장 「서울시 시영주차장 실시간 주차대수 정보」(GetParkingInfo). `data/parking.json`은 테스트용으로 저장해 둔 실제 응답이에요.

## 라이선스

MIT. `design-harness/`는 그 안의 LICENSE를 따라요.
