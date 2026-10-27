---------------------------- MODULE RefreshOrder ----------------------------
(* 30초 새로고침·즐겨찾기 빈자리 알림(PRD F9·F10)의 순서 모델.
   즐겨찾기한 주차장 하나와 이 브라우저 한 개, 그리고 같은 서버를 쓰는 다른 브라우저들을 본다.
   각 동작은 JS 이벤트 루프에서 끊기지 않고 도는 한 덩어리(await 사이)와 같다.
   동작마다 옆에 index.html·server/index.mjs 줄을 적었다. *)
EXTENDS Naturals, FiniteSets

CONSTANTS
  MaxVer,          \* Open API가 내놓는 스냅숏 개수(1..MaxVer, 번호가 클수록 새것)
  MaxLoads,        \* 이 브라우저가 load()를 부르는 최대 횟수(첫 load 포함)
  GuardRefreshing, \* TRUE = 지금 코드. 새로고침 클릭 `if (!state.refreshing) load()`와 canAutoLoad의 `!state.refreshing`
  DiscardSuperseded, \* TRUE = 지금 코드. load()가 `seq !== latestLoad`면 응답을 버리고 refreshing도 건드리지 않는다
  RefreshBanner    \* TRUE = 지금 코드. 띄운 배너를 새 응답 숫자로 바꾸고, 만차가 되면 내린다

Vers  == 1..MaxVer
Loads == 1..MaxLoads
Avail == {0, 1}      \* 0 = 만차, 1 = 빈자리 1면 이상. 알림 조건(:360)은 0과 1 이상만 가른다.

VARIABLES
  snap,        \* [Vers -> Avail] Open API 스냅숏 v에서 이 주차장의 TPKCT − NOW_PRK_VHCL_CNT
  upVer,       \* Open API의 지금 스냅숏 번호
  cache,       \* server/index.mjs:32 cached (0 = 없음)
  cacheFresh,  \* :35 now() − cached.at < ttlMs
  pending,     \* :33 pending ≠ null
  fetchFrom,   \* 진행 중인 Open API 호출이 시작될 때의 upVer
  waiters,     \* pending을 기다리는 이 브라우저의 요청 번호들
  toServer,    \* 보냈지만 서버에 아직 닿지 않은 요청 번호
  net,         \* 서버가 보낸 응답 <<요청 번호, 스냅숏 번호(0 = 501)>>. 어떤 순서로든 도착할 수 있다
  phase,       \* load() k의 위치: idle | fetch(:381 await fetch) | json(:383 await res.json()) | done
  had,         \* load() k의 hadData(:378)
  got,         \* load() k가 받은 스냅숏 번호
  lots,        \* state.lots가 담은 스냅숏 번호(0 = 아직 없음). 목록·상세 숫자는 여기서 나온다
  status,      \* state.status
  refreshing,  \* state.refreshing
  banner,      \* state.openings의 이 주차장 배너가 담은 스냅숏 번호(0 = 배너 없음)
  bannerKept,  \* 띄운 배너를 새 응답 숫자로 바꿔 둔 채인가(index.html:391 kept). 그림의 말에만 쓴다
  notes,       \* [Vers -> Nat] 빈자리가 생긴 사건(스냅숏 번호로 식별)마다 배너를 띄운 횟수
  maxSeen,     \* 이 브라우저가 지금까지 다 읽은 응답 가운데 가장 새 스냅숏 번호
  nextK,       \* 다음 load() 번호
  latest       \* 마지막에 시작한 load() 번호(index.html latestLoad)

vars == <<snap, upVer, cache, cacheFresh, pending, fetchFrom, waiters, toServer, net,
          phase, had, got, lots, status, refreshing, banner, bannerKept, notes, maxSeen, nextK, latest>>
server == <<cache, cacheFresh, pending, fetchFrom, waiters>>
client == <<phase, had, got, lots, status, refreshing, banner, bannerKept, notes, maxSeen, nextK, latest>>

Max(a, b) == IF a >= b THEN a ELSE b

