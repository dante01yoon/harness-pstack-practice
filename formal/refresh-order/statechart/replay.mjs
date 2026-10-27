// 그림(README.md)의 버그 경로를 실제 index.html(고치기 전 bc64f30, 고친 뒤 8e63ca3)에서 한 걸음씩 재현한다.
// 응답 i는 실제 스냅샷의 앞 (10*i)개 행이다. 화면 목록 칸 수로 어느 응답이 그려졌는지 안다.
// 실행(저장소 루트): node formal/refresh-order/statechart/replay.mjs  (design-harness의 playwright-core, Chrome, unpkg 접속 필요)
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import fs from "node:fs";
const repo = new URL("../../..", import.meta.url).pathname;
const home = JSON.parse(fs.readFileSync((process.env.CLAUDE_CONFIG_DIR ?? process.env.HOME + "/.claude") + "/plugins/installed_plugins.json", "utf8")).plugins["design-harness@design-harness"][0].installPath;
const { chromium } = createRequire(home + "/package.json")("playwright-core");
const all = JSON.parse(fs.readFileSync(repo + "/data/parkings.json", "utf8"));
const body = (i) => JSON.stringify({ ...all, rows: all.rows.filter((r) => r.lat != null).slice(0, 10 * i) });
const browser = await chromium.launch({ channel: "chrome" }).catch(() => chromium.launch());

async function open(commit, webgl) {
  const html = execFileSync("git", ["-C", repo, "show", `${commit}:index.html`], { encoding: "utf8" });
  const page = await (await browser.newContext({ viewport: { width: 390, height: 844 }, locale: "ko-KR", reducedMotion: "reduce" })).newPage();
  if (!webgl) await page.addInitScript(() => { const g = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function (t, ...a) { return /webgl/.test(t) ? null : g.call(this, t, ...a); }; });
  const held = [];
  await page.route("http://app.test/index.html", (r) => r.fulfill({ contentType: "text/html", body: html }));
  await page.route("http://app.test/api/parkings", (r) => held.push(r));
  await page.goto("http://app.test/index.html");
  const req = async (n) => { while (held.length < n) await page.waitForTimeout(50); return held[n - 1]; };
  const settle = () => page.waitForTimeout(400);
  const see = async () => page.evaluate(() => {
    const vis = (el) => { if (!el) return false; const b = el.getBoundingClientRect(); return b.width > 0 && document.elementFromPoint(b.x + b.width / 2, b.y + b.height / 2) === el; };
    return {
      veil: !document.getElementById("veil").classList.contains("gone"),
      view: document.getElementById("list").hidden ? "map" : "list",
      items: document.querySelectorAll("#listBody .item").length,
      retry: [document.getElementById("retry"), document.getElementById("retry2")].some(vis),
      started: typeof started !== "undefined" && started,
      map: typeof map !== "undefined" && !!map,
    };
  });
  return {
    page, see, settle,
    ok: async (n) => { await (await req(n)).fulfill({ contentType: "application/json", body: body(n) }); await settle(); },
    fail: async (n) => { await (await req(n)).fulfill({ status: 503, body: "" }); await settle(); },
    tapRefresh: async () => { const s = await see(); await page.click(s.view === "list" ? "#refresh2" : "#refresh"); await settle(); },
  };
}
const log = async (a, what) => console.log("  " + what.padEnd(34), JSON.stringify(await a.see()));

for (const commit of ["bc64f30", "8e63ca3"]) {
  console.log(`\n##### ${commit}`);
  console.log("RetryWhenEmpty 경로 (3D 안 되는 기기)");
  let a = await open(commit, false);
  await log(a, "0 불러오는 중");
  await a.fail(1); await log(a, "1 불러오지 못함");

  console.log("MapWhenCan 경로 (3D 되는 기기)");
  a = await open(commit, true);
  await a.fail(1); await log(a, "1 불러오지 못함");
  await a.tapRefresh(); await log(a, "2 새로고침을 누름");
  await a.ok(2); await a.page.waitForTimeout(3000); await log(a, "3 숫자가 옴(#2)");

  console.log("LatestWins 경로 (3D 안 되는 기기)");
  a = await open(commit, false);
  await a.ok(1); await log(a, "1 주차장 정보가 옴(#1, 10칸)");
  await a.tapRefresh(); await log(a, "2 새로고침(#2)");
  await a.tapRefresh(); await log(a, "3 새로고침(#3)");
  await a.ok(3); await log(a, "4 #3 도착(30칸)");
  await a.ok(2); await log(a, "5 늦은 #2 도착(20칸이면 되돌아감)");
}
await browser.close();
