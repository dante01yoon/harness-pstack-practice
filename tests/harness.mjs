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
// storage: localStorage 내용({ 키: 문자열 }). 앱이 쓴 값도 이 객체에 남는다. null이면 접근할 때 예외(사생활 보호 모드).
export async function open({ body = response, now, hash = '', storage = {} } = {}) {
  const el = (id) => ({ id, innerHTML: '', textContent: '', hidden: false,
    querySelector: () => null, querySelectorAll: () => [], addEventListener() {} });
  const view = el('view');
  const results = el('results');
  const listeners = {};
  view.addEventListener = (type, fn) => { (listeners[type] ??= []).push(fn); };

  let served = body;
  const RealDate = Date;
  let at = now ?? RealDate.now();
  class FixedDate extends RealDate {
    constructor(...a) { if (a.length) super(...a); else super(at); }
    static now() { return at; }
  }

  const intervals = [];
  const docListeners = {};
  const document = {
    getElementById: (id) => ({ view,
      results: view.innerHTML.includes('id="results"') ? results : null }[id] ?? null),
    activeElement: null,
    visibilityState: 'visible',
    addEventListener: (type, fn) => { (docListeners[type] ??= []).push(fn); },
  };
  const localStorage = {
    getItem: (k) => (Object.hasOwn(storage, k) ? storage[k] : null),
    setItem: (k, v) => { storage[k] = String(v); },
  };

  const ctx = {
    Date: FixedDate, Intl, Object, Array, Map, Set, String, Number, Boolean, Promise, TypeError, isNaN, JSON,
    console,
    document,
    get localStorage() { if (storage == null) throw new Error('SecurityError'); return localStorage; },
    setInterval: (fn, ms) => intervals.push({ fn, ms }),
    clearInterval: (i) => { intervals[i - 1] = null; },
    location: { hash },
    history: { state: null, pushState() {}, back() {} },
    scrollY: 0, scrollTo() {}, addEventListener() {},
    fetch: async () => {
      if (served == null) throw new TypeError('offline');
      return { ok: true, json: async () => structuredClone(served) };
    },
  };
  ctx.window = ctx;
  const settle = async () => { for (let i = 0; i < 5; i++) await new Promise(setImmediate); }; // load()가 끝날 때까지
  vm.runInNewContext(script, ctx);
  await settle();

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
    // data-act 버튼 누르기. dataset으로 data-id 같은 값을 더 준다.
    click: (act, dataset = {}) => {
      const btn = { dataset: { act, ...dataset }, closest: (sel) => (sel === '[data-act]' ? btn : null) };
      for (const fn of listeners.click ?? []) fn({ target: btn, preventDefault() {} });
      return new Promise(setImmediate).then(() => new Promise(setImmediate));
    },
    // setInterval로 건 반복 작업의 간격(ms)
    intervals: () => intervals.filter(Boolean).map((t) => t.ms),
    // 반복 작업을 한 번 돌리고 그 불러오기가 끝날 때까지 기다린다
    tick: async () => { for (const t of intervals) t?.fn(); await settle(); },
    // 앱이 보는 현재 시각을 ms만큼 옮긴다
    advance: (ms) => { at += ms; },
    // 화면 보임 상태를 바꾸고 visibilitychange를 보낸다('visible' | 'hidden')
    setVisibility: async (v) => {
      document.visibilityState = v;
      for (const fn of docListeners.visibilitychange ?? []) fn({});
      await settle();
    },
    // 키보드 초점을 둔다(예: 'q' 검색창). null이면 초점 없음
    focus: (id) => { document.activeElement = id ? { id } : null; },
    storage,
  };
}