(* 응답 묶음. fetch가 이미 끝난 load에 가는 응답은 아무도 읽지 않으므로 넣지 않는다(상태 수 줄이기). *)
Reply(ks, v) == {<<k, v>> : k \in {j \in ks : phase[j] = "fetch"}}

(* 스냅숏 v에서 보이는 빈자리가 처음 생긴 스냅숏. 만차 → 빈자리로 바뀐 한 번의 사건이다. *)
Opening(v) == CHOOSE u \in 1..v :
                /\ u = 1 \/ snap[u - 1] = 0
                /\ \A w \in u..v : snap[w] >= 1

Init ==
  \* 원본은 처음에 모든 스냅숏 값을 고른다. 그림의 되짚기가 같은 값을 따라가도록, 아직 오지 않은 스냅숏은 0으로 두고
  \* AdvanceFull·AdvanceOpen이 새 값을 고른다. 그 전에는 아무 동작도 upVer보다 뒤 스냅숏을 읽지 않으므로 같은 행동들이다.
  /\ snap \in {f \in [Vers -> Avail] : \A w \in Vers : w > 1 => f[w] = 0}
  /\ upVer = 1
  /\ cache = 0 /\ cacheFresh = FALSE /\ pending = FALSE /\ fetchFrom = 0 /\ waiters = {}
  \* index.html:728-729 render(); load(): 첫 load는 hadData=false라 status만 loading
  /\ toServer = {1} /\ net = {}
  /\ phase = [k \in Loads |-> IF k = 1 THEN "fetch" ELSE "idle"]
  /\ had = [k \in Loads |-> FALSE] /\ got = [k \in Loads |-> 0]
  /\ lots = 0 /\ status = "loading" /\ refreshing = FALSE
  /\ banner = 0 /\ bannerKept = FALSE /\ notes = [u \in Vers |-> 0] /\ maxSeen = 0 /\ nextK = 2 /\ latest = 1

---------------------------------------------------------------------------
(* 브라우저 *)

(* load()를 부르는 세 길(구 칩은 아래 Switch). 새로고침 버튼은 status=ready일 때만 그려지고(:501 :590),
   다시 시도는 error이거나 고른 구를 못 받았을 때(status=ready)만(:531), 클릭 처리는 :702. 30초 타이머(:723)와
   visibilitychange(:725)는 canAutoLoad(:721). 보임·검색창 초점·30초 경과 조건은 막기만 하므로 빼서 더 넓게 본다. *)
CanStart == /\ GuardRefreshing => ~refreshing
            /\ status \in {"ready", "error"}

(* load() 시작부터 fetch를 보내기까지 *)
Begin ==
  /\ nextK <= MaxLoads
  /\ latest' = nextK
  /\ LET k == nextK
         h == lots # 0
     IN /\ had' = [had EXCEPT ![k] = h]
        /\ refreshing' = IF h THEN TRUE ELSE refreshing
        /\ status' = IF h THEN status ELSE "loading"
        /\ phase' = [phase EXCEPT ![k] = "fetch"]
        /\ toServer' = toServer \cup {k}
        /\ nextK' = k + 1
  /\ UNCHANGED <<snap, upVer, server, net, got, lots, banner, bannerKept, notes, maxSeen>>

Start == CanStart /\ Begin

(* pickDistrict()(:408)를 부르는 두 길: 구 칩(:698)과 검색어 지우기(:703, '전체'로). 칩은 status=ready일 때만
   그려진다(:512). 지우기 버튼은 status를 보지 않지만 검색어가 있을 때만 보이고 검색창은 ready일 때만 입력되며,
   즐겨찾기가 늘 응답에 있어 lots가 비지 않으므로 한 번 ready면 계속 ready다. 둘 다 불러오는 중이어도 막지 않는다.
   목록이 어느 구를 담았는지는 보지 않는다. 즐겨찾기 주차장은 어느 구를 골라도 응답에 들어 있다(dataUrl). *)
Switch == status = "ready" /\ Begin

(* 이 load가 마지막에 시작한 것인가. 아니면 응답·실패를 버린다 *)
Current(k) == ~DiscardSuperseded \/ k = latest

