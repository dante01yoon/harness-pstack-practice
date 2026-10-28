import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

// 05-design-system/ 의 tokens.json, components.json, copy.json 을 읽고 검사한다.
//
// tokens.json   { "color": { "primary": "#1a73e8" }, "fontSize": { "body": "16px" }, ... }
//               그룹 → { 이름: 값 } 한 단계만 둔다. color, fontSize 는 반드시 있어야 한다.
// components.json { "Button": { "description": "...", "variants": ["default", "disabled"] } }
// copy.json     { "terms": [{ "use": "로그인", "avoid": ["사인인"] }],
//                 "banned": ["클릭하세요", { "phrase": "오류가 발생했습니다", "reason": "원인과 할 일을 적는다" }],
//                 "messages": { "login.failed": "이메일 또는 비밀번호가 맞지 않아요" } }

export const DESIGN_SYSTEM_DIR = '05-design-system';
export const ROOT_FONT_PX = 16;

export const TOKEN_GROUPS = {
  color: { title: '색', kind: 'color', required: true },
  fontSize: { title: '글자 크기', kind: 'length', required: true },
  fontFamily: { title: '글꼴', kind: 'text' },
  fontWeight: { title: '글자 굵기', kind: 'text' },
  lineHeight: { title: '줄 높이', kind: 'text' },
  spacing: { title: '간격', kind: 'length' },
  radius: { title: '모서리 반경', kind: 'length' },
  shadow: { title: '그림자', kind: 'text' },
};

const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const nonEmptyString = (v) => typeof v === 'string' && v.trim() !== '';

// ---- 값 해석 ----

const clamp255 = (n) => Math.max(0, Math.min(255, Math.round(n)));
const hex2 = (n) => clamp255(n).toString(16).padStart(2, '0');

function channel(s) {
  return s.endsWith('%') ? (parseFloat(s) * 255) / 100 : parseFloat(s);
}
function alpha(s) {
  if (s === undefined) return 255;
  return s.endsWith('%') ? (parseFloat(s) * 255) / 100 : parseFloat(s) * 255;
}

function hslToRgb(h, s, l) {
  h = (((h % 360) + 360) % 360) / 360;
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const f = (t) => {
    t = (t + 1) % 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return s === 0 ? [l * 255, l * 255, l * 255] : [f(h + 1 / 3) * 255, f(h) * 255, f(h - 1 / 3) * 255];
}

// 색 표기를 #rrggbbaa 로 맞춘다. 해석할 수 없으면 null.
export function normalizeColor(value) {
  if (typeof value !== 'string') return null;
  const v = value.trim().toLowerCase();
  let m = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/.exec(v);
  if (m) {
    let h = m[1];
    if (h.length <= 4) h = [...h].map((c) => c + c).join('');
    return '#' + (h.length === 6 ? h + 'ff' : h);
  }
  m = /^(rgba?|hsla?)\(\s*([^)]*)\)$/.exec(v);
  if (!m) return null;
  const parts = m[2].split(/\s*[,/]\s*|\s+/).filter(Boolean);
  if (parts.length < 3 || parts.length > 4) return null;
  if (!parts.every((p) => /^-?\d*\.?\d+(%|deg)?$/.test(p))) return null;
  let rgb;
  if (m[1].startsWith('rgb')) rgb = parts.slice(0, 3).map(channel);
  else rgb = hslToRgb(parseFloat(parts[0]), parseFloat(parts[1]) / 100, parseFloat(parts[2]) / 100);
  return '#' + rgb.map(hex2).join('') + hex2(alpha(parts[3]));
}

// 길이를 px 로 바꾼다. 숫자만 있으면 px 로 본다. em·% 처럼 맥락에 따라 달라지는 단위는 null.
export function lengthToPx(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string') return null;
  const m = /^(-?\d*\.?\d+)(px|rem|pt)?$/.exec(value.trim().toLowerCase());
  if (!m) return null;
  const n = parseFloat(m[1]);
  if (m[2] === 'rem') return n * ROOT_FONT_PX;
  if (m[2] === 'pt') return (n * 4) / 3;
  return n;
}

// ---- 파일별 검사 ----

export function validateTokens(data) {
  const errors = [];
  if (!isPlainObject(data)) return ['최상위가 객체여야 합니다'];
  for (const [group, spec] of Object.entries(TOKEN_GROUPS)) {
    if (spec.required && !(group in data)) errors.push(`"${group}" 그룹이 없습니다`);
  }
  for (const [group, entries] of Object.entries(data)) {
    const spec = TOKEN_GROUPS[group];
    if (!spec) {
      errors.push(`알 수 없는 그룹 "${group}" (가능한 값: ${Object.keys(TOKEN_GROUPS).join(', ')})`);
      continue;
    }
    if (!isPlainObject(entries)) {
      errors.push(`"${group}" 는 { 이름: 값 } 객체여야 합니다`);
      continue;
    }
    if (spec.required && Object.keys(entries).length === 0) errors.push(`"${group}" 그룹이 비어 있습니다`);
    for (const [name, value] of Object.entries(entries)) {
      const where = `${group}.${name}`;
      if (spec.kind === 'color' && normalizeColor(value) === null) {
        errors.push(`${where}: 색으로 해석할 수 없습니다 (${JSON.stringify(value)})`);
      } else if (spec.kind === 'length' && lengthToPx(value) === null) {
        errors.push(`${where}: px·rem·pt 길이나 숫자여야 합니다 (${JSON.stringify(value)})`);
      } else if (spec.kind === 'text' && !nonEmptyString(value) && typeof value !== 'number') {
        errors.push(`${where}: 문자열이나 숫자여야 합니다 (${JSON.stringify(value)})`);
      }
    }
  }
  return errors;
}

