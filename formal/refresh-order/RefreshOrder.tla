---------------------------- MODULE RefreshOrder ----------------------------
(***************************************************************************)
(* 새로고침 순서 모델. 근거는 모두 index.html의 "---- 데이터 ----"와        *)
(* "---- 시작 ----" 부분이다: load(), showError(), refresh(), start(),     *)
(* 그리고 .loading-veil(z-index 20, 덮여 있는 동안 버튼을 못 누름).          *)
(*                                                                         *)
(* 한 걸음 = 브라우저 이벤트 루프의 한 차례. JS는 await 사이를 끊기지 않고    *)
(* 실행하므로 "응답 도착 + S.rows 대입 + 그리기"는 한 걸음이다.              *)
(* load()가 resolve/reject 되는 순서는 아무렇게나 섞일 수 있다(응답 지연).    *)
(*                                                                         *)
(* 요청 번호 = load()를 부른 순서. 번호가 클수록 나중에 보낸 요청이다.       *)
(***************************************************************************)
EXTENDS Naturals, FiniteSets

CONSTANTS
  MaxClicks,              \* 사람이 누르는 횟수 상한(새로고침 + 다시 시도)
  RefreshDropsStale,      \* refresh()가 마지막 요청이 아닌 응답을 버리는가 (현재 코드: FALSE)
  StartDropsStale,        \* start()가 마지막 요청이 아닌 응답을 버리는가 (현재 코드: FALSE)
  ClearsListOnStartFail   \* start() 실패 때 map이 없으면 #listBody를 비우는가 (현재 코드: TRUE)

VARIABLES
  webgl,    \* webglOK() 결과. 처음에 정해지고 바뀌지 않는다
  sent,     \* 지금까지 load()를 부른 횟수 = 가장 마지막 요청 번호
  clicks,   \* 사람이 누른 횟수
  pending,  \* 응답을 기다리는 load() 호출: [id |-> 번호, kind |-> "start" 또는 "refresh"]
  okIds,    \* 성공 응답이 도착한 요청 번호들
  applied,  \* S.rows에 한 번이라도 들어간 응답의 요청 번호들 (검사용 기록)
  rows,     \* S.rows가 담은 응답의 요청 번호 (0 = 처음의 빈 배열)
  screen,   \* 화면(기둥·라벨 또는 목록)에 그려진 숫자의 요청 번호 (0 = 숫자 없음: 뼈대·빈 목록)
  started,  \* start()의 started 플래그
  veil,     \* #veil이 덮여 있는가 (.gone 없음)
  banner,   \* #errorBanner(다시 시도 버튼)가 보이는가
  wiped     \* 숫자가 보이던 화면이 숫자 없는 화면으로 바뀐 적이 있는가 (검사용 기록)

vars == <<webgl, sent, clicks, pending, okIds, applied, rows, screen, started, veil, banner, wiped>>

\* map은 첫 start() 성공 뒤 webglOK()일 때만 만들어진다 (start(): map = new maplibregl.Map)
HasMap == started /\ webgl

Req(i, k) == [id |-> i, kind |-> k]

\* 숫자가 보이던 화면이 이 걸음에서 숫자 없는 화면이 되면 기록한다 (각 걸음의 끝에 붙인다)
TrackWipe == wiped' = (wiped \/ (screen # 0 /\ screen' = 0))

\* 코드가 이 응답을 S.rows에 넣는가
Applies(r) ==
  \/ r.id = sent
  \/ r.kind = "refresh" /\ ~RefreshDropsStale
  \/ r.kind = "start" /\ ~StartDropsStale

\* 페이지 시작: listSkeleton(); start(); → 첫 load()가 나가 있고 #veil이 덮여 있다
Init ==
  /\ webgl \in BOOLEAN
  /\ sent = 1
  /\ clicks = 0
  /\ pending = {Req(1, "start")}
  /\ okIds = {}
  /\ applied = {}
  /\ rows = 0
  /\ screen = 0
  /\ started = FALSE
  /\ veil = TRUE
  /\ banner = FALSE
  /\ wiped = FALSE

