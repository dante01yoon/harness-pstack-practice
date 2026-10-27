// F1 그림의 말. 사용자가 휴대폰 화면에서 보는 것만 쓴다: 즐겨찾기 주차장 한 곳의 목록 숫자와 빈자리 배너.
// 모델은 빈자리를 0(만차)과 1면 이상 두 값으로만 본다. 그래서 숫자는 "n면"으로 쓴다.
// 배너가 목록과 다른 응답에서 나왔으면 배너의 기준 시각이 목록보다 앞선다(화면에 "HH:MM 기준"으로 보인다).

export const readerActions = ["Start", "Switch", "Dismiss"];

const full = (v, ver) => v.snap[ver] === 0;

export function state(v) {
	if (v.lots === 0) return v.status === "error" ? "주차장 정보를 불러오지 못했어요" : "불러오는 중…";
	const list = full(v, v.lots) ? "목록 만차" : "목록 빈자리 n면";
	let banner;
	if (v.banner === 0) banner = "배너 없음";
	else if (v.banner === v.lots) banner = v.bannerKept ? "배너도 새 숫자·기준 시각으로 바뀜" : "배너 빈자리 n면, 목록과 같은 기준 시각";
	else if (full(v, v.lots)) banner = "배너만 빈자리 n면, 옛 기준 시각";
	else banner = "배너 빈자리 n면, 목록보다 옛 기준 시각";
	return `${list} / ${banner}`;
}

export function group(v) {
	if (v.lots === 0) return "처음 불러오기";
	return v.banner === 0 ? "배너 없음" : "빈자리 배너 떠 있음";
}
export const groupColors = { "처음 불러오기": "#eeeeee", "배너 없음": "#dbeafe", "빈자리 배너 떠 있음": "#fef3c7" };

export function step(action, before, after) {
	switch (action) {
		case "Start": return "새로고침 (30초마다 또는 버튼)";
		case "Switch": return "구 칩을 누름";
		case "Dismiss": return "배너의 닫기를 누름";
		case "JsonDone":
			// 마지막에 시작한 불러오기가 아니면 응답을 버린다(index.html:384)
			if (Object.keys(after.phase).some((k) => before.phase[k] === "json" && after.phase[k] === "done" && Number(k) !== before.latest)) return "늦게 온 앞 응답은 버림";
			return full(after, after.lots) ? "새 숫자 도착: 만차" : "새 숫자 도착: 빈자리";
		case "Receive": return after.got[Object.keys(after.got).find((k) => after.got[k] !== before.got[k])] ? "응답을 받아 읽는 중" : "새 숫자를 받지 못함";
		case "NetFail":
		case "JsonFail": return "새 숫자를 받지 못함";
		case "Arrive": return "서버가 요청을 받음";
		case "OtherArrive": return "다른 사람이 서버에 요청";
		case "UpstreamOk": return "서버가 Open API 숫자를 받아 둠";
		case "UpstreamFail": return "Open API가 응답하지 않음";
		case "Expire": return "서버에 받아 둔 숫자가 30초 지남";
		case "AdvanceFull": return "Open API에서 주차장이 만차가 됨";
		case "AdvanceOpen": return "Open API에서 주차장에 빈자리가 생김";
		default: return action;
	}
}

export function cause(v, facts, invariant) {
	if (invariant !== "BannerLatest") return null;
	return full(v, v.lots)
		? "목록은 새 응답에서 만차로 바뀌었는데, 배너는 띄울 때의 빈자리 숫자에 남았다"
		: "목록은 새 응답의 빈자리 숫자로 바뀌었는데, 배너는 띄울 때의 숫자와 기준 시각에 남았다";
}

export const legend = { works: "고치기 전과 같음", wrong: "고친 뒤에도 잘못", fixed: "고친 뒤 사라진 잘못·고친 뒤 새 화면" };
