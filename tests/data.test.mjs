// data/parkings.json 스냅샷과 인증키 노출을 확인한다.
// 실행: node --test tests/*.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";

const root = new URL("../", import.meta.url);
const read = (p) => readFileSync(new URL(p, root), "utf8");
const snap = JSON.parse(read("data/parkings.json"));
const FIELDS = ["code", "name", "gu", "addr", "tel", "live", "total", "parked", "vacant", "updatedAt", "paid", "basicFee", "basicMin", "addFee", "addMin", "dayMax", "weekday", "sat", "holiday", "lat", "lng"];

test("최상위 키와 두 사본이 같다", () => {
  for (const k of ["source", "license", "fetchedAt", "rows"]) assert.ok(k in snap, k);
  assert.match(snap.fetchedAt, /\+09:00$/);
  assert.equal(read("data/parkings.json"), read("work/seoul-parking/data/parkings.json"));
});

test("행 필드 이름이 index.html이 읽는 그대로다", () => {
  for (const r of snap.rows) assert.deepEqual(Object.keys(r).sort(), FIELDS.slice().sort(), r.code);
});

test("빈자리 = max(0, 총면수 − 주차 대수)", () => {
  for (const r of snap.rows) assert.equal(r.vacant, Math.max(0, r.total - r.parked), r.code);
});

test("실시간 주차장은 기준 시각이 원문 형식이다", () => {
  for (const r of snap.rows.filter((r) => r.live)) assert.match(r.updatedAt, /^\d{4}-\d\d-\d\d \d\d:\d\d:\d\d$/, r.code);
});

test("좌표 없음은 null(0으로 채우지 않음), 좌표는 서울 안", () => {
  for (const r of snap.rows) {
    if (r.lat == null || r.lng == null) { assert.equal(r.lat, null, r.code); assert.equal(r.lng, null, r.code); continue; }
    assert.ok(r.lat > 37.4 && r.lat < 37.72 && r.lng > 126.75 && r.lng < 127.2, r.code);
  }
});

test("인증키가 커밋 대상 파일에 없다", () => {
  const files = execFileSync("git", ["ls-files", "-co", "--exclude-standard"], { cwd: root, encoding: "utf8" }).split("\n").filter(Boolean);
  assert.ok(!files.includes(".env"), ".env가 git에 잡힘");
  const key = existsSync(new URL(".env", root)) ? (read(".env").match(/^SEOUL_OPENAPI_KEY=\s*["']?([^"'\s]+)/m) || [])[1] : null;
  for (const f of files) {
    const s = readFileSync(new URL(f, root)).toString("latin1");
    if (key) assert.ok(!s.includes(key), `${f}에 인증키`);
    assert.ok(!/openapi\.seoul\.go\.kr:8088\/[0-9a-zA-Z]{20,}/.test(s), `${f}에 인증키가 든 요청 URL`);
  }
});
