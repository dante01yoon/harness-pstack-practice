// 새로고침 순서 모델(RefreshOrder.tla)을 TLC로 검사한다.
// 실행(저장소 루트): node formal/refresh-order/check.mjs
//
// 1. index.html에서 모델이 근거로 삼는 코드 조각의 해시를 coverage.json과 비교한다(어긋나면 모델을 다시 볼 차례).
// 2. 약속마다 TLC를 따로 돌린다(한 약속의 반례가 다른 약속을 가리지 않게).
// 3. 반례는 코드 말로 풀어 쓰고, known-findings.json에 적힌 알려진 발견과 같은지 알린다.
//
// 종료 코드: 0 = 모두 예상대로(통과 또는 알려진 발견만), 1 = 새 반례이거나 알려진 발견이 사라짐,
//            2 = TLC를 못 돌림, 3 = 결과는 예상대로지만 근거 코드가 바뀜(모델 재확인 필요)
import { readFileSync, writeFileSync, mkdtempSync, copyFileSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { tmpdir, homedir } from "node:os";
import path from "node:path";

const here = path.dirname(new URL(import.meta.url).pathname);
const root = path.resolve(here, "../..");
const JAR_VERSION = "1.7.4";
const JAR_SHA256 = "936a262061c914694dfd669a543be24573c45d5aa0ff20a8b96b23d01e050e88";
const JAR_URL = `https://github.com/tlaplus/tlaplus/releases/download/v${JAR_VERSION}/tla2tools.jar`;
const PROPERTIES = ["LatestWins", "NoWipe"];
const sha = (b) => createHash("sha256").update(b).digest("hex");

// ---- 근거 코드 조각 ----
// 모델의 각 걸음이 기대는 index.html 조각. 이름은 coverage.json의 키와 같다.
export function coveredSnippets(html) {
  const fn = (head) => {
    const i = html.indexOf(head);
    if (i < 0) return null;
    const j = html.indexOf("\n}\n", i);
    return html.slice(i, j + 2);
  };
  const line = (re) => (html.match(re) || [null])[0];
  return {
    "load()": fn("async function load() {"),
    "showError()": fn("function showError(on) {"),
    "refresh()": fn("async function refresh() {"),
    "start()": fn("async function start() {"),
    "refresh 버튼 연결": line(/^\$\("refresh"\)\.onclick.*$/m),
    ".loading-veil": line(/^\.loading-veil \{[^\n]*\n[^\n]*\}\n\.loading-veil\.gone[^\n]*$/m),
    "시작 호출": line(/^listSkeleton\(\);\nstart\(\);$/m),
  };
}

function checkCoverage() {
  const html = readFileSync(path.join(root, "index.html"), "utf8");
  const rec = JSON.parse(readFileSync(path.join(here, "coverage.json"), "utf8"));
  const now = coveredSnippets(html);
  const changed = [];
  for (const [k, v] of Object.entries(now)) {
    const h = v == null ? "(없음)" : sha(v).slice(0, 16);
    if (rec.snippets[k] !== h) changed.push(`${k}: 기록 ${rec.snippets[k]} → 지금 ${h}`);
  }
  return { changed, now };
}

// ---- TLC ----
function findJar() {
  const cands = [process.env.TLA2TOOLS_JAR, path.join(homedir(), ".cache/tla", `tla2tools-${JAR_VERSION}.jar`)].filter(Boolean);
  for (const c of cands) if (existsSync(c)) return c;
  const dest = cands[cands.length - 1];
  mkdirSync(path.dirname(dest), { recursive: true });
  console.log(`tla2tools ${JAR_VERSION}을 ${dest}에 받습니다`);
  const r = spawnSync("curl", ["-fsSL", "-o", dest, JAR_URL], { stdio: "inherit" });
  if (r.status !== 0) return null;
  if (sha(readFileSync(dest)) !== JAR_SHA256) { rmSync(dest); console.error("받은 jar의 sha256이 다릅니다"); return null; }
  return dest;
}

function parseStates(out) {
  const states = [];
  const re = /^State (\d+): <(\w+)[^>]*>\n([\s\S]*?)(?=\n\n|\nState \d+:|(?![\s\S]))/gm;
  const initRe = /^State 1: <Initial predicate>\n([\s\S]*?)(?=\n\n)/m;
  const vars = (block) => Object.fromEntries(block.split("\n").filter((l) => l.startsWith("/\\ ")).map((l) => { const m = l.slice(3).match(/^(\w+) = (.*)$/); return [m[1], m[2]]; }));
  const init = out.match(initRe);
  if (!init) return null;
  states.push({ action: "Init", v: vars(init[1]) });
  for (const m of out.matchAll(re)) if (m[2] !== "Initial") states.push({ action: m[2], v: vars(m[3]) });
  return states;
}

const ids = (s) => [...s.matchAll(/id \|-> (\d+)/g)].map((m) => +m[1]);
const num = (s) => (s === "0" ? "숫자 없음" : `요청 #${s}의 숫자`);

// 한 걸음을 코드 말로 쓴다. 서명(sig)은 알려진 발견과 비교하는 데 쓴다.
function describe(prev, cur) {
  const a = cur.action, v = cur.v;
  const gone = ids(prev.v.pending).find((i) => !ids(v.pending).includes(i));
  const added = ids(v.pending).find((i) => !ids(prev.v.pending).includes(i));
  const tail = `→ S.rows = ${num(v.rows)}, 화면 = ${num(v.screen)}`;
  switch (a) {
    case "YouTapRefresh": return { sig: `${a}#${added}`, text: `새로고침 버튼을 누름 → refresh()가 요청 #${added} 보냄` };
    case "YouTapRetry": return { sig: `${a}#${added}`, text: `"다시 시도"를 누름 → start()가 #veil을 덮고 요청 #${added} 보냄` };
    case "RefreshArrives": return { sig: `${a}#${gone}`, text: `refresh()의 요청 #${gone} 응답이 도착 ${tail}` };
    case "RefreshFails": return { sig: `${a}#${gone}`, text: `refresh()의 요청 #${gone} 실패 → toast만 ${tail}` };
    case "StartArrives": return { sig: `${a}#${gone}`, text: `start()의 요청 #${gone} 응답이 도착${added ? `, refresh()가 요청 #${added} 보냄` : ""} ${tail}` };
    case "StartFails": return { sig: `${a}#${gone}`, text: `start()의 요청 #${gone} 실패 → showError(true)${v.webgl === "TRUE" && v.started === "TRUE" ? "" : ", map 없음"} ${tail}` };
    case "Redraw": return { sig: a, text: `지도 이동·목록 전환으로 다시 그림 ${tail}` };
    default: return { sig: a, text: a };
  }
}

function runTLC(jar, prop, work) {
  const dir = path.join(work, prop);
  mkdirSync(dir);
  copyFileSync(path.join(here, "RefreshOrder.tla"), path.join(dir, "RefreshOrder.tla"));
  writeFileSync(path.join(dir, "RefreshOrder.cfg"), readFileSync(path.join(here, "RefreshOrder.cfg"), "utf8") + `\nINVARIANT ${prop}\n`);
  const r = spawnSync("java", ["-XX:+UseParallelGC", "-cp", jar, "tlc2.TLC", "-workers", "1", "-metadir", path.join(dir, "meta"), "RefreshOrder.tla"], { cwd: dir, encoding: "utf8", timeout: 300000 });
  const out = (r.stdout || "") + (r.stderr || "");
  const stats = (out.match(/^\d+ states generated, \d+ distinct states found.*$/m) || [""])[0];
  if (/Model checking completed. No error has been found/.test(out)) return { ok: true, stats };
  const viol = out.match(/Error: Invariant (\w+) is violated/);
  if (!viol) return { error: out.split("\n").slice(-30).join("\n") };
  const states = parseStates(out);
  const steps = states.slice(1).map((s, i) => describe(states[i], s));
  return { ok: false, invariant: viol[1], webgl: states[0].v.webgl, steps, stats };
}

function main() {
  const { changed } = checkCoverage();
  const jar = findJar();
  if (!jar) { console.error("tla2tools.jar를 찾지도 받지도 못했습니다. TLA2TOOLS_JAR로 경로를 주세요."); process.exit(2); }
  const known = JSON.parse(readFileSync(path.join(here, "known-findings.json"), "utf8"));
  const work = mkdtempSync(path.join(tmpdir(), "refresh-order-"));
  let unexpected = false;
  for (const prop of PROPERTIES) {
    const res = runTLC(jar, prop, work);
    if (res.error) { console.error(`\n[${prop}] TLC가 검사를 끝내지 못했습니다:\n${res.error}`); process.exit(2); }
    const k = known[prop];
    if (res.ok) {
      console.log(`\n[${prop}] 통과 (${res.stats})`);
      if (k) { unexpected = true; console.log(`  알려진 발견이 더는 나오지 않습니다. 코드가 고쳐졌다면 known-findings.json에서 ${prop}를 지우세요.`); }
      continue;
    }
    const sig = res.steps.map((s) => s.sig);
    const same = k && JSON.stringify(k.trace) === JSON.stringify(sig);
    console.log(`\n[${prop}] 깨짐 — ${same ? "알려진 발견" : "새 반례"} (${res.stats})`);
    console.log(`  기기: ${res.webgl === "TRUE" ? "WebGL 있음(지도)" : "WebGL 없음 또는 지도 전(목록)"}`);
    res.steps.forEach((s, i) => console.log(`  ${i + 1}. ${s.text}`));
    if (!same) { unexpected = true; console.log(`  서명: ${JSON.stringify(sig)}`); if (k) console.log(`  기록된 서명: ${JSON.stringify(k.trace)}`); }
  }
  rmSync(work, { recursive: true, force: true });
  if (changed.length) {
    console.log("\n근거 코드가 coverage.json 기록 뒤 바뀌었습니다. 모델이 아직 코드를 그대로 옮기는지 확인하세요:");
    changed.forEach((c) => console.log("  - " + c));
  }
  process.exit(unexpected ? 1 : changed.length ? 3 : 0);
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  if (process.argv[2] === "--print-coverage") {
    const { now } = checkCoverage();
    console.log(JSON.stringify(Object.fromEntries(Object.entries(now).map(([k, v]) => [k, v == null ? "(없음)" : sha(v).slice(0, 16)])), null, 2));
  } else main();
}
