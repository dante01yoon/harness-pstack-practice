import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { HarnessError } from './errors.js';
import { assertStageOpen } from './gate.js';
import { screenIds } from './check.js';

// 04-wireframe/<화면ID>.md 의 배치 목록으로 저충실도 SVG 를 그린다.
//
//   # S01 로그인
//   ## 레이아웃            ← 기본 상태
//   - header: 로그인
//   - input: 이메일
//   - button: 로그인
//   ## 상태: 오류           ← 상태마다 프레임 하나를 옆에 더 그린다
//   - alert: 비밀번호가 맞지 않아요
//
// 그 밖의 ## 절(메모 등)은 무시한다.

export const WIREFRAME_DIR = '04-wireframe';

// 요소 종류별 높이(px)와 폭(full: 프레임 전체 폭, 아니면 좌우 여백 안쪽)
export const ELEMENTS = {
  header: { h: 56, full: true },
  tabbar: { h: 56, full: true },
  title: { h: 32 },
  text: { h: 24 },
  input: { h: 48 },
  button: { h: 48 },
  link: { h: 24 },
  image: { h: 160 },
  card: { h: 96 },
  list: { h: 144 },
  alert: { h: 48 },
  empty: { h: 160 },
  loading: { h: 48 },
  divider: { h: 1 },
  spacer: { h: 24 },
};

const FRAME_W = 360;
const FRAME_MIN_H = 640;
const PAD = 16;
const GAP = 12;
const FRAME_GAP = 40;
const CAPTION_H = 28;
const MARGIN = 20;

export function parseWireframe(text, id = '') {
  const states = [];
  const errors = [];
  let current = null;
  text.split(/\r?\n/).forEach((line, i) => {
    const heading = /^##\s+(.+?)\s*$/.exec(line);
    if (heading) {
      const name = heading[1];
      const state = /^상태\s*[:：]\s*(.+)$/.exec(name);
      if (name === '레이아웃') current = { name: '기본', items: [] };
      else if (state) current = { name: state[1], items: [] };
      else current = null;
      if (current) states.push(current);
      return;
    }
    if (!current) return;
    const item = /^\s*[-*]\s+([A-Za-z]+)\s*(?:[:：]\s*(.*?))?\s*$/.exec(line);
    if (!item) {
      if (/^\s*[-*]\s+/.test(line)) errors.push(`${id}.md:${i + 1} "종류: 내용" 형식이 아닙니다`);
      return;
    }
    const kind = item[1].toLowerCase();
    if (!ELEMENTS[kind]) {
      errors.push(`${id}.md:${i + 1} 알 수 없는 요소 "${item[1]}" (가능한 값: ${Object.keys(ELEMENTS).join(', ')})`);
      return;
    }
    current.items.push({ kind, label: item[2] ?? '' });
  });
  if (!states.some((s) => s.name === '기본')) errors.push(`${id}.md 에 "## 레이아웃" 절이 없습니다`);
  for (const s of states) if (s.items.length === 0) errors.push(`${id}.md 의 "${s.name}" 상태에 요소가 없습니다`);
  const title = /^#\s+(.+?)\s*$/m.exec(text)?.[1] ?? id;
  return { title, states, errors };
}

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function renderElement({ kind, label }, x, y, w) {
  const h = ELEMENTS[kind].h;
  const cx = x + w / 2;
  const cy = y + h / 2;
  const text = (tx, anchor = 'middle', extra = '') =>
    label ? `<text x="${tx}" y="${cy}" text-anchor="${anchor}" dominant-baseline="central"${extra}>${esc(label)}</text>` : '';
  switch (kind) {
    case 'divider':
      return `<line x1="${x}" y1="${y}" x2="${x + w}" y2="${y}" stroke="#bbb"/>`;
    case 'spacer':
      return '';
    case 'title':
      return text(x, 'start', ' font-size="18" font-weight="bold"');
    case 'text':
      return text(x, 'start');
    case 'link':
      return label ? `${text(x, 'start', ' fill="#555"')}<line x1="${x}" y1="${cy + 9}" x2="${x + Math.min(w, label.length * 14)}" y2="${cy + 9}" stroke="#555"/>` : '';
    case 'image':
      return [
        `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#eee" stroke="#999"/>`,
        `<line x1="${x}" y1="${y}" x2="${x + w}" y2="${y + h}" stroke="#bbb"/>`,
        `<line x1="${x + w}" y1="${y}" x2="${x}" y2="${y + h}" stroke="#bbb"/>`,
        text(cx, 'middle', ' fill="#555"'),
      ].join('');
    case 'button':
      return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="#555"/>${text(cx, 'middle', ' fill="#fff"')}`;
    case 'input':
      return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" fill="#fff" stroke="#999"/>${text(x + 12, 'start', ' fill="#999"')}`;
    case 'header':
    case 'tabbar':
      return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#ddd"/>${text(cx)}`;
    case 'list': {
      const rows = [0, 1, 2].map((r) => `<rect x="${x}" y="${y + r * 48}" width="${w}" height="48" fill="#fff" stroke="#bbb"/>`);
      return rows.join('') + (label ? `<text x="${x + 12}" y="${y + 24}" dominant-baseline="central">${esc(label)}</text>` : '');
    }
    case 'alert':
      return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" fill="#f4f4f4" stroke="#555" stroke-dasharray="4 3"/>${text(x + 12, 'start')}`;
    case 'loading':
      return `<circle cx="${cx}" cy="${cy}" r="14" fill="none" stroke="#999" stroke-width="3" stroke-dasharray="60 30"/>`;
    default: // card, empty
      return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="#fafafa" stroke="#999"${kind === 'empty' ? ' stroke-dasharray="6 4"' : ''}/>${text(cx, 'middle', ' fill="#555"')}`;
  }
}

export function renderWireframeSvg({ title, states }) {
  // 위에서부터 쌓되, 전체 폭 요소(header) 다음에는 여백을 두고 tabbar 는 프레임 바닥에 붙인다.
  const frames = states.map((state) => {
    let y = 0;
    let afterFull = true;
    const parts = [];
    const bottom = [];
    for (const item of state.items) {
      const el = ELEMENTS[item.kind];
      if (item.kind === 'tabbar') {
        bottom.push(item);
        continue;
      }
      if (el.full) {
        if (!afterFull) y += PAD - GAP;
        parts.push({ item, x: 0, y, w: FRAME_W });
        y += el.h;
      } else {
        if (afterFull) y += PAD;
        parts.push({ item, x: PAD, y, w: FRAME_W - PAD * 2 });
        y += el.h + GAP;
      }
      afterFull = el.full;
    }
    const bottomH = bottom.reduce((h, item) => h + ELEMENTS[item.kind].h, 0);
    return { name: state.name, parts, bottom, h: Math.max(FRAME_MIN_H, y + (afterFull ? 0 : PAD - GAP) + bottomH) };
  });
  const frameH = Math.max(...frames.map((f) => f.h));
  for (const f of frames) {
    let y = frameH;
    for (const item of [...f.bottom].reverse()) {
      y -= ELEMENTS[item.kind].h;
      f.parts.push({ item, x: 0, y, w: FRAME_W });
    }
  }
  const width = MARGIN * 2 + frames.length * FRAME_W + (frames.length - 1) * FRAME_GAP;
  const height = MARGIN * 2 + CAPTION_H + frameH;
  const out = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" font-family="sans-serif" font-size="14" fill="#333">`,
    `<title>${esc(title)}</title>`,
    `<rect width="${width}" height="${height}" fill="#fff"/>`,
  ];
  frames.forEach((f, i) => {
    const ox = MARGIN + i * (FRAME_W + FRAME_GAP);
    const oy = MARGIN + CAPTION_H;
    out.push(`<g>`);
    out.push(`<text x="${ox}" y="${MARGIN + 14}" font-size="13" fill="#777">${esc(f.name)}</text>`);
    out.push(`<rect x="${ox}" y="${oy}" width="${FRAME_W}" height="${frameH}" fill="#fff" stroke="#333"/>`);
    for (const p of f.parts) {
      const svg = renderElement(p.item, ox + p.x, oy + p.y, p.w);
      if (svg) out.push(svg);
    }
    out.push(`</g>`);
  });
  out.push('</svg>');
  return out.join('\n') + '\n';
}

