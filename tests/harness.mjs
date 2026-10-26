// index.html의 <script>를 고치지 않고 그대로 Node vm에서 돌린다.
// DOM은 이 앱이 쓰는 만큼만 흉내 내고, 화면은 innerHTML 문자열로 확인한다.
import fs from 'node:fs';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
export const html = fs.readFileSync(`${root}index.html`, 'utf8');
export const response = JSON.parse(fs.readFileSync(`${root}data/parking.json`, 'utf8'));
export const rows = response.GetParkingInfo.row;
export const copy = JSON.parse(fs.readFileSync(`${root}work/seoul-parking/copy.json`, 'utf8'));

const script = /<script>([\s\S]*?)<\/script>/.exec(html)[1];

// 'YYYY-MM-DD HH:MM:SS'(KST) → epoch ms
export const kst = (s) => new Date(`${s.replace(' ', 'T')}+09:00`).getTime();
export const row = (id) => rows.find((r) => r.PKLT_CD === id);

// body: fetch가 돌려줄 응답(기본은 data/parking.json). null이면 fetch 실패.
// now: 앱이 보는 현재 시각(ms). hash: 처음 열 화면(예: '#/p/172971').
export async function open({ body = response, now, hash = '' } = {}) {
  const el = (id) => ({ id, innerHTML: '', textContent: '', hidden: false,
    querySelector: () => null, querySelectorAll: () => [], addEventListener() {} });
  const view = el('view');
  const results = el('results');
  const listeners = {};
  view.addEventListener = (type, fn) => { (listeners[type] ??= []).push(fn); };

  let served = body;
  const RealDate = Date;
  const at = now ?? RealDate.now();
  class FixedDate extends RealDate {
    constructor(...a) { if (a.length) super(...a); else super(at); }
    static now() { return at; }
  }

  const ctx = {
    Date: FixedDate, Intl, Object, Array, Map, Set, String, Number, Boolean, Promise, TypeError, isNaN,
    console,
    document: {
      getElementById: (id) => ({ view,
        results: view.innerHTML.includes('id="results"') ? results : null }[id] ?? null),
      activeElement: null,
    },
    location: { hash },
    history: { state: null, pushState() {}, back() {} },
    scrollY: 0, scrollTo() {}, addEventListener() {},
    fetch: async () => {
      if (served == null) throw new TypeError('offline');
      return { ok: true, json: async () => structuredClone(served) };
    },
  };
  ctx.window = ctx;
  vm.runInNewContext(script, ctx);
  for (let i = 0; i < 5; i++) await new Promise(setImmediate); // load()가 끝날 때까지

  const screen = () => view.innerHTML.replace('<div id="results"></div>', `<div id="results">${results.innerHTML}</div>`);
  return {
    screen,
    // 다음 fetch 응답을 바꾼다(null이면 실패)
    serve: (b) => { served = b; },
    // 태그를 뺀 화면 글자(공백 정리)
    text: () => screen().replace(/<[^>]+>/g, ' ').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim(),
    // 목록에서 주차장 한 행의 HTML
    rowOf: (id) => {
      const s = screen();
      const i = s.indexOf(`href="#/p/${id}"`);
      if (i < 0) return null;
      return s.slice(s.lastIndexOf('<li>', i), s.indexOf('</li>', i) + 5);
    },
    click: (act) => {
      const btn = { dataset: { act }, closest: (sel) => (sel === '[data-act]' ? btn : null) };
      for (const fn of listeners.click ?? []) fn({ target: btn, preventDefault() {} });
      return new Promise(setImmediate).then(() => new Promise(setImmediate));
    },
  };
}