export function validateComponents(data) {
  if (!isPlainObject(data)) return ['최상위가 { 컴포넌트이름: {...} } 객체여야 합니다'];
  const errors = [];
  if (Object.keys(data).length === 0) errors.push('컴포넌트가 하나도 없습니다');
  for (const [name, comp] of Object.entries(data)) {
    if (!isPlainObject(comp)) {
      errors.push(`${name}: 객체여야 합니다`);
      continue;
    }
    if (!nonEmptyString(comp.description)) errors.push(`${name}.description: 설명이 없습니다`);
    if (!Array.isArray(comp.variants) || comp.variants.length === 0) {
      errors.push(`${name}.variants: 상태(variant) 목록이 없습니다`);
    } else if (!comp.variants.every(nonEmptyString)) {
      errors.push(`${name}.variants: 비어 있지 않은 문자열 목록이어야 합니다`);
    }
  }
  return errors;
}

export function validateCopy(data) {
  if (!isPlainObject(data)) return ['최상위가 객체여야 합니다'];
  const errors = [];
  for (const key of Object.keys(data)) {
    if (!['terms', 'banned', 'messages'].includes(key)) errors.push(`알 수 없는 키 "${key}" (가능한 값: terms, banned, messages)`);
  }
  if (data.terms !== undefined) {
    if (!Array.isArray(data.terms)) errors.push('terms: 배열이어야 합니다');
    else
      data.terms.forEach((t, i) => {
        if (!isPlainObject(t) || !nonEmptyString(t.use)) errors.push(`terms[${i}].use: 쓸 용어가 없습니다`);
        else if (!Array.isArray(t.avoid) || !t.avoid.every(nonEmptyString))
          errors.push(`terms[${i}].avoid: 피할 용어 문자열 목록이어야 합니다`);
      });
  }
  if (data.banned !== undefined) {
    if (!Array.isArray(data.banned)) errors.push('banned: 배열이어야 합니다');
    else
      data.banned.forEach((b, i) => {
        if (!nonEmptyString(b) && !(isPlainObject(b) && nonEmptyString(b.phrase)))
          errors.push(`banned[${i}]: 문자열이나 { "phrase": ... } 여야 합니다`);
      });
  }
  if (data.messages !== undefined) {
    if (!isPlainObject(data.messages)) errors.push('messages: { 키: 문구 } 객체여야 합니다');
    else
      for (const [k, v] of Object.entries(data.messages)) if (!nonEmptyString(v)) errors.push(`messages.${k}: 문구가 비어 있습니다`);
  }
  return errors;
}

// copy.json 에서 화면에 나오면 안 되는 문구 목록을 뽑는다. terms.avoid 도 금지 문구로 친다.
export function forbiddenPhrases(copy) {
  const out = [];
  for (const b of copy.banned ?? []) {
    if (typeof b === 'string') out.push({ phrase: b });
    else out.push({ phrase: b.phrase, reason: b.reason });
  }
  for (const t of copy.terms ?? []) for (const a of t.avoid) out.push({ phrase: a, use: t.use });
  return out;
}

const FILES = [
  { key: 'tokens', file: 'tokens.json', validate: validateTokens },
  { key: 'components', file: 'components.json', validate: validateComponents },
  { key: 'copy', file: 'copy.json', validate: validateCopy },
];

// 세 파일을 읽어 { tokens, components, copy, errors } 를 돌려준다.
// errors 는 "05-design-system/<파일>: <내용>" 형태. 파일이 없거나 깨진 것도 errors 에 담는다.
export function loadDesignSystem(projectDir) {
  const result = { errors: [] };
  for (const { key, file, validate } of FILES) {
    const rel = `${DESIGN_SYSTEM_DIR}/${file}`;
    const abs = join(projectDir, DESIGN_SYSTEM_DIR, file);
    if (!existsSync(abs)) {
      result.errors.push(`${rel} 없음`);
      continue;
    }
    let data;
    try {
      data = JSON.parse(readFileSync(abs, 'utf8'));
    } catch (err) {
      result.errors.push(`${rel} JSON 형식 오류 (${err.message})`);
      continue;
    }
    const errors = validate(data);
    result.errors.push(...errors.map((e) => `${rel}: ${e}`));
    if (errors.length === 0) result[key] = data;
  }
  return result;
}