// 지정한 화면(없으면 04-wireframe 의 모든 화면 md)을 SVG 로 그린다.
export function drawWireframes(projectDir, ids = []) {
  assertStageOpen(projectDir, 'wireframe', '와이어프레임을 그릴 수 없습니다');
  const dir = join(projectDir, WIREFRAME_DIR);
  const all = screenIds(dir, '.md');
  const targets = ids.length > 0 ? ids : all;
  if (targets.length === 0) throw new HarnessError(`${WIREFRAME_DIR}/ 에 <화면ID>.md 가 없습니다`);
  const unknown = targets.filter((id) => !all.includes(id));
  if (unknown.length > 0) throw new HarnessError(`화면 md 가 없습니다: ${unknown.map((id) => `${WIREFRAME_DIR}/${id}.md`).join(', ')}`);

  const parsed = targets.map((id) => ({ id, ...parseWireframe(readFileSync(join(dir, `${id}.md`), 'utf8'), id) }));
  const errors = parsed.flatMap((p) => p.errors);
  if (errors.length > 0) {
    throw new HarnessError(`와이어프레임 md 에 문제가 있습니다 (SVG 를 하나도 쓰지 않았습니다):\n${errors.map((e) => `  - ${e}`).join('\n')}`);
  }
  for (const p of parsed) writeFileSync(join(dir, `${p.id}.svg`), renderWireframeSvg(p));
  return parsed.map((p) => ({ id: p.id, file: `${WIREFRAME_DIR}/${p.id}.svg`, states: p.states.map((s) => s.name) }));
}