(* catch와 finally *)
FailLoad(k) ==
  /\ phase' = [phase EXCEPT ![k] = "done"]
  /\ IF Current(k)
       THEN /\ status' = IF had[k] THEN status ELSE "error"
            /\ refreshing' = FALSE
       ELSE UNCHANGED <<status, refreshing>>

(* :381-383 fetch가 응답을 받음. 501면 :382에서 던짐 *)
Receive(k, v) ==
  /\ <<k, v>> \in net
  /\ phase[k] = "fetch"
  /\ net' = net \ {<<k, v>>}
  /\ IF v = 0
       THEN FailLoad(k) /\ UNCHANGED got
       ELSE /\ phase' = [phase EXCEPT ![k] = "json"]
            /\ got' = [got EXCEPT ![k] = v]
            /\ UNCHANGED <<status, refreshing>>
  /\ UNCHANGED <<snap, upVer, server, toServer, had, lots, banner, bannerKept, notes, maxSeen, nextK, latest>>

(* fetch가 네트워크 오류로 끊김. 서버가 나중에 보내는 응답은 아무도 읽지 않는다 *)
NetFail(k) ==
  /\ phase[k] = "fetch"
  /\ FailLoad(k)
  /\ net' = {m \in net : m[1] # k}
  /\ UNCHANGED <<snap, upVer, server, toServer, had, got, lots, banner, bannerKept, notes, maxSeen, nextK, latest>>

(* :383 res.json() 또는 :386 rows 검사에서 던짐 *)
JsonFail(k) ==
  /\ phase[k] = "json"
  /\ FailLoad(k)
  /\ UNCHANGED <<snap, upVer, server, toServer, net, had, got, lots, banner, bannerKept, notes, maxSeen, nextK, latest>>

(* :384-406 seq 검사 뒤 state.lots를 바꾸고, 띄운 배너는 새 숫자로 바꾸거나 만차면 내린 뒤(kept)
   openings()(:356-362)가 새로 고른 배너를 붙인다. 처음 load는 prev가 비어 openings()가 아무것도 고르지 않는다.
   즐겨찾기이고 양쪽 숫자가 실시간·20분 이내라고 둔다. 알림이 갈 수 있는 경우만 본다. *)
JsonDone(k) ==
  /\ phase[k] = "json"
  /\ phase' = [phase EXCEPT ![k] = "done"]
  /\ IF Current(k)
       THEN LET v      == got[k]
                prev   == lots
                notify == had[k] /\ prev # 0 /\ snap[prev] = 0 /\ snap[v] >= 1
            IN /\ lots' = v
               /\ banner' = CASE notify                          -> v
                              [] ~RefreshBanner                   -> banner
                              [] banner # 0 /\ snap[v] >= 1       -> v
                              [] OTHER                            -> 0
               /\ bannerKept' = (~notify /\ RefreshBanner /\ banner # 0 /\ snap[v] >= 1)
               /\ notes' = IF notify THEN [notes EXCEPT ![Opening(v)] = @ + 1] ELSE notes
               /\ maxSeen' = Max(maxSeen, v)
               /\ status' = "ready"
               /\ refreshing' = FALSE
       ELSE UNCHANGED <<lots, banner, bannerKept, notes, maxSeen, status, refreshing>>   \* 버린 응답
  /\ UNCHANGED <<snap, upVer, server, toServer, net, had, got, nextK, latest>>

(* :711 배너 닫기 *)
Dismiss ==
  /\ banner # 0
  /\ banner' = 0 /\ bannerKept' = FALSE
  /\ UNCHANGED <<snap, upVer, server, toServer, net, phase, had, got, lots, status, refreshing, notes, maxSeen, nextK, latest>>

---------------------------------------------------------------------------
(* 서버 server/index.mjs:34-40 cachedParking(). 마이크로태스크는 다음 요청보다 먼저 다 돌므로
   Open API 응답 뒤 cached 저장·대기자 응답·pending 비우기는 한 덩어리다. *)

