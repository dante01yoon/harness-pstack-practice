---------------------------- MODULE RefreshOrder ----------------------------
(* 30초 새로고침·즐겨찾기 빈자리 알림(PRD F9·F10)의 순서 모델.
   즐겨찾기한 주차장 하나와 이 브라우저 한 개, 그리고 같은 서버를 쓰는 다른 브라우저들을 본다.
   각 동작은 JS 이벤트 루프에서 끊기지 않고 도는 한 덩어리(await 사이)와 같다.
   동작마다 옆에 index.html·server/index.mjs 줄을 적었다. *)
EXTENDS Naturals, FiniteSets

CONSTANTS
  MaxVer,          \* Open API가 내놓는 스냅숏 개수(1..MaxVer, 번호가 클수록 새것)
  MaxLoads,        \* 이 브라우저가 load()를 부르는 최대 횟수(첫 load 포함)
  GuardRefreshing  \* TRUE = 지금 코드. index.html:681 `if (!state.refreshing) load()`와 :700 canAutoLoad의 `!state.refreshing`

Vers  == 1..MaxVer
Loads == 1..MaxLoads
Avail == {0, 1}      \* 0 = 만차, 1 = 빈자리 1면 이상. 알림 조건(:357)은 0과 1 이상만 가른다.

VARIABLES
  snap,        \* [Vers -> Avail] Open API 스냅숏 v에서 이 주차장의 TPKCT − NOW_PRK_VHCL_CNT
  upVer,       \* Open API의 지금 스냅숏 번호
  cache,       \* server/index.mjs:31 cached (0 = 없음)
  cacheFresh,  \* :34 now() − cached.at < ttlMs
  pending,     \* :32 pending ≠ null
  fetchFrom,   \* 진행 중인 Open API 호출이 시작될 때의 upVer
  waiters,     \* pending을 기다리는 이 브라우저의 요청 번호들
  toServer,    \* 보냈지만 서버에 아직 닿지 않은 요청 번호
  net,         \* 서버가 보낸 응답 <<요청 번호, 스냅숏 번호(0 = 502)>>. 어떤 순서로든 도착할 수 있다
  phase,       \* load() k의 위치: idle | fetch(:365 await fetch) | json(:367 await res.json()) | done
  had,         \* load() k의 hadData(:362)
  got,         \* load() k가 받은 스냅숏 번호
  lots,        \* state.lots가 담은 스냅숏 번호(0 = 아직 없음). 목록·상세 숫자는 여기서 나온다
  status,      \* state.status
  refreshing,  \* state.refreshing
  banner,      \* state.openings의 이 주차장 배너가 담은 스냅숏 번호(0 = 배너 없음)
  notes,       \* [Vers -> Nat] 빈자리가 생긴 사건(스냅숏 번호로 식별)마다 배너를 띄운 횟수
  maxSeen,     \* 이 브라우저가 지금까지 다 읽은 응답 가운데 가장 새 스냅숏 번호
  nextK        \* 다음 load() 번호

vars == <<snap, upVer, cache, cacheFresh, pending, fetchFrom, waiters, toServer, net,
          phase, had, got, lots, status, refreshing, banner, notes, maxSeen, nextK>>
server == <<cache, cacheFresh, pending, fetchFrom, waiters>>
client == <<phase, had, got, lots, status, refreshing, banner, notes, maxSeen, nextK>>

Max(a, b) == IF a >= b THEN a ELSE b

(* 응답 묶음. fetch가 이미 끝난 load에 가는 응답은 아무도 읽지 않으므로 넣지 않는다(상태 수 줄이기). *)
Reply(ks, v) == {<<k, v>> : k \in {j \in ks : phase[j] = "fetch"}}

(* 스냅숏 v에서 보이는 빈자리가 처음 생긴 스냅숏. 만차 → 빈자리로 바뀐 한 번의 사건이다. *)
Opening(v) == CHOOSE u \in 1..v :
                /\ u = 1 \/ snap[u - 1] = 0
                /\ \A w \in u..v : snap[w] >= 1

