---
paths:
  - "data/**"
  - "work/seoul-parking/data/**"
---

# 데이터 파일 규칙

- `parkings.json`은 서울 열린데이터광장 `GetParkingInfo`(OA-21709)와 `GetParkInfo`(OA-13122) 실제 응답을 `PKLT_CD`로 결합한 스냅샷이다. 손으로 값을 고치거나 행을 지어 넣지 않는다. 바꿀 때는 API를 다시 받아 통째로 만든다.
- 최상위 키 `source`, `license`, `fetchedAt`(한국 시간 ISO)을 유지하고, 다시 받으면 `fetchedAt`을 갱신한다.
- 행 필드는 `index.html`이 읽는 이름 그대로 둔다: `code, name, gu, addr, tel, live, total, parked, vacant, updatedAt, paid, basicFee, basicMin, addFee, addMin, dayMax, weekday, sat, holiday, lat, lng`. 이름을 바꾸면 `index.html`도 같이 바꾼다.
- 필드 대응: `live` = `PRK_STTS_YN == 1`, `vacant` = `max(0, TPKCT − NOW_PRK_VHCL_CNT)`, `updatedAt` = `NOW_PRK_VHCL_UPDT_TM` 원문(한국 시간). 운영시간은 `["HHMM", "HHMM"]`.
- 좌표가 0이거나 결합되지 않은 주차장은 `lat`·`lng`를 `null`로 두고(0으로 채우지 않는다) 행은 남긴다.
- `data/parkings.json`과 `work/seoul-parking/data/parkings.json`은 같은 내용이어야 한다. 하나를 바꾸면 다른 하나도 맞춘다.
- 인증키가 들어간 요청 URL이나 응답 헤더를 파일에 남기지 않는다.
