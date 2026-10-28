import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';

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

// 각 단계의 필수 산출물을 채운다.
export const FILL = {
  prd: (w) => { w('01-prd/prd.md'); w('01-prd/open-questions.md'); },
  research: (w) => { w('02-research/research.md'); w('02-research/references/links.md'); w('02-research/insights.md'); },
  ia: (w) => { w('03-ia/sitemap.md'); w('03-ia/screens.md'); w('03-ia/flows.md'); },
  wireframe: (w) => { w('04-wireframe/S01.md'); w('04-wireframe/S01.svg', '<svg/>'); },
  'design-system': (w) => { w('05-design-system/tokens.json', '{"color":{}}'); w('05-design-system/components.md'); w('05-design-system/principles.md'); },
  figma: (w) => { w('06-figma/figma.md'); w('06-figma/node-map.json', '{}'); },
  verify: (w) => { w('07-verify/report.md'); w('07-verify/issues.md'); },
  handoff: (w) => { w('08-handoff/handoff.md'); w('08-handoff/specs/S01.md'); w('08-handoff/tokens/tokens.css'); },
};
