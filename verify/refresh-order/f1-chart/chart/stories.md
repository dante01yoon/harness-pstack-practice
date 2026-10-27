## 1. 목록 만차 / 배너만 빈자리 n면, 옛 기준 시각

Rule broken: `BannerLatest`
Why: 목록은 새 응답에서 만차로 바뀌었는데, 배너는 띄울 때의 빈자리 숫자에 남았다.
In the model, one step leads into this bug: "새 숫자 도착: 만차". The steps below are the shortest path that TLC found.

0. Start: 불러오는 중…
   (5 hidden steps: 서버가 요청을 받음, 서버가 Open API 숫자를 받아 둠, 서버에 받아 둔 숫자가 30초 지남, Open API에서 주차장에 빈자리가 생김, 응답을 받아 읽는 중)
1. 새 숫자 도착: 만차. Now: 목록 만차 / 배너 없음
2. 새로고침 (30초마다 또는 버튼). Now: 목록 만차 / 배너 없음
   (5 hidden steps: 서버가 요청을 받음, 서버가 Open API 숫자를 받아 둠, 서버에 받아 둔 숫자가 30초 지남, Open API에서 주차장이 만차가 됨, 응답을 받아 읽는 중)
3. 새 숫자 도착: 빈자리. Now: 목록 빈자리 n면 / 배너 빈자리 n면, 목록과 같은 기준 시각
4. 새로고침 (30초마다 또는 버튼). Now: 목록 빈자리 n면 / 배너 빈자리 n면, 목록과 같은 기준 시각
   (3 hidden steps: 서버가 요청을 받음, 서버가 Open API 숫자를 받아 둠, 응답을 받아 읽는 중)
5. 새 숫자 도착: 만차. Now: 목록 만차 / 배너만 빈자리 n면, 옛 기준 시각

With 고친 뒤, step 5 (새 숫자 도착: 만차) takes you to: 목록 만차 / 배너 없음.

## 2. 목록 빈자리 n면 / 배너 빈자리 n면, 목록보다 옛 기준 시각

Rule broken: `BannerLatest`
Why: 목록은 새 응답의 빈자리 숫자로 바뀌었는데, 배너는 띄울 때의 숫자와 기준 시각에 남았다.
In the model, one step leads into this bug: "새 숫자 도착: 빈자리". The steps below are the shortest path that TLC found.

0. Start: 불러오는 중…
   (5 hidden steps: 서버가 요청을 받음, 서버가 Open API 숫자를 받아 둠, 서버에 받아 둔 숫자가 30초 지남, Open API에서 주차장에 빈자리가 생김, 응답을 받아 읽는 중)
1. 새 숫자 도착: 만차. Now: 목록 만차 / 배너 없음
2. 새로고침 (30초마다 또는 버튼). Now: 목록 만차 / 배너 없음
   (5 hidden steps: 서버가 요청을 받음, 서버가 Open API 숫자를 받아 둠, 서버에 받아 둔 숫자가 30초 지남, Open API에서 주차장에 빈자리가 생김, 응답을 받아 읽는 중)
3. 새 숫자 도착: 빈자리. Now: 목록 빈자리 n면 / 배너 빈자리 n면, 목록과 같은 기준 시각
4. 새로고침 (30초마다 또는 버튼). Now: 목록 빈자리 n면 / 배너 빈자리 n면, 목록과 같은 기준 시각
   (3 hidden steps: 서버가 요청을 받음, 서버가 Open API 숫자를 받아 둠, 응답을 받아 읽는 중)
5. 새 숫자 도착: 빈자리. Now: 목록 빈자리 n면 / 배너 빈자리 n면, 목록보다 옛 기준 시각

With 고친 뒤, step 5 (새 숫자 도착: 빈자리) takes you to: 목록 빈자리 n면 / 배너도 새 숫자·기준 시각으로 바뀜.
