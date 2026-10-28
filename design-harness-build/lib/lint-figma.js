import { existsSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { HarnessError } from './errors.js';
import { listFiles } from './hash.js';
import { findStage } from './stages.js';
import { NODES_DIR } from './figma.js';
import { lengthToPx, loadDesignSystem } from './design-system.js';
import { lintContext, phraseRegex, MIN_TOUCH_PX } from './lint-web.js';

// 내보낸 Figma 노드(06-figma/nodes/*.json) 검사. 받는 형식:
//   - REST GET /v1/files/:key/nodes?ids=... 응답   { "nodes": { "12:34": { "document": {...}, "components": {...} } } }
//   - REST GET /v1/files/:key 응답                 { "document": {...} }
//   - 노드 하나 또는 노드 배열 (플러그인 API 로 뽑은 것도 fills·fontSize·width 이름이 같으면 된다)
// 변수에 바인딩된 값(boundVariables)은 토큰에서 온 것으로 보고 넘어간다. 숨긴 노드(visible: false)는 보지 않는다.
// 터치 영역은 이름(버튼·링크·입력 등)이나 프로토타입 반응(reactions)으로 인터랙티브 요소를 추정해서 본다.

export const RULE_LABEL = {
  color: '색',
  'font-size': '글자 크기',
  'font-family': '글꼴',
  spacing: '간격',
  'touch-target': '터치 영역',
  copy: '문구',
  variant: 'variant',
};

const INTERACTIVE = /button|btn|버튼|link|링크|\btab\b|탭|checkbox|체크박스|radio|라디오|switch|스위치|toggle|토글|input|text\s?field|입력|select|dropdown|드롭다운|chip|칩/i;
const CONTAINER_TYPES = new Set(['FRAME', 'INSTANCE', 'COMPONENT', 'GROUP']);
const SPACING_PROPS = ['itemSpacing', 'counterAxisSpacing', 'paddingLeft', 'paddingRight', 'paddingTop', 'paddingBottom'];

const hex2 = (n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');

// Figma 색 { r, g, b, a } (0~1) → #rrggbbaa
export function figmaColor(c, opacity = 1) {
  if (!c || typeof c.r !== 'number') return null;
  return '#' + [c.r, c.g, c.b, (c.a ?? 1) * opacity].map((v) => hex2(v * 255)).join('');
}

const showColor = (norm) => {
  const alpha = parseInt(norm.slice(7), 16);
  return norm.slice(0, 7).toUpperCase() + (alpha < 255 ? ` (불투명도 ${Math.round((alpha / 255) * 100)}%)` : '');
};

function nodeSize(node) {
  const box = node.absoluteBoundingBox ?? node.absoluteRenderBounds;
  if (box && typeof box.width === 'number') return { width: box.width, height: box.height };
  if (node.size && typeof node.size.x === 'number') return { width: node.size.x, height: node.size.y };
  if (typeof node.width === 'number') return { width: node.width, height: node.height };
  return null;
}

// "State=Disabled, Size=md" → ['disabled', 'md', 'state=disabled, size=md']
function variantValues(name) {
  const lower = String(name).toLowerCase();
  const values = lower.split(',').map((p) => (p.includes('=') ? p.split('=')[1] : p).trim());
  return [...values, lower.trim()];
}

function loadRoots(data, file) {
  if (Array.isArray(data)) return { roots: data, meta: {} };
  if (data && typeof data.nodes === 'object' && data.nodes !== null) {
    const meta = { components: {}, componentSets: {} };
    const roots = [];
    for (const entry of Object.values(data.nodes)) {
      if (!entry?.document) continue;
      roots.push(entry.document);
      Object.assign(meta.components, entry.components);
      Object.assign(meta.componentSets, entry.componentSets);
    }
    return { roots, meta };
  }
  if (data?.document) return { roots: [data.document], meta: { components: data.components, componentSets: data.componentSets } };
  if (data && typeof data.type === 'string') return { roots: [data], meta: {} };
  throw new HarnessError(`${file}: Figma 노드 JSON 형식을 알 수 없습니다 (nodes, document, 또는 type 이 있는 노드여야 함)`);
}

export function lintNodes(data, ctx, file = '노드') {
  const { roots, meta } = loadRoots(data, file);
  const issues = [];
  const allowedSizes = [...ctx.fontSizes].sort((a, b) => a - b);
  const allowedSpacing = [...ctx.spacing].sort((a, b) => a - b);
  const near = (set, v) => [...set].some((a) => Math.abs(a - v) < 0.01);

  const componentName = (node, parent) => {
    if (node.type === 'COMPONENT' && parent?.type === 'COMPONENT_SET') return parent.name;
    if (node.type === 'INSTANCE' && node.componentId) {
      const comp = meta.components?.[node.componentId];
      return meta.componentSets?.[comp?.componentSetId]?.name ?? comp?.name;
    }
    return undefined;
  };

  const checkPaints = (node, prop, report) => {
    const paints = Array.isArray(node[prop]) ? node[prop] : [];
    paints.forEach((p, i) => {
      if (!p || p.visible === false) return;
      const bound = p.boundVariables?.color || node.boundVariables?.[prop]?.[i];
      const colors = p.type === 'SOLID' ? [{ color: p.color, bound }] : (p.gradientStops ?? []).map((s) => ({ color: s.color, bound: s.boundVariables?.color }));
      for (const c of colors) {
        if (c.bound) continue;
        const norm = figmaColor(c.color, p.opacity ?? 1);
        if (norm && !ctx.colors.has(norm)) report('color', `${prop === 'fills' ? '채우기' : '선'} ${showColor(norm)} — 토큰에 없는 색`);
      }
    });
  };

  const checkText = (node, report) => {
    const styles = [{ style: node.style ?? {}, bound: node.boundVariables ?? {} }];
    for (const s of Object.values(node.styleOverrideTable ?? {})) styles.push({ style: s, bound: s.boundVariables ?? {} });
    for (const { style, bound } of styles) {
      const size = style.fontSize;
      if (typeof size === 'number' && !bound.fontSize && !near(ctx.fontSizes, size)) {
        report('font-size', `글자 크기 ${size}px — 토큰에 없는 글자 크기 (토큰: ${allowedSizes.join(', ')}px)`);
      }
      const family = style.fontFamily;
      if (ctx.fontFamilies.size > 0 && typeof family === 'string' && !bound.fontFamily && !ctx.fontFamilies.has(family.toLowerCase())) {
        report('font-family', `글꼴 "${family}" — 토큰에 없는 글꼴`);
      }
    }
    // 플러그인 API 형식: fontSize, fontName 이 노드에 바로 있다
    if (!node.style && typeof node.fontSize === 'number' && !node.boundVariables?.fontSize && !near(ctx.fontSizes, node.fontSize)) {
      report('font-size', `글자 크기 ${node.fontSize}px — 토큰에 없는 글자 크기 (토큰: ${allowedSizes.join(', ')}px)`);
    }
    const family = node.fontName?.family;
    if (!node.style && ctx.fontFamilies.size > 0 && typeof family === 'string' && !ctx.fontFamilies.has(family.toLowerCase())) {
      report('font-family', `글꼴 "${family}" — 토큰에 없는 글꼴`);
    }
    const text = String(node.characters ?? '');
    for (const { phrase, use, reason } of ctx.phrases) {
      for (const m of text.matchAll(phraseRegex(phrase))) {
        const hint = use ? ` — "${use}"(으)로 쓰세요` : reason ? ` — ${reason}` : '';
        report('copy', `금지 문구 "${m[0]}"${hint}`);
      }
    }
  };

  const checkVariants = (node, report) => {
    const spec = Object.entries(ctx.components).find(([name]) => name.toLowerCase() === String(node.name).trim().toLowerCase());
    if (!spec) return;
    const have = new Set();
    for (const child of node.children ?? []) for (const v of variantValues(child.name)) have.add(v);
    for (const def of Object.values(node.componentPropertyDefinitions ?? {})) {
      for (const v of def.variantOptions ?? []) have.add(String(v).toLowerCase());
    }
    for (const v of spec[1].variants) if (!have.has(v.toLowerCase())) report('variant', `${spec[0]} 에 variant "${v}" 없음 (components.json)`);
  };

  const walk = (node, parent, path, inInteractive) => {
    if (!node || typeof node !== 'object' || node.visible === false) return;
    const here = [...path, node.name ?? node.id ?? '?'];
    const report = (rule, message) => issues.push({ rule, node: node.id ?? null, path: here.join(' / '), message });

    checkPaints(node, 'fills', report);
    checkPaints(node, 'strokes', report);
    if (node.type === 'TEXT') checkText(node, report);
    if (node.type === 'COMPONENT_SET') checkVariants(node, report);

    if (allowedSpacing.length > 0 && node.layoutMode && node.layoutMode !== 'NONE') {
      for (const prop of SPACING_PROPS) {
        const v = node[prop];
        if (typeof v !== 'number' || v <= 0 || node.boundVariables?.[prop] || near(ctx.spacing, v)) continue;
        report('spacing', `${prop} ${v}px — 토큰에 없는 간격 (토큰: ${allowedSpacing.join(', ')}px)`);
      }
    }

    let interactive = inInteractive;
    if (!inInteractive && CONTAINER_TYPES.has(node.type)) {
      const name = componentName(node, parent);
      const hasReaction = (node.reactions ?? node.interactions ?? []).length > 0;
      if (hasReaction || INTERACTIVE.test(String(node.name ?? '')) || (name && INTERACTIVE.test(name))) {
        interactive = true;
        const size = nodeSize(node);
        if (size) {
          for (const [dim, label] of [['height', '높이'], ['width', '너비']]) {
            if (size[dim] < MIN_TOUCH_PX) report('touch-target', `${label} ${+size[dim].toFixed(2)}px — ${MIN_TOUCH_PX}px 보다 작음`);
          }
        }
      }
    }
    for (const child of node.children ?? []) walk(child, node, here, interactive);
  };

  for (const root of roots) walk(root, null, [], false);
  return issues;
}

export function figmaLintContext(projectDir) {
  const base = lintContext(projectDir);
  const { tokens, components = {} } = loadDesignSystem(projectDir);
  const families = new Set();
  for (const v of Object.values(tokens.fontFamily ?? {})) {
    for (const f of String(v).split(',')) families.add(f.trim().replace(/^["']|["']$/g, '').toLowerCase());
  }
  return {
    ...base,
    spacing: new Set(Object.values(tokens.spacing ?? {}).map(lengthToPx)),
    fontFamilies: families,
    components,
  };
}

// paths(파일·폴더)를 주지 않으면 06-figma/nodes/ 아래 모든 .json 을 검사한다.
export function lintFigma(projectDir, paths = [], { base = projectDir } = {}) {
  const ctx = figmaLintContext(projectDir);
  const nodesDir = join(projectDir, findStage('figma').dir, NODES_DIR);
  const files = [];
  for (const p of paths.length > 0 ? paths : [nodesDir]) {
    if (!existsSync(p)) {
      if (paths.length === 0) break;
      throw new HarnessError(`파일이 없습니다: ${p}`);
    }
    if (statSync(p).isDirectory()) files.push(...listFiles(p).filter((f) => /\.json$/i.test(f)).map((f) => join(p, f)));
    else files.push(p);
  }
  if (files.length === 0) {
    throw new HarnessError(`검사할 노드 JSON 이 없습니다. Figma 노드를 ${findStage('figma').dir}/${NODES_DIR}/ 에 내보내세요`);
  }
  const results = [...new Set(files)].map((abs) => {
    const file = relative(base, abs) || abs;
    let data;
    try {
      data = JSON.parse(readFileSync(abs, 'utf8'));
    } catch (err) {
      throw new HarnessError(`${file}: JSON 형식 오류 (${err.message})`);
    }
    return { file, issues: lintNodes(data, ctx, file) };
  });
  return { files: results, total: results.reduce((n, r) => n + r.issues.length, 0) };
}
