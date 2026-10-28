#!/usr/bin/env node
// 앱(index.html)을 화면 상태별로 띄워 design-harness lint:web으로 검사한다.
// lint:web은 페이지를 연 직후 한 화면만 보므로(file://이면 불러오기 실패, http면 "불러오는 중"),
// 여기서 상태마다 화면을 만든 뒤 스크립트를 뺀 스냅숏으로 저장해 lint:web에 넘긴다. 검사 규칙은 플러그인 것 그대로다.
//
//   node scripts/lint-web.mjs          상태별 검사 (로컬, Chrome과 design-harness 플러그인 필요)
//   node scripts/lint-web.mjs --hook   Stop 훅: 지난 통과 뒤 화면·토큰·문구가 안 바뀌었으면 건너뛴다
import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import http from "node:http";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const hook = process.argv.includes("--hook");
const cacheDir = path.join(root, ".claude", ".cache", "lint-web");
const okFile = path.join(root, ".claude", ".cache", "lint-web.ok");
// 이 파일들이 바뀌면 다시 검사한다.
const INPUTS = ["index.html", "data/parkings.json", "work/seoul-parking/tokens.json", "work/seoul-parking/copy.json", "work/seoul-parking/ia.json", "scripts/lint-web.mjs"];

// 훅에서는 사람이 고칠 수 없는 환경 문제(플러그인·브라우저·외부 리소스 없음)로 답을 막지 않는다.
function skip(msg) {
  console.error(`lint:web 건너뜀 — ${msg}`);
  process.exit(hook ? 0 : 1);
}
function fail(msg) {
  console.error(msg);
  if (hook) {
    console.error("화면 검사 실패 — 위 ERROR를 고치거나(토큰·copy.json에 맞추기), 산출물을 바꿔야 하면 그렇게 보고하세요");
    process.exit(2);
  }
  process.exit(1);
}

let event = {};
if (hook) {
  try { event = JSON.parse(fs.readFileSync(0, "utf8") || "{}"); } catch {}
  // 이 훅 때문에 이미 이어서 답하는 중이면 다시 막지 않는다(무한 반복 방지).
  if (event.stop_hook_active) process.exit(0);
}

// 플러그인 위치: DESIGN_HARNESS_HOME → PATH의 design-harness가 알려 주는 경로 → 설치된 플러그인 목록.
function harnessHome() {
  if (process.env.DESIGN_HARNESS_HOME) return process.env.DESIGN_HARNESS_HOME;
  const r = spawnSync("design-harness", ["path", "export-nodes"], { encoding: "utf8" });
  if (r.status === 0) return path.resolve(r.stdout.trim(), "..", "..", "..");
  try {
    const dir = process.env.CLAUDE_CONFIG_DIR || path.join(process.env.HOME ?? "", ".claude");
    const list = JSON.parse(fs.readFileSync(path.join(dir, "plugins", "installed_plugins.json"), "utf8")).plugins["design-harness@design-harness"];
    return list.find((p) => p.projectPath === root)?.installPath ?? list[0]?.installPath ?? null;
  } catch {
    return null;
  }
}
const home = harnessHome();

// 플러그인 검사 규칙(lint:web·lib)이 바뀌어도 다시 검사한다.
const RULES = home ? ["scripts/lint-web.mjs", "scripts/lib.mjs"].map((f) => path.join(home, f)) : [];
const hash = crypto.createHash("sha256");
for (const f of [...INPUTS.map((f) => path.join(root, f)), ...RULES]) hash.update(fs.existsSync(f) ? fs.readFileSync(f) : "");
const digest = hash.digest("hex");
if (hook && fs.existsSync(okFile) && fs.readFileSync(okFile, "utf8").trim() === digest) process.exit(0);

if (!home) skip("design-harness를 찾지 못했습니다 (플러그인을 켜거나 DESIGN_HARNESS_HOME 지정)");
let chromium;
try {
  ({ chromium } = createRequire(path.join(home, "package.json"))("playwright-core"));
} catch {
  skip("playwright-core가 없습니다 (design-harness setup)");
}

