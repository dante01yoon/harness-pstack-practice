#!/usr/bin/env bash
# F1(빈자리 배너가 옛 숫자에 남음) 그림을 다시 만든다. 쓰는 법: verify/refresh-order/f1-chart/make.sh
# 필요한 것: pstack statechart 스킬(STATECHART에 statechart.mjs 경로), TLA+ tools 1.7.4, Java 11 이상.
# before/는 고치기 전(RefreshBanner = FALSE), fixed/는 고친 뒤(TRUE). 두 .tla는 같은 파일이다.
set -eu
here="$(cd "$(dirname "$0")" && pwd)"
cd "$here"
sc="${STATECHART:-$(ls -d "$HOME"/.claude/plugins/cache/*/pstack/*/skills/statechart/scripts/statechart.mjs 2>/dev/null | sort -V | tail -1)}"
export TLA2TOOLS="${TLA2TOOLS:-$HOME/.cache/tlaplus/tla2tools-1.7.4.jar}"
cmp -s before/RefreshOrder.tla fixed/RefreshOrder.tla || { echo "before/와 fixed/의 RefreshOrder.tla가 달라요"; exit 1; }
out="${TMPDIR:-/tmp}/seoul-parking-f1-chart"
node "$sc" from-spec before/RefreshOrder.tla --fixed fixed/RefreshOrder.tla --label "고친 뒤" \
  --title "F1 빈자리 배너" --expect-broken BannerLatest --png --out "$out"
mkdir -p chart
cp "$out"/{chart,bug-1,bug-2}.{mmd,png} "$out"/stories.md "$out"/summary.json chart/
echo "TLC 출력: $out/tlc"
