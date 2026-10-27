// server.mjs가 서울 열린데이터광장 응답을 스냅샷과 같은 모양으로 내고, 인증키를 밖에 내보내지 않는지 확인한다.
// 가짜 upstream에 스냅샷 행을 원래 응답 필드로 되돌려 넣고, 결과가 스냅샷 행 그대로인지 본다.
// 실행: node --test tests/*.test.mjs
import { test, after } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { readFileSync } from "node:fs";
import { createServer } from "../server.mjs";

const root = new URL("../", import.meta.url);
const snap = JSON.parse(readFileSync(new URL("data/parkings.json", root), "utf8"));
const KEY = "TESTKEY0123456789abcdefXYZ";

const LIVE = snap.rows.find((r) => r.live && r.lat != null && r.tel);
const NO_RT = snap.rows.find((r) => !r.live && r.lat != null);
const NO_LOC = snap.rows.find((r) => r.lat == null);
const EXPECTED = [LIVE, NO_RT, NO_LOC];

const s = (v) => String(v);
const info = (r) => ({
  PKLT_CD: r.code, PKLT_NM: r.name, ADDR: r.addr, TELNO: r.tel,
  PRK_STTS_YN: r.live ? "1" : "0", TPKCT: s(r.total), NOW_PRK_VHCL_CNT: s(r.parked),
  NOW_PRK_VHCL_UPDT_TM: r.updatedAt ?? "2026-10-01 09:00:00", PAY_YN: r.paid ? "Y" : "N",
  BSC_PRK_CRG: s(r.basicFee), BSC_PRK_HR: s(r.basicMin), ADD_PRK_CRG: s(r.addFee), ADD_PRK_HR: s(r.addMin), DAY_MAX_CRG: s(r.dayMax),
  WD_OPER_BGNG_TM: r.weekday[0], WD_OPER_END_TM: r.weekday[1], WE_OPER_BGNG_TM: r.sat[0], WE_OPER_END_TM: r.sat[1],
  LHLDY_OPER_BGNG_TM: r.holiday[0], LHLDY_OPER_END_TM: r.holiday[1],
});
const pad = Array.from({ length: 1100 }, (_, i) => ({ PKLT_CD: `9${i}`, LAT: "37.5", LOT: "127.0" }));
// 좌표 행은 둘째 쪽(1001번째 이후)에 둬서 쪽 나눠 받기를 해야만 결합된다. NO_LOC은 0 좌표만 있다.
const coords = [...pad, { PKLT_CD: NO_LOC.code, LAT: "0", LOT: "0" },
  ...[LIVE, NO_RT].map((r) => ({ PKLT_CD: r.code, LAT: s(r.lat), LOT: s(r.lng) }))];

let mode = "ok";
let seen = [];
const ok = (svc, rows, start, end) => ({ [svc]: { list_total_count: rows.length, RESULT: { CODE: "INFO-000", MESSAGE: "정상 처리되었습니다" }, row: rows.slice(start - 1, end) } });
const upstream = http.createServer((req, res) => {
  seen.push(req.url);
  const [, key, , svc, start, end] = req.url.split("/");
  let body;
  if (mode === "error") body = { RESULT: { CODE: "INFO-100", MESSAGE: `인증키가 유효하지 않습니다 ${req.url} ${key}` } };
  else if (svc === "GetParkingInfo") {
    const rows = EXPECTED.map(info);
    if (mode === "missing") delete rows[1].PKLT_NM;
    body = ok(svc, rows, +start, +end);
  } else body = ok(svc, coords, +start, +end);
  res.writeHead(200, { "content-type": "application/json" }).end(JSON.stringify(body));
});
await new Promise((r) => upstream.listen(0, "127.0.0.1", r));
const base = `http://127.0.0.1:${upstream.address().port}`;

