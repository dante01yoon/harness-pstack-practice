import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { renderDesignMd } from '../lib/design-md.js';
import { approve } from '../lib/approve.js';
import { findStage } from '../lib/stages.js';

export const TOKENS = {
  color: { primary: '#1A73E8', text: '#111', bg: 'rgb(255, 255, 255)' },
  fontSize: { body: '16px', title: '1.5rem', caption: 12 },
  spacing: { md: '16px' },
  radius: { sm: 4 },
};
export const COMPONENTS = {
  Button: { description: '주요 동작', variants: ['default', 'hover', 'disabled'] },
  TextField: { description: '한 줄 입력', variants: ['default', 'error'] },
};
export const COPY = {
  terms: [{ use: '로그인', avoid: ['사인인', '로그온'] }],
  banned: ['클릭하세요', { phrase: '오류가 발생했습니다', reason: '원인과 할 일을 적는다' }],
  messages: { 'login.failed': '이메일 또는 비밀번호가 맞지 않아요' },
};
export const FIGMA_KEY = 'AbCdEf1234567890XyZ';
export const FIGMA_URL = `https://www.figma.com/design/${FIGMA_KEY}/Demo`;
const json = (v) => JSON.stringify(v, null, 2);

// 임시 루트에 work/<name>/ 프로젝트를 만든다.
export function makeProject(t, name = 'demo') {
  const root = mkdtempSync(join(tmpdir(), 'design-harness-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const dir = join(root, 'work', name);
  mkdirSync(dir, { recursive: true });
  const write = (rel, content = '내용\n') => {
    const abs = join(dir, rel);
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, content);
  };
  return { root, dir, write };
}

// stageId 앞 단계까지 산출물을 채우고 승인해서 그 단계를 연다.
export function openStage(dir, write, stageId) {
  for (const id of Object.keys(FILL)) {
    if (id === stageId) return;
    FILL[id](write);
    if (findStage(id).approval) approve(dir, id, { by: '홍길동' });
  }
}

// 각 단계의 필수 산출물을 채운다.
export const FILL = {
  prd: (w) => { w('01-prd/prd.md'); w('01-prd/open-questions.md'); },
  research: (w) => { w('02-research/research.md'); w('02-research/references/links.md'); w('02-research/insights.md'); },
  ia: (w) => { w('03-ia/sitemap.md'); w('03-ia/screens.md'); w('03-ia/flows.md'); },
  wireframe: (w) => { w('04-wireframe/S01.md'); w('04-wireframe/S01.svg', '<svg/>'); },
  'design-system': (w) => {
    w('05-design-system/tokens.json', json(TOKENS));
    w('05-design-system/components.json', json(COMPONENTS));
    w('05-design-system/copy.json', json(COPY));
    w('05-design-system/principles.md');
    w('05-design-system/DESIGN.md', renderDesignMd({ tokens: TOKENS, components: COMPONENTS, copy: COPY }));
  },
  figma: (w) => { w('06-figma/figma.json', json({ fileUrl: FIGMA_URL })); w('06-figma/figma.md'); w('06-figma/node-map.json', '{}'); },
  verify: (w) => { w('07-verify/report.md'); w('07-verify/issues.md'); },
  handoff: (w) => { w('08-handoff/HANDOFF.md'); w('08-handoff/specs/S01.md'); w('08-handoff/tokens/tokens.css'); },
};
