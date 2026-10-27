#!/usr/bin/env bash
# 30초 새로고침·빈자리 알림 순서 검증. 쓰는 법: verify/refresh-order/run.sh  (더 넓게: DEEP=1 verify/refresh-order/run.sh)
# 성공(exit 0) = 코드 앵커 그대로 + 약속 세 개 통과 + 망가뜨린 변형은 잡힘.
set -u
here="$(cd "$(dirname "$0")" && pwd)"
cd "$here" || exit 1

jar="${TLA2TOOLS_JAR:-$HOME/.cache/tlaplus/tla2tools-1.7.4.jar}"
sha=936a262061c914694dfd669a543be24573c45d5aa0ff20a8b96b23d01e050e88
if [ ! -f "$jar" ] || [ "$(shasum -a 256 "$jar" | cut -d' ' -f1)" != "$sha" ]; then
  echo "TLA+ tools 1.7.4가 없거나 다른 파일이에요: $jar"
  echo "받기: mkdir -p ~/.cache/tlaplus && curl -L -o ~/.cache/tlaplus/tla2tools-1.7.4.jar https://github.com/tlaplus/tlaplus/releases/download/v1.7.4/tla2tools.jar"
  echo "(sha256 $sha, Java 11 이상)"
  exit 3
fi

work="${TMPDIR:-/tmp}/seoul-parking-tlc"
mkdir -p "$work"
# 기본은 load 4번까지(전체 20초쯤). DEEP=1이면 5번까지(1분 반쯤).
tlc() { # $1 = cfg 이름(확장자 없음). 출력은 $work/$1.out
  cfg="$1.cfg"
  if [ "${DEEP:-0}" = 1 ]; then sed 's/MaxLoads = 4/MaxLoads = 5/' "$cfg" > "$work/$1.cfg"; cfg="$work/$1.cfg"; fi
  java -XX:+UseParallelGC -cp "$jar" tlc2.TLC -workers auto -deadlock -cleanup \
    -metadir "$work/$1.states" -config "$cfg" RefreshOrder.tla > "$work/$1.out" 2>&1
}
violated() { grep -q "is violated" "$work/$1.out"; }
passed() { grep -q "No error has been found" "$work/$1.out"; }

status=0
node anchors.mjs || exit 2

echo "== 약속 1(목록·상세 숫자는 가장 새 응답)·약속 2(빈자리 알림 한 번)·약속 3(배너 숫자도 가장 새 응답) — RefreshOrder.cfg"
tlc RefreshOrder
if passed RefreshOrder; then grep -E "distinct states found|depth of the complete" "$work/RefreshOrder.out"; echo "통과"
else echo "실패: $work/RefreshOrder.out"; grep -E "Error|violated" "$work/RefreshOrder.out"; status=1; fi

echo "== 망가뜨린 변형은 지키던 약속을 깨야 한다"
echo "   mutant-screen·mutant-notify: 구를 바꿔 겹친 load의 늦은 앞 응답을 버리지 않음 / mutant-banner: 띄운 배너를 새 응답에 맞추지 않음"
for m in mutant-screen mutant-notify mutant-banner; do
  tlc "$m"
  if violated "$m"; then echo "$m: 잡힘 ($(grep -o 'Invariant [A-Za-z]* is violated' "$work/$m.out"))"
  else echo "$m: 못 잡음 — 검증이 틀렸어요. $work/$m.out"; status=1; fi
done

exit $status