Arrive(k) ==
  /\ k \in toServer
  /\ toServer' = toServer \ {k}
  /\ IF cache # 0 /\ cacheFresh
       THEN /\ net' = net \cup Reply({k}, cache)             \* :35 저장해 둔 응답
            /\ UNCHANGED <<pending, fetchFrom, waiters>>
       ELSE IF pending
         THEN /\ waiters' = waiters \cup {k}                   \* :36 진행 중인 한 번을 같이 기다림
              /\ UNCHANGED <<net, pending, fetchFrom>>
         ELSE /\ pending' = TRUE /\ fetchFrom' = upVer          \* :36 새로 부름
              /\ waiters' = {k}
              /\ UNCHANGED net
  /\ UNCHANGED <<snap, upVer, cache, cacheFresh, client>>

(* 다른 브라우저의 요청. 저장분이 없거나 지났고 진행 중인 호출이 없으면 새로 부르게 만든다 *)
OtherArrive ==
  /\ ~(cache # 0 /\ cacheFresh)   \* server/index.mjs:35
  /\ ~pending   \* server/index.mjs:36
  /\ pending' = TRUE /\ fetchFrom' = upVer /\ waiters' = {}
  /\ UNCHANGED <<snap, upVer, cache, cacheFresh, toServer, net, client>>

(* :37 성공. Open API는 호출 시작과 끝 사이 어느 스냅숏이든 돌려줄 수 있다 *)
UpstreamOk ==
  /\ pending
  /\ \E v \in fetchFrom..upVer :
       /\ cache' = v /\ cacheFresh' = TRUE
       /\ net' = net \cup Reply(waiters, v)
  /\ pending' = FALSE /\ waiters' = {}
  /\ UNCHANGED <<snap, upVer, fetchFrom, toServer, client>>

(* :18-27·:58-61 실패는 저장하지 않고 기다리던 요청에 501 *)
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

(* Open API 쪽 주차 대수가 새로 바뀜. 그림이 새 값을 가려 따라가도록 만차가 됨과 빈자리가 생김을 나눈다 *)
AdvanceFull ==
  /\ upVer < MaxVer
  /\ upVer' = upVer + 1
  /\ snap' = [snap EXCEPT ![upVer + 1] = 0]
  /\ UNCHANGED <<server, toServer, net, client>>

AdvanceOpen ==
  /\ upVer < MaxVer
  /\ upVer' = upVer + 1
  /\ snap' = [snap EXCEPT ![upVer + 1] = 1]
  /\ UNCHANGED <<server, toServer, net, client>>

Next ==
  \/ Start \/ Switch \/ Dismiss \/ OtherArrive \/ UpstreamOk \/ UpstreamFail \/ Expire \/ AdvanceFull \/ AdvanceOpen
  \/ \E k \in Loads : Arrive(k) \/ NetFail(k) \/ JsonFail(k) \/ JsonDone(k)
  \/ \E k \in Loads, v \in 0..MaxVer : Receive(k, v)   \* Receive가 <<k, v>> \in net을 본다

Spec == Init /\ [][Next]_vars

---------------------------------------------------------------------------
(* 약속 *)

(* 약속 1: 목록·상세의 빈자리 숫자는 이 브라우저가 받아 반영한 응답 가운데 가장 새것이다(뒤로 가지 않는다).
   구를 바꿔 버린 앞 응답은 다른 구 목록이라 반영 대상이 아니다. *)
ScreenLatest == lots = maxSeen

(* 약속 1을 배너로: 빈자리 배너의 숫자도 지금 목록과 같은 응답에서 나온다(PRD F10). *)
BannerLatest == banner \in {0, lots}

(* 약속 2: 만차에서 빈자리로 바뀐 한 번의 사건에 배너는 한 번만 뜬다(닫은 뒤 다시 뜨는 것도 두 번). *)
NotifyOnce == \A u \in Vers : notes[u] <= 1

TypeOK ==
  /\ lots \in 0..MaxVer /\ banner \in 0..MaxVer /\ maxSeen \in 0..MaxVer
  /\ status \in {"loading", "ready", "error"} /\ refreshing \in BOOLEAN
=============================================================================
