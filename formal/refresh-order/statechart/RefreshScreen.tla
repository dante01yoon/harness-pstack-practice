---------------------------- MODULE RefreshScreen ----------------------------
(* 기획자용 그림의 모델. formal/refresh-order/RefreshOrder.tla를 바탕으로,  *)
(* 사용자가 보는 화면(지도/목록, 다시 시도 버튼)을 변수로 더했다.          *)
(* Fixed = FALSE: bc64f30(고치기 전), Fixed = TRUE: 8e63ca3(고친 뒤).       *)
EXTENDS Naturals, FiniteSets

CONSTANTS MaxClicks, Fixed

VARIABLES
  webgl,    \* 3D 지도를 그릴 수 있는 기기인가
  sent,     \* 마지막으로 보낸 요청 번호
  clicks,   \* 사람이 누른 횟수
  pending,  \* 기다리는 요청 [id, kind]
  okIds,    \* 성공 응답이 온 요청 번호
  applied,  \* 화면 숫자로 한 번이라도 들어간 요청 번호
  rows,     \* 지금 화면 숫자가 온 요청 번호 (0 = 숫자 없음)
  screen,   \* 화면에 그려진 숫자의 요청 번호 (0 = 숫자 없음)
  started,  \* 처음 시작을 마쳤는가 (start 성공)
  hasMap,   \* 지도가 만들어졌는가
  veil,     \* "불러오는 중" 덮개
  view,     \* "map" | "list"
  retry,    \* [다시 시도] 버튼이 보이고 눌리는가
  wiped     \* 보이던 숫자가 지워진 적이 있는가

vars == <<webgl, sent, clicks, pending, okIds, applied, rows, screen, started, hasMap, veil, view, retry, wiped>>
Req(i, k) == [id |-> i, kind |-> k]
TrackWipe == wiped' = (wiped \/ (screen # 0 /\ screen' = 0))

Init ==
  /\ webgl \in BOOLEAN
  /\ sent = 1 /\ clicks = 0
  /\ pending = {Req(1, "start")}
  /\ okIds = {} /\ applied = {} /\ rows = 0 /\ screen = 0
  /\ started = FALSE /\ hasMap = FALSE
  /\ veil = TRUE /\ view = "map" /\ retry = FALSE /\ wiped = FALSE

\* 새로고침 버튼. 고친 뒤: 숫자를 받기 전이면 start()와 같다.
YouTapRefresh ==
  /\ ~veil /\ clicks < MaxClicks
  /\ clicks' = clicks + 1 /\ sent' = sent + 1
  /\ IF Fixed /\ ~started
       THEN /\ pending' = pending \cup {Req(sent + 1, "start")}
            /\ veil' = TRUE /\ retry' = FALSE
       ELSE /\ pending' = pending \cup {Req(sent + 1, "refresh")}
            /\ UNCHANGED <<veil, retry>>
  /\ UNCHANGED <<webgl, okIds, applied, rows, screen, started, hasMap, view>>
  /\ TrackWipe

\* [다시 시도] → start()
YouTapRetry ==
  /\ ~veil /\ retry /\ clicks < MaxClicks
  /\ clicks' = clicks + 1 /\ sent' = sent + 1
  /\ pending' = pending \cup {Req(sent + 1, "start")}
  /\ veil' = TRUE /\ retry' = FALSE
  /\ UNCHANGED <<webgl, okIds, applied, rows, screen, started, hasMap, view>>
  /\ TrackWipe

\* refresh() 성공. 고친 뒤: 마지막 요청이 아니면 버린다. 고치기 전: 늘 넣는다.
RefreshArrives ==
  \E r \in pending :
    /\ r.kind = "refresh"
    /\ pending' = pending \ {r}
    /\ okIds' = okIds \cup {r.id}
    /\ IF ~Fixed \/ r.id = sent
         THEN rows' = r.id /\ screen' = r.id /\ applied' = applied \cup {r.id}
         ELSE UNCHANGED <<rows, screen, applied>>
    /\ UNCHANGED <<webgl, sent, clicks, started, hasMap, veil, view, retry>>
    /\ TrackWipe

\* refresh() 실패: 알림만, 숫자는 그대로
RefreshFails ==
  \E r \in pending :
    /\ r.kind = "refresh"
    /\ pending' = pending \ {r}
    /\ UNCHANGED <<webgl, sent, clicks, okIds, applied, rows, screen, started, hasMap, veil, view, retry>>
    /\ TrackWipe

\* start() 성공: 처음 시작. 3D 기기면 지도를 만들고 지도로, 아니면 목록으로.
\* 고치기 전: started 뒤에 다시 오면 덮개만 걷고 새로고침을 하나 더 보낸다(닿지 않음).
StartArrives ==
  \E r \in pending :
    /\ r.kind = "start"
    /\ pending' = pending \ {r}
    /\ okIds' = okIds \cup {r.id}
    /\ veil' = FALSE
    /\ IF ~Fixed /\ started
         THEN /\ rows' = r.id /\ applied' = applied \cup {r.id}
              /\ sent' = sent + 1
              /\ pending' = (pending \ {r}) \cup {Req(sent + 1, "refresh")}
              /\ UNCHANGED <<screen, started, hasMap, view>>
         ELSE /\ started' = TRUE /\ hasMap' = webgl
              /\ rows' = r.id /\ applied' = applied \cup {r.id} /\ screen' = r.id
              /\ view' = IF webgl THEN "map" ELSE "list"
              /\ pending' = pending \ {r}
              /\ UNCHANGED sent
    /\ UNCHANGED <<webgl, clicks, retry>>
    /\ TrackWipe

\* start() 실패: 목록으로 바꾼다. 고친 뒤: 목록에 실패 문구와 [다시 시도].
\* 고치기 전: 목록을 비우고, 목록이 지도 위의 [다시 시도]를 덮는다.
StartFails ==
  \E r \in pending :
    /\ r.kind = "start"
    /\ pending' = pending \ {r}
    /\ veil' = FALSE
    /\ IF Fixed \/ ~hasMap
         THEN /\ view' = "list" /\ screen' = 0
              /\ retry' = Fixed
         ELSE /\ retry' = TRUE /\ UNCHANGED <<view, screen>>
    /\ UNCHANGED <<webgl, sent, clicks, okIds, applied, rows, started, hasMap>>
    /\ TrackWipe

\* 더 누르지 않고 기다리는 응답도 없음(모델의 끝)
Done ==
  /\ pending = {}
  /\ clicks = MaxClicks
  /\ UNCHANGED vars

Next ==
  \/ YouTapRefresh \/ YouTapRetry
  \/ RefreshArrives \/ RefreshFails
  \/ StartArrives \/ StartFails
  \/ Done

Spec == Init /\ [][Next]_vars

\* 1. 화면 숫자는 마지막으로 보낸 요청의 응답이다(옛 숫자로 되돌아가지 않는다).
LatestWins ==
  /\ \A i \in applied : i <= rows
  /\ sent \in okIds => rows = sent
\* 2. 불러오기 실패가 보이던 숫자를 지우지 않는다.
NoWipe == ~wiped
\* 3. 숫자도 없고 불러오는 중도 아니면 [다시 시도]가 보인다.
RetryWhenEmpty == (~veil /\ screen = 0) => retry
\* 4. 숫자를 받으면 3D 기기는 지도로 보인다.
MapWhenCan == (~veil /\ screen # 0 /\ webgl) => view = "map"
=============================================================================