Init ==
  /\ snap \in [Vers -> Avail]
  /\ upVer = 1
  /\ cache = 0 /\ cacheFresh = FALSE /\ pending = FALSE /\ fetchFrom = 0 /\ waiters = {}
  \* index.html:707-708 render(); load(): 첫 load는 hadData=false라 status만 loading
  /\ toServer = {1} /\ net = {}
  /\ phase = [k \in Loads |-> IF k = 1 THEN "fetch" ELSE "idle"]
  /\ had = [k \in Loads |-> FALSE] /\ got = [k \in Loads |-> 0]
  /\ lots = 0 /\ status = "loading" /\ refreshing = FALSE
  /\ banner = 0 /\ notes = [u \in Vers |-> 0] /\ maxSeen = 0 /\ nextK = 2

---------------------------------------------------------------------------
(* 브라우저 *)

(* load()를 부르는 세 길. 새로고침 버튼은 status=ready일 때만 그려지고(:477 :564),
   다시 시도는 error일 때만(:505 :573), 클릭 처리는 :681. 30초 타이머(:702)와
   visibilitychange(:704)는 canAutoLoad(:700). 보임·검색창 초점·30초 경과 조건은 막기만 하므로 빼서 더 넓게 본다. *)
CanStart == /\ GuardRefreshing => ~refreshing
            /\ status \in {"ready", "error"}

(* :361-365 load() 시작부터 fetch를 보내기까지 *)
Start ==
  /\ nextK <= MaxLoads
  /\ CanStart
  /\ LET k == nextK
         h == lots # 0
     IN /\ had' = [had EXCEPT ![k] = h]
        /\ refreshing' = IF h THEN TRUE ELSE refreshing
        /\ status' = IF h THEN status ELSE "loading"
        /\ phase' = [phase EXCEPT ![k] = "fetch"]
        /\ toServer' = toServer \cup {k}
        /\ nextK' = k + 1
  /\ UNCHANGED <<snap, upVer, server, net, got, lots, banner, notes, maxSeen>>

(* :381-386 catch와 finally *)
FailLoad(k) ==
  /\ phase' = [phase EXCEPT ![k] = "done"]
  /\ status' = IF had[k] THEN status ELSE "error"
  /\ refreshing' = FALSE

(* :365-367 fetch가 응답을 받음. 502면 :366에서 던짐 *)
Receive(k, v) ==
  /\ <<k, v>> \in net
  /\ phase[k] = "fetch"
  /\ net' = net \ {<<k, v>>}
  /\ IF v = 0
       THEN FailLoad(k) /\ UNCHANGED got
       ELSE /\ phase' = [phase EXCEPT ![k] = "json"]
            /\ got' = [got EXCEPT ![k] = v]
            /\ UNCHANGED <<status, refreshing>>
  /\ UNCHANGED <<snap, upVer, server, toServer, had, lots, banner, notes, maxSeen, nextK>>

(* fetch가 네트워크 오류로 끊김. 서버가 나중에 보내는 응답은 아무도 읽지 않는다 *)
NetFail(k) ==
  /\ phase[k] = "fetch"
  /\ FailLoad(k)
  /\ net' = {m \in net : m[1] # k}
  /\ UNCHANGED <<snap, upVer, server, toServer, had, got, lots, banner, notes, maxSeen, nextK>>

(* :367 res.json() 또는 :369 rows 검사에서 던짐 *)
JsonFail(k) ==
  /\ phase[k] = "json"
  /\ FailLoad(k)
  /\ UNCHANGED <<snap, upVer, server, toServer, net, had, got, lots, banner, notes, maxSeen, nextK>>

(* :368-386 state.lots를 바꾸고, hadData면 openings()(:353-359)로 배너를 고른다(:372-377).
   즐겨찾기이고 양쪽 숫자가 실시간·20분 이내라고 둔다. 알림이 갈 수 있는 경우만 본다. *)
JsonDone(k) ==
  /\ phase[k] = "json"
  /\ LET v      == got[k]
         prev   == lots
         notify == had[k] /\ prev # 0 /\ snap[prev] = 0 /\ snap[v] >= 1
     IN /\ lots' = v
        /\ banner' = IF notify THEN v ELSE banner
        /\ notes' = IF notify THEN [notes EXCEPT ![Opening(v)] = @ + 1] ELSE notes
        /\ maxSeen' = Max(maxSeen, v)
  /\ status' = "ready"
  /\ refreshing' = FALSE
  /\ phase' = [phase EXCEPT ![k] = "done"]
  /\ UNCHANGED <<snap, upVer, server, toServer, net, had, got, nextK>>

