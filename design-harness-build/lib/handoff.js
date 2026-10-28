import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, basename } from 'node:path';
import { findStage, stageNumber } from './stages.js';
import { HarnessError } from './errors.js';
import { assertStageOpen } from './gate.js';
import { check, screenIds } from './check.js';
import { loadDesignSystem, TOKEN_GROUPS } from './design-system.js';
import { cssVarName, DESIGN_MD } from './design-md.js';
import { readReviews, summarize } from './review.js';
import { isoWithOffset } from './approve.js';

// 검증까지 끝난 프로젝트를 개발로 넘길 문서(08-handoff/HANDOFF.md)와 토큰 내보내기(tokens/)를 만든다.
// 화면별 스펙(specs/<화면ID>.md)은 사람이나 AI 가 따로 쓰고, 여기서는 빠진 것을 표시만 한다.

export const HANDOFF_MD = 'HANDOFF.md';

const STATUS_TEXT = {
  not_started: '시작 전',
  in_progress: '진행 중',
  done: '완료',
  approved: '승인됨',
  approval_invalid: '승인 무효',
};

const cell = (v) => String(v).replace(/\|/g, '\\|').replace(/\n/g, ' ');
const row = (cells) => `| ${cells.map(cell).join(' | ')} |`;

export function renderTokensCss(tokens) {
  const lines = ['/* design-harness handoff 로 05-design-system/tokens.json 에서 만든 파일 */', ':root {'];
  for (const group of Object.keys(TOKEN_GROUPS)) {
    for (const [name, value] of Object.entries(tokens[group] ?? {})) {
      const v = typeof value === 'number' && TOKEN_GROUPS[group].kind === 'length' ? `${value}px` : value;
      lines.push(`  ${cssVarName(group, name)}: ${v};`);
    }
  }
  lines.push('}');
  return lines.join('\n') + '\n';
}

function screenTitle(projectDir, id) {
  const path = join(projectDir, findStage('wireframe').dir, `${id}.md`);
  if (!existsSync(path)) return '';
  const h = /^#\s+(.+?)\s*$/m.exec(readFileSync(path, 'utf8'));
  return h ? h[1] : '';
}

export function renderHandoffMd(projectDir, { project, now }) {
  const status = check(projectDir);
  const reviews = readReviews(projectDir);
  const ds = loadDesignSystem(projectDir);
  const wf = findStage('wireframe');
  const ho = findStage('handoff');
  const ids = [...new Set([...screenIds(join(projectDir, wf.dir), '.md'), ...screenIds(join(projectDir, wf.dir), '.svg')])].sort();

  const out = [
    `# 핸드오프: ${project}`,
    '',
    `> \`design-harness handoff\` 로 ${isoWithOffset(now)} 에 만든 문서입니다. 산출물이 바뀌면 다시 만드세요.`,
    '',
    '## 단계 기록',
    '',
    row(['단계', '상태', '승인', '검토 점수']),
    row(['---', '---', '---', '---']),
  ];
  const staleReviews = [];
  for (const s of status.stages) {
    const stage = findStage(s.id);
    const approval = s.approval.state === 'valid' ? `${s.approval.by}, ${s.approval.at}` : s.needsApproval ? '-' : '필요 없음';
    const sum = summarize(projectDir, s.id, reviews);
    const stale = sum.reviews.filter((r) => r.stale);
    if (stale.length) staleReviews.push(`${stageNumber(stage)}. ${s.title}: 검토 ${stale.length}건 뒤 산출물이 바뀜 (평균에서 뺐음)`);
    const score = sum.count ? `${sum.average} / 5 (${sum.count}건)` : '-';
    const label = s.id === 'handoff' ? '이 문서' : STATUS_TEXT[s.status];
    out.push(row([`${stageNumber(stage)}. ${s.title}`, label, approval, score]));
  }

  out.push('', '## 화면', '', row(['화면ID', '이름', '와이어프레임', '스펙']), row(['---', '---', '---', '---']));
  const missingSpecs = [];
  for (const id of ids) {
    const svg = existsSync(join(projectDir, wf.dir, `${id}.svg`)) ? `[${id}.svg](../${wf.dir}/${id}.svg)` : '없음';
    const hasSpec = existsSync(join(projectDir, ho.dir, 'specs', `${id}.md`));
    if (!hasSpec) missingSpecs.push(id);
    out.push(row([id, screenTitle(projectDir, id), svg, hasSpec ? `[specs/${id}.md](specs/${id}.md)` : '**없음**']));
  }

  const dsDir = findStage('design-system').dir;
  out.push(
    '',
    '## 디자인 시스템',
    '',
    `- 정의: [${DESIGN_MD}](../${dsDir}/${DESIGN_MD}), 원칙: [principles.md](../${dsDir}/principles.md)`,
    '- 토큰: [tokens/tokens.css](tokens/tokens.css) (CSS 변수), [tokens/tokens.json](tokens/tokens.json)',
  );
  if (ds.components) out.push(`- 컴포넌트 ${Object.keys(ds.components).length}개: ${Object.keys(ds.components).join(', ')}`);
  out.push('- 화면에는 토큰 밖 색·글자 크기, 44px 보다 작은 버튼, copy.json 의 금지 문구를 쓰지 않습니다 (`design-harness lint:web` 으로 확인).');

  const figma = findStage('figma').dir;
  const verify = findStage('verify').dir;
  out.push(
    '',
    '## 참고 파일',
    '',
    `- 피그마: [figma.md](../${figma}/figma.md), 노드 매핑 [node-map.json](../${figma}/node-map.json)`,
    `- 검증: [report.md](../${verify}/report.md), 남은 문제 [issues.md](../${verify}/issues.md)`,
    `- PRD: [prd.md](../${findStage('prd').dir}/prd.md), 화면 흐름: [flows.md](../${findStage('ia').dir}/flows.md)`,
  );

  const todo = [...missingSpecs.map((id) => `specs/${id}.md 작성`), ...staleReviews];
  out.push('', '## 남은 일', '');
  if (todo.length) out.push(...todo.map((t) => `- ${t}`));
  else out.push('- 없음');
  return { text: out.join('\n') + '\n', missingSpecs };
}

export function writeHandoff(projectDir, { project = basename(projectDir), now = new Date() } = {}) {
  assertStageOpen(projectDir, 'handoff', '핸드오프 문서를 만들 수 없습니다');
  const ds = loadDesignSystem(projectDir);
  if (!ds.tokens) throw new HarnessError(`tokens.json 을 읽을 수 없습니다:\n${ds.errors.map((e) => `  - ${e}`).join('\n')}`);
  const dir = join(projectDir, findStage('handoff').dir);
  mkdirSync(join(dir, 'tokens'), { recursive: true });
  writeFileSync(join(dir, 'tokens', 'tokens.css'), renderTokensCss(ds.tokens));
  writeFileSync(join(dir, 'tokens', 'tokens.json'), JSON.stringify(ds.tokens, null, 2) + '\n');
  const { text, missingSpecs } = renderHandoffMd(projectDir, { project, now });
  writeFileSync(join(dir, HANDOFF_MD), text);
  const rel = findStage('handoff').dir;
  return { files: [`${rel}/${HANDOFF_MD}`, `${rel}/tokens/tokens.css`, `${rel}/tokens/tokens.json`], missingSpecs };
}
