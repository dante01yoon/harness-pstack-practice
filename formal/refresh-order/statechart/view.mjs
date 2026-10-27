// RefreshScreen.tla를 기획자가 읽는 그림으로 바꾸는 pstack /statechart 뷰. 상태·화살표 이름은 사용자가 화면에서 보는 말이다.
const late = (v) => v.applied.some((i) => i > v.rows) || (v.okIds.includes(v.sent) && v.rows !== v.sent);
const waiting = (v) => v.pending.some((r) => r.kind === "refresh");

export const title = process.env.CHART_TITLE ?? "새로고침을 눌렀을 때 화면";

export const state = (v) => {
  const device = v.webgl ? "3D 되는 기기" : "3D 안 되는 기기";
  if (v.veil) return [device, "불러오는 중"];
  const more = waiting(v) ? " · 새로 받는 중" : "";
  if (v.screen === 0)
    return [device, (v.retry ? "불러오지 못함 · [다시 시도] 보임" : "빈 목록 · [다시 시도] 없음") + more];
  const where = v.view === "map" ? "지도" : "목록";
  const what = late(v) ? "먼저 받은 옛 숫자로 되돌아감" : "숫자와 기준 시각";
  return [device, `${where} · ${what}${more}`];
};

export const group = (v) =>
  v.veil ? "불러오는 중" : v.screen === 0 ? "실패" : late(v) ? "틀린 숫자" : "숫자 보임";

export const colors = {
  "불러오는 중": "blue",
  "실패": "orange",
  "틀린 숫자": "pink",
  "숫자 보임": "teal",
};

export const step = (action, from, to) => {
  switch (action) {
    case "YouTapRefresh": return "새로고침을 누름";
    case "YouTapRetry": return "[다시 시도]를 누름";
    case "RefreshArrives":
      if (to.rows < from.rows) return "먼저 보낸 요청의 응답이 늦게 옴";
      if (to.rows === from.rows) return "먼저 보낸 요청의 응답이 늦게 옴 (버림)";
      return "새 숫자가 옴";
    case "RefreshFails": return "새로 받지 못함 (알림만 뜸)";
    case "StartArrives": return "주차장 정보가 옴";
    case "StartFails": return "불러오지 못함";
    case "Done": return null;
  }
  return action;
};