\* 새로고침 버튼(#refresh 또는 #refresh2) → refresh() → load()
\* 이미 받는 중이어도 막지 않는다 (refresh()에 진행 중 검사 없음)
YouTapRefresh ==
  /\ ~veil
  /\ clicks < MaxClicks
  /\ clicks' = clicks + 1
  /\ sent' = sent + 1
  /\ pending' = pending \cup {Req(sent + 1, "refresh")}
  /\ UNCHANGED <<webgl, okIds, applied, rows, screen, started, veil, banner>>
  /\ TrackWipe

\* "다시 시도"(#retry) → start(): showError(false), #veil 덮음, load()
YouTapRetry ==
  /\ ~veil
  /\ banner
  /\ clicks < MaxClicks
  /\ clicks' = clicks + 1
  /\ sent' = sent + 1
  /\ pending' = pending \cup {Req(sent + 1, "start")}
  /\ banner' = FALSE
  /\ veil' = TRUE
  /\ UNCHANGED <<webgl, okIds, applied, rows, screen, started>>
  /\ TrackWipe

\* refresh()의 load() 성공: S.rows = rows; map이면 setColumns, 목록이면 renderList
RefreshArrives ==
  \E r \in pending :
    /\ r.kind = "refresh"
    /\ pending' = pending \ {r}
    /\ okIds' = okIds \cup {r.id}
    /\ IF Applies(r) THEN rows' = r.id /\ screen' = r.id /\ applied' = applied \cup {r.id}
                     ELSE UNCHANGED <<rows, screen, applied>>
    /\ UNCHANGED <<webgl, sent, clicks, started, veil, banner>>
    /\ TrackWipe

\* refresh()의 load() 실패: toast만 띄우고 S.rows는 그대로
RefreshFails ==
  \E r \in pending :
    /\ r.kind = "refresh"
    /\ pending' = pending \ {r}
    /\ UNCHANGED <<webgl, sent, clicks, okIds, applied, rows, screen, started, veil, banner>>
    /\ TrackWipe

\* start()의 load() 성공
\*  - 처음(started 거짓): S.rows = rows, 지도 또는 목록을 그림, #veil 걷음
\*    (지도의 load 이벤트까지 기다리는 시간은 한 걸음으로 묶었다)
\*  - 다시(started 참): S.rows = rows, #veil 걷음, refresh() → load() 하나 더
StartArrives ==
  \E r \in pending :
    /\ r.kind = "start"
    /\ okIds' = okIds \cup {r.id}
    /\ veil' = FALSE
    /\ IF ~Applies(r) THEN
          /\ pending' = pending \ {r}
          /\ UNCHANGED <<sent, rows, screen, started, applied>>
       ELSE IF started THEN
          /\ rows' = r.id
          /\ applied' = applied \cup {r.id}
          /\ sent' = sent + 1
          /\ pending' = (pending \ {r}) \cup {Req(sent + 1, "refresh")}
          /\ UNCHANGED <<screen, started>>
       ELSE
          /\ pending' = pending \ {r}
          /\ started' = TRUE
          /\ rows' = r.id
          /\ applied' = applied \cup {r.id}
          /\ screen' = r.id
          /\ UNCHANGED sent
    /\ UNCHANGED <<webgl, clicks, banner>>
    /\ TrackWipe

\* start()의 load() 실패: #veil 걷음, showError(true),
\* map이 없으면 setView("list") 뒤 $("listBody").innerHTML = ""
StartFails ==
  \E r \in pending :
    /\ r.kind = "start"
    /\ pending' = pending \ {r}
    /\ veil' = FALSE
    /\ banner' = TRUE
    /\ screen' = IF ~HasMap /\ ClearsListOnStartFail THEN 0 ELSE screen
    /\ UNCHANGED <<webgl, sent, clicks, okIds, applied, rows, started>>
    /\ TrackWipe

\* 지도 이동·목록 전환·정렬 등으로 다시 그리기: 모두 그때의 S.rows를 읽는다
Redraw ==
  /\ ~veil
  /\ rows # 0
  /\ screen # rows
  /\ screen' = rows
  /\ UNCHANGED <<webgl, sent, clicks, pending, okIds, applied, rows, started, veil, banner>>
  /\ TrackWipe

\* 더 누를 수 없고 기다리는 응답도 없음: 끝 상태
Done ==
  /\ pending = {}
  /\ (veil \/ clicks = MaxClicks)
  /\ UNCHANGED vars

Next ==
  \/ YouTapRefresh
  \/ YouTapRetry
  \/ RefreshArrives
  \/ RefreshFails
  \/ StartArrives
  \/ StartFails
  \/ Redraw
  \/ Done

Spec == Init /\ [][Next]_vars

-----------------------------------------------------------------------------
TypeOK ==
  /\ webgl \in BOOLEAN
  /\ sent \in Nat /\ clicks \in 0..MaxClicks
  /\ \A r \in pending : r.id \in 1..sent /\ r.kind \in {"start", "refresh"}
  /\ okIds \subseteq 1..sent /\ applied \subseteq okIds
  /\ rows \in 0..sent /\ screen \in 0..sent
  /\ started \in BOOLEAN /\ veil \in BOOLEAN /\ banner \in BOOLEAN /\ wiped \in BOOLEAN

\* 약속 1: 화면이 읽는 숫자(S.rows)는 가장 마지막에 보낸 요청의 응답이다.
\*  (가) 한 번 넣은 응답보다 먼저 보낸 요청의 응답으로 되돌아가지 않는다.
\*  (나) 가장 마지막에 보낸 요청이 성공했으면 S.rows는 그 응답이다.
\* 더 나중 요청이 아직 오는 중이거나 실패해서 이전 숫자를 두는 것은 괜찮다
\* (그동안 도착한 중간 요청의 응답은 버려도, 넣어도 된다).
LatestWins ==
  /\ \A i \in applied : i <= rows
  /\ sent \in okIds => rows = sent

\* 약속 2: 불러오기 실패가 이미 보이는 숫자를 지우지 않는다.
NoWipe == ~wiped
=============================================================================