const apps = [];
let logs = [];
async function app() {
  const srv = createServer({ key: KEY, base, log: (m) => logs.push(m) });
  apps.push(srv);
  await new Promise((r) => srv.listen(0, "127.0.0.1", r));
  return (p) => fetch(`http://127.0.0.1:${srv.address().port}${p}`);
}
const reset = (m) => { mode = m; seen = []; logs = []; };
after(() => { apps.forEach((a) => a.close()); upstream.close(); });

async function noKey(res) {
  const text = await res.text();
  assert.ok(!text.includes(KEY), "응답 본문에 인증키");
  for (const [k, v] of res.headers) assert.ok(!v.includes(KEY) && !k.includes(KEY), `응답 헤더 ${k}에 인증키`);
  return text;
}

test("/api/parkings 행이 스냅샷 행과 같다(실시간·실시간 없음·좌표 없음)", async () => {
  reset("ok");
  const get = await app();
  const res = await get("/api/parkings");
  assert.equal(res.status, 200);
  assert.match(res.headers.get("cache-control"), /no-store/);
  const j = JSON.parse(await noKey(res));
  assert.deepEqual(Object.keys(j), ["source", "license", "fetchedAt", "rows"]);
  assert.equal(j.source, snap.source);
  assert.equal(j.license, snap.license);
  assert.match(j.fetchedAt, /^\d{4}-\d\d-\d\dT\d\d:\d\d\+09:00$/);
  assert.deepEqual(j.rows, EXPECTED);
});

test("인증키는 upstream 요청 경로로만 가고, 좌표는 쪽을 나눠 모두 받는다", async () => {
  reset("ok");
  const get = await app();
  await (await get("/api/parkings")).text();
  assert.ok(seen.length > 0 && seen.every((u) => u.startsWith(`/${KEY}/json/`)), seen.join(" "));
  assert.ok(seen.filter((u) => u.includes("/GetParkInfo/")).length >= 2, "GetParkInfo를 한 쪽만 받음");
  assert.ok(logs.every((m) => !m.includes(KEY)));
});

test("동시 요청은 upstream을 한 번만 부르고, 받은 값은 잠시 다시 쓴다", async () => {
  reset("ok");
  const get = await app();
  await Promise.all([get("/api/parkings"), get("/api/parkings")].map(async (p) => (await p).text()));
  await (await get("/api/parkings")).text();
  assert.equal(seen.filter((u) => u.includes("/GetParkingInfo/")).length, 1);
  assert.ok(seen.filter((u) => u.includes("/GetParkInfo/")).length <= 2);
});

test("upstream 오류는 502이고 upstream 메시지와 인증키를 내보내지 않으며, 실패는 저장하지 않는다", async () => {
  reset("error");
  const get = await app();
  const res = await get("/api/parkings");
  assert.equal(res.status, 502);
  const text = await noKey(res);
  assert.deepEqual(JSON.parse(text), { error: "upstream" });
  assert.ok(!text.includes("INFO-100") && !text.includes("유효하지"));
  assert.ok(logs.length > 0 && logs.every((m) => !m.includes(KEY) && !m.includes("http")), logs.join(" "));
  mode = "ok";
  assert.equal((await get("/api/parkings")).status, 200);
});

test("필수 필드가 빠진 행이 있으면 지어내지 않고 502다", async () => {
  reset("missing");
  const get = await app();
  const res = await get("/api/parkings");
  assert.equal(res.status, 502);
  assert.deepEqual(JSON.parse(await noKey(res)), { error: "upstream" });
});

test("index.html만 내보내고 .env·서버 코드·데이터 파일은 404다", async () => {
  reset("ok");
  const get = await app();
  const html = readFileSync(new URL("index.html", root), "utf8");
  for (const p of ["/", "/index.html"]) {
    const res = await get(p);
    assert.equal(res.status, 200, p);
    assert.equal(await res.text(), html, p);
  }
  for (const p of ["/.env", "/server.mjs", "/data/parkings.json", "/%2e%2e/etc/passwd", "/tests/server.test.mjs"]) {
    const res = await get(p);
    assert.equal(res.status, 404, p);
    await noKey(res);
  }
});
