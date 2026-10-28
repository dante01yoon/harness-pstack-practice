#!/usr/bin/env node
// 앱(index.html)과 /api/parkings를 내보내는 작은 서버. 인증키는 여기서만 읽고 서울 열린데이터광장 요청 경로에만 넣는다.
// /api/parkings는 data/parkings.json과 같은 모양({ source, license, fetchedAt, rows })이다.
//
//   node server.mjs    → http://localhost:8000 (PORT, SEOUL_OPENAPI_BASE로 바꿀 수 있음)
import http from "node:http";
import { readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const SOURCE = "서울 열린데이터광장 GetParkingInfo(OA-21709) + GetParkInfo(OA-13122) LAT·LOT, PKLT_CD로 결합";
const LICENSE = "공공누리 제1유형(출처표시)";
const PAGE = 1000;
const LIVE_MS = 60 * 1000;
const COORD_MS = 12 * 60 * 60 * 1000;
const INDEX = new URL("index.html", import.meta.url);

// 이 오류의 메시지만 로그에 남긴다. 요청 URL·upstream 메시지는 넣지 않는다(URL에 인증키가 있다).
class Upstream extends Error {}
const bad = (why) => { throw new Upstream(why); };

async function fetchAll(base, key, svc) {
  const rows = [];
  for (let start = 1, total = 1; start <= total; start += PAGE) {
    let res;
    try {
      res = await fetch(`${base}/${key}/json/${svc}/${start}/${start + PAGE - 1}/`, { signal: AbortSignal.timeout(10000) });
    } catch {
      bad(`${svc} 연결 실패`);
    }
    if (!res.ok) bad(`${svc} HTTP ${res.status}`);
    const j = await res.json().catch(() => bad(`${svc} JSON 아님`));
    const body = j?.[svc];
    if (body?.RESULT?.CODE !== "INFO-000" || !Array.isArray(body.row)) bad(`${svc} ${body?.RESULT?.CODE ?? j?.RESULT?.CODE ?? "형식 다름"}`);
    total = Number(body.list_total_count);
    if (!Number.isFinite(total)) bad(`${svc} list_total_count 없음`);
    rows.push(...body.row);
  }
  return rows;
}

// 응답 행 하나라도 필드가 없거나 숫자가 아니면 전체를 실패로 본다. 값을 채워 넣지 않는다.
function field(p, k) {
  if (p?.[k] == null) bad(`${k} 없음`);
  return String(p[k]);
}
function num(p, k) {
  const s = field(p, k), n = Number(s);
  if (s.trim() === "" || !Number.isFinite(n)) bad(`${k} 숫자 아님`);
  return n;
}

// 좌표(lat·lng)는 따로 붙인다.
function toRow(p) {
  const addr = field(p, "ADDR"), live = num(p, "PRK_STTS_YN") === 1, total = num(p, "TPKCT"), parked = num(p, "NOW_PRK_VHCL_CNT");
  return {
    code: field(p, "PKLT_CD"), name: field(p, "PKLT_NM"), gu: addr.trim().split(/\s+/)[0], addr, tel: field(p, "TELNO"),
    live, total, parked, vacant: Math.max(0, total - parked),
    // 실시간 연계가 없으면 기준 시각이 없다(스냅샷과 같게 null).
    updatedAt: live ? field(p, "NOW_PRK_VHCL_UPDT_TM") : null,
    paid: field(p, "PAY_YN") === "Y",
    basicFee: num(p, "BSC_PRK_CRG"), basicMin: num(p, "BSC_PRK_HR"), addFee: num(p, "ADD_PRK_CRG"), addMin: num(p, "ADD_PRK_HR"), dayMax: num(p, "DAY_MAX_CRG"),
    weekday: [field(p, "WD_OPER_BGNG_TM"), field(p, "WD_OPER_END_TM")],
    sat: [field(p, "WE_OPER_BGNG_TM"), field(p, "WE_OPER_END_TM")],
    holiday: [field(p, "LHLDY_OPER_BGNG_TM"), field(p, "LHLDY_OPER_END_TM")],
  };
}

// 같은 PKLT_CD의 첫 행 중 LAT·LOT가 둘 다 0보다 큰 것만 쓴다.
function toCoords(rows) {
  const m = new Map();
  for (const p of rows) {
    const code = field(p, "PKLT_CD"), lat = Number(p.LAT), lng = Number(p.LOT);
    if (!m.has(code) && lat > 0 && lng > 0) m.set(code, { lat, lng });
  }
  return m;
}

const kst = (ms) => new Date(ms + 9 * 3600e3).toISOString().slice(0, 16) + "+09:00";

// 받는 중인 요청은 함께 기다리고, 성공한 값만 ms 동안 다시 쓴다.
function cached(ms, load) {
  let value, at = 0, pending = null;
  return () => {
    if (pending) return pending;
    if (value && Date.now() - at < ms) return Promise.resolve(value);
    pending = load().then((v) => { value = v; at = Date.now(); return v; }).finally(() => { pending = null; });
    return pending;
  };
}

export function createServer({ key, base = "http://openapi.seoul.go.kr:8088", log = console.error }) {
  const live = cached(LIVE_MS, async () => {
    const fetchedAt = kst(Date.now());
    return { fetchedAt, rows: (await fetchAll(base, key, "GetParkingInfo")).map(toRow) };
  });
  const coords = cached(COORD_MS, async () => toCoords(await fetchAll(base, key, "GetParkInfo")));
  const send = (res, status, type, body) => res.writeHead(status, { "content-type": type, "cache-control": "no-store" }).end(body);

  return http.createServer(async (req, res) => {
    const p = req.url.split("?")[0];
    if (req.method === "GET" && (p === "/" || p === "/index.html")) return send(res, 200, "text/html; charset=utf-8", await readFile(INDEX));
    if (req.method !== "GET" || p !== "/api/parkings") return send(res, 404, "text/plain; charset=utf-8", "");
    try {
      const [rt, at] = await Promise.all([live(), coords()]);
      const rows = rt.rows.map((r) => ({ ...r, ...(at.get(r.code) ?? { lat: null, lng: null }) }));
      send(res, 200, "application/json; charset=utf-8", JSON.stringify({ source: SOURCE, license: LICENSE, fetchedAt: rt.fetchedAt, rows }));
    } catch (e) {
      log(`주차장 정보 받기 실패: ${e instanceof Upstream ? e.message : e?.name ?? "알 수 없음"}`);
      send(res, 502, "application/json; charset=utf-8", JSON.stringify({ error: "upstream" }));
    }
  });
}

function readKey() {
  if (process.env.SEOUL_OPENAPI_KEY) return process.env.SEOUL_OPENAPI_KEY.trim();
  try {
    return readFileSync(new URL(".env", import.meta.url), "utf8").match(/^SEOUL_OPENAPI_KEY=\s*["']?([^"'\s]+)/m)?.[1];
  } catch {
    return undefined;
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const key = readKey();
  if (!key) {
    console.error("SEOUL_OPENAPI_KEY가 없습니다. 환경 변수로 주거나 server.mjs 옆 .env에 SEOUL_OPENAPI_KEY=... 줄을 넣으세요.");
    process.exit(1);
  }
  const port = Number(process.env.PORT) || 8000;
  createServer({ key, base: process.env.SEOUL_OPENAPI_BASE || undefined }).listen(port, () => console.log(`http://localhost:${port}`));
}