// 저장소 루트를 내보내는 정적 서버. fetch("api/parkings")가 file://에서는 막히므로 필요하다.
// /api/parkings에는 server.mjs 대신 data/parkings.json(같은 모양의 실제 응답 스냅샷)을 준다. 인증키·네트워크 없이 같은 화면이 나온다.
const TYPES = { ".html": "text/html; charset=utf-8", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png" };
const server = http.createServer((req, res) => {
  const u = new URL(req.url, "http://x").pathname;
  const p = path.join(root, u === "/api/parkings" ? "data/parkings.json" : decodeURIComponent(u));
  if (!p.startsWith(root + path.sep) || !fs.existsSync(p) || !fs.statSync(p).isFile()) return res.writeHead(404).end();
  res.writeHead(200, { "content-type": TYPES[path.extname(p)] ?? "application/octet-stream" }).end(fs.readFileSync(p));
});
await new Promise((ok) => server.listen(0, "127.0.0.1", ok));
const url = `http://127.0.0.1:${server.address().port}/index.html`;

const ia = JSON.parse(fs.readFileSync(path.join(root, "work/seoul-parking/ia.json"), "utf8"));
const rows = JSON.parse(fs.readFileSync(path.join(root, "data/parkings.json"), "utf8")).rows;
const pick = (f) => rows.find(f)?.code;
const LIVE = pick((r) => r.live && r.lat != null && r.tel);
const NO_RT = pick((r) => !r.live && r.lat != null);
const NO_LOC = pick((r) => r.lat == null);

// 스크립트를 빼고 지금 DOM을 그대로 굳힌다. 입력값은 속성으로 옮긴다.
function freeze() {
  const doc = document.documentElement.cloneNode(true);
  doc.querySelectorAll("script").forEach((s) => s.remove());
  const live = document.querySelectorAll("input"), copy = doc.querySelectorAll("input");
  live.forEach((el, i) => copy[i].setAttribute("value", el.value));
  return "<!doctype html>\n" + doc.outerHTML;
}

const shots = [];
const browser = await chromium.launch({ channel: "chrome" }).catch(() => chromium.launch()).catch((e) => skip(`브라우저를 띄우지 못했습니다: ${e.message.split("\n")[0]}`));
async function scenario(name, setup, steps) {
  // name은 실패 메시지에 쓰도록 지금 만드는 상태 이름으로 바뀐다.
  const ctx = await browser.newContext({ viewport: ia.viewport, locale: "ko-KR", reducedMotion: "reduce" });
  const page = await ctx.newPage();
  page.setDefaultTimeout(30000);
  try {
    await setup?.(page);
    await page.goto(url, { waitUntil: "load" });
    for (const [state, run] of steps) {
      name = state;
      await run(page);
      await page.waitForTimeout(150);
      const file = path.join(cacheDir, `${state}.html`);
      fs.writeFileSync(file, await page.evaluate(freeze));
      shots.push(file);
    }
  } catch (e) {
    const env = await page.evaluate(() => typeof maplibregl === "undefined").catch(() => true);
    if (env) { await browser.close(); server.close(); skip(`${name}: 지도 라이브러리·타일을 받지 못했습니다 (네트워크 확인)`); }
    throw new Error(`${name}: 상태를 만들지 못했습니다 — ${e.message.split("\n")[0]}`);
  } finally {
    await ctx.close();
  }
}
const shown = (sel) => (page) => page.waitForSelector(sel, { state: "visible" });

fs.rmSync(cacheDir, { recursive: true, force: true });
fs.mkdirSync(cacheDir, { recursive: true });
try {
  await scenario("불러오는 중", (p) => p.route("**/api/parkings", () => {}), [["loading", shown("#veil")]]);
  await scenario("불러오기 실패", (p) => p.route("**/api/parkings", (r) => r.abort()), [["error", shown("#errorBanner")]]);
  await scenario("WebGL 없음", (p) => p.addInitScript(() => {
    const get = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (t, ...a) { return /webgl/.test(t) ? null : get.call(this, t, ...a); };
  }), [["no-webgl", shown("#listBody .item")]]);
  await scenario("지도·목록·검색·상세", null, [
    // 위치 권한이 없으므로 "위치를 쓸 수 없어…" 안내와 오래됨 표시가 함께 보인다.
    ["map", async (p) => { await shown("#labels .col-label")(p); await p.waitForTimeout(1200); }],
    ["list", async (p) => { await p.click("#tList"); await shown("#list")(p); }],
    ["search", async (p) => { await p.click("#openSearch2"); await p.fill("#q", "종로구"); await shown("#results > *")(p); }],
    ["search-empty", async (p) => { await p.fill("#q", "없는이름zz"); await shown("#results .state")(p); }],
    ["detail", async (p) => { await p.click("#closeSearch"); await p.evaluate((c) => openDetail(c), LIVE); await shown("#sheet.open")(p); }],
    ...(NO_RT ? [["detail-no-realtime", async (p) => { await p.evaluate((c) => openDetail(c), NO_RT); await shown("#sheet.open")(p); }]] : []),
    ...(NO_LOC ? [["detail-no-location", async (p) => { await p.evaluate((c) => openDetail(c), NO_LOC); await shown("#sheet.open")(p); }]] : []),
    // 좌표 없는 주차장은 화면 범위와 상관없이 목록 끝에 붙으므로, 그런 행이 있으면 목록이 비지 않는다.
    ...(NO_LOC ? [] : [["list-empty", async (p) => {
      await p.evaluate(() => { closeDetail(); setView("map"); map.jumpTo({ center: [126.2, 37.9], zoom: 14 }); setView("list"); });
      await shown("#listBody .state")(p);
    }]]),
  ]);
} catch (e) {
  await browser.close();
  server.close();
  fail(e.message);
}
await browser.close();
server.close();

// 검사 자체는 플러그인 lint:web. 인자로 파일을 주면 failures.jsonl에 적지 않는다.
const r = spawnSync(process.execPath, [path.join(home, "bin", "design-harness"), "lint:web", ...shots.map((f) => path.relative(root, f))], {
  cwd: root, encoding: "utf8", env: { ...process.env, DESIGN_HARNESS_ROOT: root },
});
const out = (r.stdout || "") + (r.stderr || "");
if (r.status !== 0) fail(`lint:web (상태 ${shots.length}개: ${shots.map((f) => path.basename(f, ".html")).join(", ")})\n${out}`);
fs.writeFileSync(okFile, digest + "\n");
if (!hook) process.stdout.write(`상태: ${shots.map((f) => path.basename(f, ".html")).join(", ")}\n${out}`);
