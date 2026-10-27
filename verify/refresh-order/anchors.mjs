// RefreshOrder.tla가 기대는 코드 줄이 그대로 있는지 본다. 하나라도 없으면 모델이 코드와 어긋났을 수 있다.
// 줄이 바뀌었으면 모델의 해당 동작을 다시 읽고, 맞으면 이 목록과 SKILL.md의 동기화 커밋을 함께 고친다.
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../..', import.meta.url));
const read = (f) => fs.readFileSync(`${root}${f}`, 'utf8');

// [파일, 그대로 있어야 할 코드, 모델에서 기대는 곳]
const anchors = [
  ['index.html', "if (hadData) { state.refreshing = true; render(); } else { state.status = 'loading'; render(); }", 'Start'],
  ['index.html', "const res = await fetch(dataUrl(district), { cache: 'no-store' });", 'Start → Receive'],
  ['index.html', 'const seq = ++latestLoad;', 'Begin latest'],
  ['index.html', 'if (seq !== latestLoad) return;', 'Current: JsonDone·FailLoad 버림'],
  ['index.html', 'if (seq === latestLoad) {', 'Current: finally refreshing'],
  ['index.html', 'if (chip) { pickDistrict(chip.dataset.district); return; }', 'Switch'],
  ['index.html', "${state.status === 'ready' ? `<nav class=\"chips\" aria-label=\"구 선택\">${chips}</nav>` : ''}", 'Switch status'],
  ['index.html', 'const body = await res.json();', 'Receive → JsonDone'],
  ['index.html', 'const prev = state.lots;', 'JsonDone prev'],
  ['index.html', 'state.lots = rows.map(toLot);', 'JsonDone lots'],
  ['index.html', "return favorites.has(l.id) && p && fresh(p) && p.available <= 0 && fresh(l) && l.available >= 1;", 'JsonDone notify'],
  ['index.html', 'state.openings = [...state.openings.filter((o) => !ids.has(o.id)), ...found];', 'JsonDone banner'],
  ['index.html', 'if (hadData) state.refreshFailed = true; else state.status = \'error\';', 'FailLoad'],
  ['index.html', 'state.refreshing = false;', 'FailLoad·JsonDone'],
  ['index.html', "if (act === 'refresh' || act === 'retry') { if (!state.refreshing) load(); }", 'CanStart GuardRefreshing'],
  ['index.html', "const canAutoLoad = () => document.visibilityState === 'visible' && !state.refreshing && state.status !== 'loading'", 'CanStart'],
  ['index.html', "${state.status === 'ready' ? refreshBtn() : ''}", 'CanStart status'],
  ['index.html', "else if (act === 'dismiss') { state.openings = state.openings.filter((o) => o.id !== btn.dataset.id); render(); }", 'Dismiss'],
  ['server/index.mjs', 'if (cached && now() - cached.at < ttlMs) return Promise.resolve(cached.text);', 'Arrive 저장분'],
  ['server/index.mjs', 'pending ??= parking()', 'Arrive 한 번만 부름'],
  ['server/index.mjs', '.then((text) => { cached = { text, at: now() }; return text; })', 'UpstreamOk'],
  ['server/index.mjs', '.finally(() => { pending = null; });', 'UpstreamOk·UpstreamFail'],
];

const missing = anchors.filter(([f, code]) => !read(f).includes(code));
const counts = { 'index.html': (read('index.html').match(/(?<!function )\bload\(\)/g) || []).length };
// load()를 부르는 곳: 새로고침·다시 시도 클릭, pickDistrict(Switch), 타이머, visibilitychange, 처음. 새 곳이 생기면 CanStart·Switch를 다시 본다.
if (counts['index.html'] !== 5) missing.push(['index.html', `load() 호출 ${counts['index.html']}곳(모델은 5곳)`, 'CanStart·Switch']);

if (missing.length) {
  console.log('모델이 기대는 코드가 바뀌었어요. RefreshOrder.tla의 해당 동작을 다시 확인하세요:');
  for (const [f, code, where] of missing) console.log(`  - ${f} [${where}] ${code}`);
  process.exit(2);
}
console.log(`코드 앵커 ${anchors.length + 1}개 그대로`);
