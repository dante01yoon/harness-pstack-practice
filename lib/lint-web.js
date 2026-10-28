import { existsSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { HarnessError } from './errors.js';
import { listFiles } from './hash.js';
import { loadDesignSystem, normalizeColor, lengthToPx, forbiddenPhrases } from './design-system.js';

// 화면 HTML 정적 검사. 브라우저로 그려 보지 않고 소스만 읽으므로 다음 한계가 있다.
//   - 색·글자 크기: style 속성, <style> 블록, SVG fill/stroke 등 속성에 적힌 값만 본다. 외부 CSS 파일은 보지 않는다.
//   - 터치 영역: height/width(min-*) 를 px·rem·pt 로 명시한 버튼만 판정한다. 패딩으로 정해지는 크기는 모른다.
//     CSS 선택자는 마지막 단순 선택자(태그·.클래스·#아이디·[속성])만 맞춰 보고, :hover 같은 가상 클래스 규칙은 뺀다.

export const MIN_TOUCH_PX = 44;

export const RULE_LABEL = { color: '색', 'font-size': '글자 크기', 'touch-target': '터치 영역', copy: '문구' };

const CSS_KEYWORDS = new Set(['inherit', 'initial', 'unset', 'revert', 'revert-layer', 'transparent', 'currentcolor', 'none', 'auto']);
const SINGLE_COLOR_PROPS = new Set([
  'color', 'background-color', 'border-color', 'border-top-color', 'border-right-color', 'border-bottom-color',
  'border-left-color', 'outline-color', 'fill', 'stroke', 'stop-color', 'caret-color', 'accent-color', 'text-decoration-color',
]);
const COLOR_ATTRS = new Set(['fill', 'stroke', 'stop-color', 'color', 'bgcolor']);
const TEXT_ATTRS = new Set(['alt', 'title', 'placeholder', 'aria-label', 'value']);
const BUTTON_INPUT_TYPES = new Set(['button', 'submit', 'reset', 'image']);
const COLOR_LITERAL = /#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?)\([^)]*\)/g;

// ---- HTML ----

const TAG_RE = /<([a-zA-Z][\w:-]*)((?:\s+[^\s=/>]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?)*)\s*\/?>/y;
const ATTR_RE = /([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;

export function scanHtml(src) {
  const elements = [];
  const styles = [];
  const texts = [];
  let i = 0;
  const pushText = (from, to) => {
    if (to > from && src.slice(from, to).trim()) texts.push({ text: src.slice(from, to), offset: from });
  };
  while (i < src.length) {
    const lt = src.indexOf('<', i);
    if (lt === -1) {
      pushText(i, src.length);
      break;
    }
    pushText(i, lt);
    if (src.startsWith('<!--', lt)) {
      const end = src.indexOf('-->', lt + 4);
      i = end === -1 ? src.length : end + 3;
      continue;
    }
    if (src[lt + 1] === '!' || src[lt + 1] === '/' || src[lt + 1] === '?') {
      const end = src.indexOf('>', lt);
      i = end === -1 ? src.length : end + 1;
      continue;
    }
    TAG_RE.lastIndex = lt;
    const m = TAG_RE.exec(src);
    if (!m) {
      pushText(lt, lt + 1);
      i = lt + 1;
      continue;
    }
    const tag = m[1].toLowerCase();
    const attrs = {};
    for (const a of m[2].matchAll(ATTR_RE)) {
      attrs[a[1].toLowerCase()] = { value: a[2] ?? a[3] ?? a[4] ?? '', offset: lt + m[1].length + 1 + a.index };
    }
    elements.push({ tag, attrs, offset: lt });
    i = lt + m[0].length;
    if (tag === 'script' || tag === 'style') {
      const close = src.toLowerCase().indexOf(`</${tag}`, i);
      const end = close === -1 ? src.length : close;
      if (tag === 'style') styles.push({ css: src.slice(i, end), offset: i });
      i = end;
    }
  }
  return { elements, styles, texts };
}

// ---- CSS ----

// 선언 블록을 { prop, value, offset } 목록으로 나눈다. offset 은 base 기준 절대 위치.
export function parseDeclarations(text, base = 0) {
  const decls = [];
  let start = 0;
  for (const part of text.split(';')) {
    const colon = part.indexOf(':');
    if (colon !== -1) {
      const lead = part.length - part.trimStart().length;
      const prop = part.slice(0, colon).trim().toLowerCase();
      const value = part.slice(colon + 1).replace(/!important\s*$/i, '').trim();
      if (prop) decls.push({ prop, value, offset: base + start + lead });
    }
    start += part.length + 1;
  }
  return decls;
}

function matchingBrace(text, open) {
  let depth = 0;
  for (let i = open; i < text.length; i++) {
    if (text[i] === '{') depth++;
    else if (text[i] === '}' && --depth === 0) return i;
  }
  return text.length;
}

// 규칙 목록 [{ selector, decls }]. @media·@supports 안의 규칙도 꺼내고, @font-face·@keyframes 는 건너뛴다.
export function parseCss(css, base = 0) {
  const text = css.replace(/\/\*[\s\S]*?\*\//g, (c) => ' '.repeat(c.length));
  const rules = [];
  const walk = (from, to) => {
    let i = from;
    while (i < to) {
      const brace = text.indexOf('{', i);
      const semi = text.indexOf(';', i);
      if (brace === -1 || brace >= to) break;
      if (semi !== -1 && semi < brace && text.slice(i, semi).trim().startsWith('@')) {
        i = semi + 1;
        continue;
      }
      const prelude = text.slice(i, brace).trim();
      const close = Math.min(matchingBrace(text, brace), to);
      if (/^@(media|supports|container|layer)\b/i.test(prelude)) walk(brace + 1, close);
      else if (!prelude.startsWith('@')) {
        rules.push({ selector: prelude, decls: parseDeclarations(text.slice(brace + 1, close), base + brace + 1) });
      }
      i = close + 1;
    }
  };
  walk(0, text.length);
  return rules;
}

// 선택자의 마지막 단순 선택자 묶음을 { tag, id, classes, attrs } 로. 가상 클래스가 있거나 해석이 안 되면 null.
function lastCompound(selector) {
  const parts = selector.trim().split(/\s*[>+~]\s*|\s+(?![^[]*\])/);
  const last = parts[parts.length - 1];
  if (!last || last.includes(':')) return null;
  const m = /^([a-zA-Z][\w-]*|\*)?((?:\.[\w-]+|#[\w-]+|\[[^\]]+\])*)$/.exec(last);
  if (!m) return null;
  const compound = { tag: m[1] && m[1] !== '*' ? m[1].toLowerCase() : null, ids: [], classes: [], attrs: [] };
  for (const t of m[2].match(/\.[\w-]+|#[\w-]+|\[[^\]]+\]/g) ?? []) {
    if (t[0] === '.') compound.classes.push(t.slice(1));
    else if (t[0] === '#') compound.ids.push(t.slice(1));
    else {
      const a = /^\[\s*([\w-]+)\s*(?:=\s*["']?([^"'\]]*)["']?\s*)?\]$/.exec(t);
      if (!a) return null;
      compound.attrs.push({ name: a[1].toLowerCase(), value: a[2] });
    }
  }
  return compound;
}

function matches(el, selector) {
  return selector.split(',').some((sel) => {
    const c = lastCompound(sel);
    if (!c) return false;
    if (c.tag && c.tag !== el.tag) return false;
    const classes = (el.attrs.class?.value ?? '').split(/\s+/);
    if (!c.classes.every((cls) => classes.includes(cls))) return false;
    if (!c.ids.every((id) => el.attrs.id?.value === id)) return false;
    return c.attrs.every((a) => el.attrs[a.name] && (a.value === undefined || el.attrs[a.name].value === a.value));
  });
}

function isButton(el) {
  if (el.tag === 'button') return true;
  if (el.tag === 'input' && BUTTON_INPUT_TYPES.has((el.attrs.type?.value ?? '').toLowerCase())) return true;
  return (el.attrs.role?.value ?? '').toLowerCase() === 'button';
}

// ---- 검사 ----

function lineIndex(src) {
  const starts = [0];
  for (let i = 0; i < src.length; i++) if (src[i] === '\n') starts.push(i + 1);
  return (offset) => {
    let lo = 0;
    let hi = starts.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (starts[mid] <= offset) lo = mid;
      else hi = mid - 1;
    }
    return lo + 1;
  };
}

function checkColorValue(prop, value, allowed, report, offset) {
  for (const m of value.matchAll(COLOR_LITERAL)) {
    const norm = normalizeColor(m[0]);
    if (norm && !allowed.has(norm)) report('color', offset, `${prop}: ${m[0]} — 토큰에 없는 색`);
  }
  const v = value.trim().toLowerCase();
  if (SINGLE_COLOR_PROPS.has(prop) && /^[a-z]+$/.test(v) && !CSS_KEYWORDS.has(v)) {
    report('color', offset, `${prop}: ${value} — 이름 색 대신 토큰 값을 쓰세요`);
  }
}

function checkFontSize(value, allowed, report, offset, prop = 'font-size') {
  const v = value.trim().toLowerCase();
  if (!v || v.startsWith('var(') || CSS_KEYWORDS.has(v) || /^-?\d*\.?\d+(em|%)$/.test(v)) return;
  const px = lengthToPx(v);
  if (px === null) report('font-size', offset, `${prop}: ${value} — 토큰에 없는 글자 크기`);
  else if (![...allowed].some((a) => Math.abs(a - px) < 0.01)) {
    report('font-size', offset, `${prop}: ${value} — 토큰에 없는 글자 크기 (토큰: ${[...allowed].sort((a, b) => a - b).join(', ')}px)`);
  }
}

function checkDeclaration(d, ctx, report) {
  checkColorValue(d.prop, d.value, ctx.colors, report, d.offset);
  if (d.prop === 'font-size') checkFontSize(d.value, ctx.fontSizes, report, d.offset);
  if (d.prop === 'font') {
    const size = /(?:^|\s)(\d*\.?\d+(?:px|rem|pt))(?=\s|\/)/i.exec(d.value);
    if (size) checkFontSize(size[1], ctx.fontSizes, report, d.offset, 'font');
  }
}

function checkTouchTarget(el, rules, report) {
  const size = {};
  const apply = (decls) => {
    for (const d of decls) if (['height', 'min-height', 'width', 'min-width'].includes(d.prop)) size[d.prop] = d.value;
  };
  for (const r of rules) if (matches(el, r.selector)) apply(r.decls);
  if (el.attrs.style) apply(parseDeclarations(el.attrs.style.value));
  const label = el.attrs.id ? `#${el.attrs.id.value}` : el.attrs.class ? `.${el.attrs.class.value.trim().split(/\s+/).join('.')}` : '';
  for (const [dim, name] of [['height', '높이'], ['width', '너비']]) {
    const base = lengthToPx(size[dim]);
    if (base === null) continue;
    const effective = Math.max(base, lengthToPx(size[`min-${dim}`]) ?? 0);
    if (effective < MIN_TOUCH_PX) {
      report('touch-target', el.offset, `<${el.tag}${label}> ${name} ${+effective.toFixed(2)}px — ${MIN_TOUCH_PX}px 보다 작음`);
    }
  }
}

function phraseRegex(phrase) {
  const escaped = phrase.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
  return new RegExp(escaped, 'giu');
}

export function lintHtml(src, ctx) {
  const issues = [];
  const lineOf = lineIndex(src);
  const report = (rule, offset, message) => issues.push({ rule, line: lineOf(offset), message });
  const { elements, styles, texts } = scanHtml(src);

  const rules = [];
  for (const s of styles) rules.push(...parseCss(s.css, s.offset));
  for (const r of rules) for (const d of r.decls) checkDeclaration(d, ctx, report);

  for (const el of elements) {
    if (el.attrs.style) {
      for (const d of parseDeclarations(el.attrs.style.value, el.attrs.style.offset)) checkDeclaration(d, ctx, report);
    }
    for (const [name, attr] of Object.entries(el.attrs)) {
      if (COLOR_ATTRS.has(name)) checkColorValue(name === 'bgcolor' ? 'background-color' : name, attr.value, ctx.colors, report, attr.offset);
      if (name === 'font-size') checkFontSize(attr.value, ctx.fontSizes, report, attr.offset);
    }
    if (isButton(el)) checkTouchTarget(el, rules, report);
  }

  const copyTargets = [...texts];
  for (const el of elements) {
    for (const [name, attr] of Object.entries(el.attrs)) if (TEXT_ATTRS.has(name)) copyTargets.push({ text: attr.value, offset: attr.offset });
  }
  for (const { phrase, use, reason } of ctx.phrases) {
    const re = phraseRegex(phrase);
    for (const t of copyTargets) {
      for (const m of t.text.matchAll(re)) {
        const hint = use ? ` — "${use}"(으)로 쓰세요` : reason ? ` — ${reason}` : '';
        report('copy', t.offset + m.index, `금지 문구 "${m[0]}"${hint}`);
      }
    }
  }
  return issues.sort((a, b) => a.line - b.line || a.rule.localeCompare(b.rule));
}

export function lintContext(projectDir) {
  const ds = loadDesignSystem(projectDir);
  const errors = ds.errors.filter((e) => !e.includes('components.json'));
  if (errors.length > 0) {
    throw new HarnessError(`검사 기준(tokens.json, copy.json)을 읽을 수 없습니다:\n${errors.map((e) => `  - ${e}`).join('\n')}`);
  }
  return {
    colors: new Set(Object.values(ds.tokens.color).map(normalizeColor)),
    fontSizes: new Set(Object.values(ds.tokens.fontSize).map(lengthToPx)),
    phrases: forbiddenPhrases(ds.copy),
  };
}

// paths(파일·폴더)를 주지 않으면 프로젝트 폴더 아래 모든 .html 을 검사한다.
export function lintWeb(projectDir, paths = [], { base = projectDir } = {}) {
  const ctx = lintContext(projectDir);
  const files = [];
  for (const p of paths.length > 0 ? paths : [projectDir]) {
    if (!existsSync(p)) throw new HarnessError(`파일이 없습니다: ${p}`);
    if (statSync(p).isDirectory()) files.push(...listFiles(p).filter((f) => /\.html?$/i.test(f)).map((f) => join(p, f)));
    else files.push(p);
  }
  if (files.length === 0) throw new HarnessError('검사할 HTML 파일이 없습니다');
  const results = [...new Set(files)].map((abs) => ({
    file: relative(base, abs) || abs,
    issues: lintHtml(readFileSync(abs, 'utf8'), ctx),
  }));
  return { files: results, total: results.reduce((n, r) => n + r.issues.length, 0) };
}
