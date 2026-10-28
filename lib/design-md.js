import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { HarnessError } from './errors.js';
import { DESIGN_SYSTEM_DIR, TOKEN_GROUPS, loadDesignSystem, forbiddenPhrases } from './design-system.js';
import { assertStageOpen } from './gate.js';

export const DESIGN_MD = 'DESIGN.md';

const cell = (v) => String(v).replace(/\|/g, '\\|').replace(/\n/g, ' ');
const table = (head, rows) =>
  [`| ${head.join(' | ')} |`, `| ${head.map(() => '---').join(' | ')} |`, ...rows.map((r) => `| ${r.map(cell).join(' | ')} |`)];

// tokens·components·copy 로 DESIGN.md 본문을 만든다. 같은 입력이면 항상 같은 결과가 나온다
// (check 가 DESIGN.md 가 JSON 과 맞는지 다시 만들어 비교하기 때문).
export function renderDesignMd({ tokens, components, copy }) {
  const out = [
    '# 디자인 시스템',
    '',
    '> `design-harness design-md` 로 tokens.json, components.json, copy.json 에서 만든 파일입니다.',
    '> 직접 고치지 말고 JSON 을 고친 뒤 다시 만드세요. 원칙은 [principles.md](principles.md) 에 있습니다.',
    '',
    '## 토큰',
  ];
  for (const [group, spec] of Object.entries(TOKEN_GROUPS)) {
    const entries = Object.entries(tokens[group] ?? {});
    if (entries.length === 0) continue;
    out.push('', `### ${spec.title} (\`${group}\`)`, '');
    out.push(...table(['이름', '값', 'CSS 변수'], entries.map(([name, value]) => [`\`${name}\``, `\`${value}\``, `\`${cssVarName(group, name)}\``])));
  }

  out.push('', '## 컴포넌트', '');
  out.push(
    ...table(
      ['컴포넌트', '설명', '상태(variant)'],
      Object.entries(components).map(([name, c]) => [`**${name}**`, c.description, c.variants.join(', ')]),
    ),
  );

  out.push('', '## 문구');
  if (copy.terms?.length) {
    out.push('', '### 용어', '');
    out.push(...table(['쓰는 말', '쓰지 않는 말'], copy.terms.map((t) => [t.use, t.avoid.join(', ')])));
  }
  const banned = forbiddenPhrases({ banned: copy.banned });
  if (banned.length) {
    out.push('', '### 금지 문구', '');
    out.push(...table(['문구', '이유'], banned.map((b) => [b.phrase, b.reason ?? ''])));
  }
  const messages = Object.entries(copy.messages ?? {});
  if (messages.length) {
    out.push('', '### 메시지', '');
    out.push(...table(['키', '문구'], messages.map(([k, v]) => [`\`${k}\``, v])));
  }
  if (!copy.terms?.length && !banned.length && !messages.length) out.push('', '정의된 문구 규칙이 없습니다.');
  return out.join('\n') + '\n';
}

// 토큰 → CSS 변수 이름. fontSize.body → --font-size-body
export function cssVarName(group, name) {
  const kebab = (s) => s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').replace(/[^A-Za-z0-9-]+/g, '-').toLowerCase();
  return `--${kebab(group)}-${kebab(name)}`;
}

// check 에서 쓰는 검사: JSON 세 개가 올바르고 DESIGN.md 가 그 내용과 맞는지.
export function designMdProblems(projectDir) {
  const ds = loadDesignSystem(projectDir);
  if (ds.errors.length > 0) return ds.errors;
  const path = join(projectDir, DESIGN_SYSTEM_DIR, DESIGN_MD);
  const rel = `${DESIGN_SYSTEM_DIR}/${DESIGN_MD}`;
  if (!existsSync(path)) return [`${rel} 없음 — design-harness design-md 로 만드세요`];
  if (readFileSync(path, 'utf8') !== renderDesignMd(ds)) {
    return [`${rel} 이 JSON 내용과 다름 — design-harness design-md 로 다시 만드세요`];
  }
  return [];
}

export function writeDesignMd(projectDir) {
  assertStageOpen(projectDir, 'design-system', 'DESIGN.md 를 만들 수 없습니다');
  const ds = loadDesignSystem(projectDir);
  if (ds.errors.length > 0) {
    throw new HarnessError(`디자인 시스템 파일에 문제가 있어 DESIGN.md 를 만들 수 없습니다:\n${ds.errors.map((e) => `  - ${e}`).join('\n')}`);
  }
  const path = join(projectDir, DESIGN_SYSTEM_DIR, DESIGN_MD);
  writeFileSync(path, renderDesignMd(ds));
  return { path: `${DESIGN_SYSTEM_DIR}/${DESIGN_MD}`, ...ds };
}
