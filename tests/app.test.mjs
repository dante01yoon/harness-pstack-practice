// index.html 스크립트의 계산 도우미를 브라우저 없이 확인한다.
// 실행: node --test tests/*.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const script = html.match(/<script>\n([\s\S]*?)<\/script>/)[1];
// 지도·DOM에 닿기 전(도우미·높이 계산)까지만 떼어 실행한다.
const head = script.slice(0, script.indexOf("// ---- 지오메트리 ----"));

function load(now = Date.parse("2026-10-28T00:10:00+09:00")) {
  const ctx = { matchMedia: () => ({ matches: false }), Date: class extends Date { static now() { return now; } }, Math };
  vm.createContext(ctx);
  vm.runInContext(head + "\n;globalThis.__ = { T, S, esc, kst, isStale, band, addr, hours, oldest, columnPx };", ctx);
  return ctx.__;
}

const lot = (o) => ({ live: true, total: 100, parked: 50, vacant: 50, updatedAt: "2026-10-28 00:00:00", ...o });

test("오래됨은 기준 시각에서 20분을 넘을 때만", () => {
  const at = (min) => load(Date.parse("2026-10-28T00:00:00+09:00") + min * 60000);
  assert.equal(at(20).T.staleAfterMin, 20);
  assert.equal(at(20).isStale(lot()), false);
  assert.equal(at(21).isStale(lot()), true);
  // 기준 시각은 한국 시간으로 읽는다
  assert.equal(at(0).kst("2026-10-28 00:00:00").toISOString(), "2026-10-27T15:00:00.000Z");
  // 실시간 연계가 없으면 오래됨 판단 대상이 아니다
  assert.equal(at(60).isStale(lot({ live: false })), false);
});

test("빈자리 구간: 실시간 없음·만차·비율", () => {
  const { band } = load();
  assert.equal(band(lot({ live: false })), "no-realtime");
  assert.equal(band(lot({ vacant: 0 })), "full");
  assert.equal(band(lot({ vacant: 50 })), "plenty");
  assert.equal(band(lot({ vacant: 20 })), "some");
  assert.equal(band(lot({ vacant: 19 })), "few");
});

test("기둥 높이: 0은 바닥, 1대 이상은 최소 높이부터 제곱근 비례", () => {
  const { T, S, columnPx } = load();
  S.maxVac = 400;
  assert.equal(columnPx(lot({ vacant: 0 })), 0);
  assert.equal(columnPx(lot({ vacant: 400 })), T.maxPx);
  assert.equal(columnPx(lot({ vacant: 100 })), T.minPx + (T.maxPx - T.minPx) * 0.5);
  assert.ok(columnPx(lot({ vacant: 1 })) > T.minPx);
  assert.equal(columnPx(lot({ live: false })), T.minPx);
});

test("표기 형식: 운영시간·주소·가장 오래된 기준 시각", () => {
  const { hours, addr, oldest } = load();
  assert.equal(hours(["0000", "2400"]), "24시간");
  assert.equal(hours(["0000", "0000"]), "시간 정보 없음");
  assert.equal(hours(["0900", "1830"]), "09:00–18:30");
  assert.equal(addr("중구 을지로6가 17-442 0"), "중구 을지로6가 17-442");
  assert.equal(addr("종로구 세종로 80-1"), "종로구 세종로 80-1");
  const rows = [lot({ updatedAt: "2026-10-28 00:01:36" }), lot({ updatedAt: "2026-10-28 00:01:23" }), lot({ live: false, updatedAt: "2026-10-27 09:00:00" })];
  assert.equal(oldest(rows), "2026-10-28 00:01:23");
});

test("esc는 innerHTML에 넣을 데이터 문자열을 무력화한다", () => {
  const { esc } = load();
  assert.equal(esc(`<img src=x onerror="a()">&`), "&lt;img src=x onerror=&quot;a()&quot;&gt;&amp;");
  assert.equal(esc(null), "");
});

test("화면 문구에 금지어가 없다", () => {
  const copy = JSON.parse(readFileSync(new URL("../work/seoul-parking/copy.json", import.meta.url), "utf8"));
  // 코드에도 흔한 "!"·"Error"는 빼고, 한글 금지어만 본문 전체에서 찾는다
  for (const w of copy.banned.filter((w) => /[가-힣]/.test(w))) assert.ok(!html.includes(w), `금지어 "${w}"`);
});

test("하단 출처 표기가 지도·목록 두 화면에 다 있다", () => {
  const attrib = '<div class="attrib">서울 열린데이터광장 · © OpenFreeMap © OpenMapTiles © OpenStreetMap contributors</div>';
  assert.equal(html.split(attrib).length - 1, 2);
});
