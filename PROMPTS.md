# 영상 속 프롬프트 원문

영상에서 실제로 입력한 그대로예요. 순서대로 따라 하면 같은 흐름이 돼요. 결과는 매번 조금씩 다를 수 있어요.

## 디자인 하네스로 화면까지

```
claude plugin marketplace add ./design-harness
```

```
claude plugin install design-harness@design-harness --scope project
```

```
서울시 공영주차장 빈자리를 휴대폰에서 바로 볼 수 있는 앱을 만들고 싶어. 디자인 하네스로 PRD부터 시작해 줘.
- 데이터: 서울 열린데이터광장 「서울시 시영주차장 실시간 주차대수 정보」(GetParkingInfo), 키는 .env
- 프로젝트 이름: seoul-parking
- 쓰는 사람: 출발 전에 목적지 근처 주차장 빈자리를 확인하는 운전자
- 지도는 빼고 구·이름으로 찾는 목록, MVP는 목록·검색·상세(요금·운영시간), 휴대폰 웹
사람 승인이 필요한 단계에서는 멈추고 알려 줘.
```

```
! node design-harness/bin/design-harness approve wireframe --by dante
```

```
와이어프레임 승인했어. 기준 시각은 20분 넘으면 오래됨으로 해 줘. 디자인 시스템 단계 진행해 줘.
```

```
! node design-harness/bin/design-harness approve system --by dante
```

```
디자인 시스템 승인했어. 핸드오프까지 하고, 이 디자인대로 휴대폰 화면을 index.html 하나로 만들어 줘. 데이터는 지금 받은 실제 응답을 data/parking.json 스냅샷으로 저장해서 써. 다 되면 커밋해 줘.
```

## 일반 하네스 ① 규칙

```
이 주차장 앱에 하네스를 만들어 줘. 먼저 규칙 칸부터. CLAUDE.md랑 경로 규칙(.claude/rules)으로, 이 앱에서 늘 지켜야 할 것과 특정 파일을 만질 때만 필요한 걸 나눠서. 끝나면 커밋해 줘.
```

## 일반 하네스 ② 검증과 권한

```
이번엔 검증 칸이야. 테스트가 없으면 최소한으로 먼저 만들고, /tdd 스킬, 파일 고칠 때 도는 검사 훅, PR에서 도는 CI까지 붙여 줘. 권한 설정(settings.json)도 같이. 끝나면 커밋해 줘.
```

```
npm test 2>&1 | tail -6
```

## 디자인 하네스 붙이기

```
디자인 하네스도 이 앱 하네스에 제대로 붙여 줘. 화면 검사는 이미 편집 훅에 있지? DESIGN.md가 디자인 원본과 맞는지 검사하는 것, 답을 끝낼 때 도는 검사, PR CI에서는 어떻게 되는지까지 정리해서 붙여 줘. 끝나면 커밋해 줘.
```

## 두 하네스 겹침 점검

```
하네스가 두 개 붙었는데(이 앱 하네스 + 디자인 하네스) 겹치거나 어긋나는 데가 있는지 점검해 줘. 규칙, 검사, 훅, 명령 이름 다 봐. 표로 보여 주고, 정리까지 하고 커밋해 줘.
```

## pstack 설치

```
claude plugin marketplace add cursor/plugins
```

```
claude plugin install pstack@cursor-plugins --scope project
```

## pstack 얹고 덜어내기

```
/pstack:poteto-mode pstack을 이 앱에 얹었어. 우리 하네스랑 겹치는 곳을 표로 보여 주고, pstack이 이미 해 주는 일은 덜고 이 앱만의 사실은 남겨. 덜어낸 뒤에도 같은 검사가 그대로 도는지 확인하고 커밋해 줘.
```

## 실데이터 서버

```
/pstack:poteto-mode 스냅샷 말고 실제 데이터로 보여 줘. 키는 .env에서 작은 서버만 읽게, 브라우저나 응답에는 절대 안 나가게. 끝나면 커밋해 줘.
```

## 즐겨찾기 빈자리 알림

```
/pstack:poteto-mode 즐겨찾기한 주차장에 빈자리가 생기면 알려 주는 기능 넣어 줘. 화면은 30초마다 새로고침, 알림은 앱 안 배너로. 끝나면 커밋해 줘.
```

```
! node design-harness/bin/design-harness approve wireframe --by dante
```

```
! node design-harness/bin/design-harness approve system --by dante
```

```
바뀐 와이어프레임이랑 디자인 시스템 승인했어. 이어서 진행하고 커밋해 줘.
```

## 형식 검증

```
/pstack:create-formal-verification-skill 30초 새로고침이랑 즐겨찾기 빈자리 알림에 순서 버그가 없는지 형식 검증해 줘. 약속은 두 개야. 화면 숫자는 늘 가장 최근 응답이어야 하고, 빈자리가 생겼다는 알림은 한 번만 가야 해. 검증 파일도 커밋해 줘.
```

## 기능 하나 더 (구별 받기)

```
/pstack:poteto-mode 구를 고르면 그 구 주차장만 서버에서 받아 와서 보여 줘. 중구만 보는데 122곳을 다 받을 필요는 없잖아.
```

```
2번으로 해 줘. 즐겨찾기가 있는 구도 함께 받아서 알림은 지켜 주고, 구 목록 23개는 따로 둬. PRD도 고쳐서 진행하고 커밋해 줘.
```

## 검사 다시 맞추기

```
/pstack:maintain-formal-verification-skill 코드가 바뀌었어. 형식 검증이 지금 코드랑 맞는지 점검하고, 어긋난 게 있으면 맞춘 다음 두 약속이 여전히 지켜지는지 다시 돌려 줘.
```

```
git status --short
```

## F1 정하고 고치기

```
/pstack:poteto-mode 형식 검증에서 찾은 문제들 고쳐 줘. F1은 배너도 최신 숫자로 맞추고, 다시 만차가 되면 배너를 내리는 쪽으로 정할게. PRD에도 적어 줘. 고친 뒤 형식 검증 다시 돌려서 통과하는지 보고 커밋해 줘.
```

## 기획자에게 그림으로 (상태 차트)

```
/pstack:statechart 기획자가 볼 수 있게 F1을 그림으로 그려 줘. 배너가 옛 숫자에 남던 고치기 전과, 최신 숫자로 맞추고 만차면 내리는 고친 뒤를 같이, 사용자가 화면에서 보는 말로. 끝나면 커밋해 줘.
```