(* :690 배너 닫기 *)
Dismiss ==
  /\ banner # 0
  /\ banner' = 0
  /\ UNCHANGED <<snap, upVer, server, toServer, net, phase, had, got, lots, status, refreshing, notes, maxSeen, nextK>>

---------------------------------------------------------------------------
(* 서버 server/index.mjs:33-39 cachedParking(). 마이크로태스크는 다음 요청보다 먼저 다 돌므로
   Open API 응답 뒤 cached 저장·대기자 응답·pending 비우기는 한 덩어리다. *)

Arrive(k) ==
  /\ k \in toServer
  /\ toServer' = toServer \ {k}
  /\ IF cache # 0 /\ cacheFresh
       THEN /\ net' = net \cup Reply({k}, cache)             \* :34 저장해 둔 응답
            /\ UNCHANGED <<pending, fetchFrom, waiters>>
       ELSE IF pending
         THEN /\ waiters' = waiters \cup {k}                   \* :35 진행 중인 한 번을 같이 기다림
              /\ UNCHANGED <<net, pending, fetchFrom>>
         ELSE /\ pending' = TRUE /\ fetchFrom' = upVer          \* :35 새로 부름
              /\ waiters' = {k}
              /\ UNCHANGED net
  /\ UNCHANGED <<snap, upVer, cache, cacheFresh, client>>

(* 다른 브라우저의 요청. 저장분이 없거나 지났고 진행 중인 호출이 없으면 새로 부르게 만든다 *)
OtherArrive ==
  /\ ~(cache # 0 /\ cacheFresh)
  /\ ~pending
  /\ pending' = TRUE /\ fetchFrom' = upVer /\ waiters' = {}
  /\ UNCHANGED <<snap, upVer, cache, cacheFresh, toServer, net, client>>

(* :36 성공. Open API는 호출 시작과 끝 사이 어느 스냅숏이든 돌려줄 수 있다 *)
UpstreamOk ==
  /\ pending
  /\ \E v \in fetchFrom..upVer :
       /\ cache' = v /\ cacheFresh' = TRUE
       /\ net' = net \cup Reply(waiters, v)
  /\ pending' = FALSE /\ waiters' = {}
  /\ UNCHANGED <<snap, upVer, fetchFrom, toServer, client>>

(* :30·:51-54 실패는 저장하지 않고 기다리던 요청에 502 *)
UpstreamFail ==
  /\ pending
  /\ net' = net \cup Reply(waiters, 0)
  /\ pending' = FALSE /\ waiters' = {}
  /\ UNCHANGED <<snap, upVer, cache, cacheFresh, fetchFrom, toServer, client>>

(* 30초가 지나 저장분이 만료됨 *)
Expire ==
  /\ cacheFresh
  /\ cacheFresh' = FALSE
  /\ UNCHANGED <<snap, upVer, cache, pending, fetchFrom, waiters, toServer, net, client>>

(* Open API 쪽 주차 대수가 새로 바뀜 *)
Advance ==
  /\ upVer < MaxVer
  /\ upVer' = upVer + 1
  /\ UNCHANGED <<snap, server, toServer, net, client>>

Next ==
  \/ Start \/ Dismiss \/ OtherArrive \/ UpstreamOk \/ UpstreamFail \/ Expire \/ Advance
  \/ \E k \in Loads : Arrive(k) \/ NetFail(k) \/ JsonFail(k) \/ JsonDone(k)
  \/ \E m \in net : Receive(m[1], m[2])

Spec == Init /\ [][Next]_vars

---------------------------------------------------------------------------
(* 약속 *)

(* 약속 1: 목록·상세의 빈자리 숫자는 이 브라우저가 받은 응답 가운데 가장 새것이다. *)
ScreenLatest == lots = maxSeen

(* 약속 1을 화면 전체로: 빈자리 배너의 숫자도 지금 목록과 같은 응답에서 나온다. *)
BannerLatest == banner \in {0, lots}

(* 약속 2: 만차에서 빈자리로 바뀐 한 번의 사건에 배너는 한 번만 뜬다(닫은 뒤 다시 뜨는 것도 두 번). *)
NotifyOnce == \A u \in Vers : notes[u] <= 1

TypeOK ==
  /\ lots \in 0..MaxVer /\ banner \in 0..MaxVer /\ maxSeen \in 0..MaxVer
  /\ status \in {"loading", "ready", "error"} /\ refreshing \in BOOLEAN
=============================================================================
