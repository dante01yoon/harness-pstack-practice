// 단계 정의. HARNESS-DESIGN.md 3·4장의 폴더 구조와 승인 필요 여부를 그대로 옮긴다.
// required 항목 종류:
//   file    — 비어 있지 않은 파일
//   json    — 파싱 가능한 JSON 파일
//   dir     — 파일이 하나 이상 있는 폴더
//   screens — 화면별 <화면ID>.md / <화면ID>.svg 쌍이 하나 이상
//   design-md — tokens·components·copy JSON 이 스키마에 맞고 DESIGN.md 가 그 내용과 같음
//   screen-specs — 와이어프레임의 모든 화면에 specs/<화면ID>.md 가 있음
export const STAGES = [
  {
    id: 'prd',
    title: 'PRD',
    dir: '01-prd',
    approval: true,
    required: [
      { kind: 'file', path: 'prd.md' },
      { kind: 'file', path: 'open-questions.md' },
    ],
  },
  {
    id: 'research',
    title: '리서치',
    dir: '02-research',
    approval: false,
    required: [
      { kind: 'file', path: 'research.md' },
      { kind: 'dir', path: 'references' },
      { kind: 'file', path: 'insights.md' },
    ],
  },
  {
    id: 'ia',
    title: '화면 구조',
    dir: '03-ia',
    approval: true,
    required: [
      { kind: 'file', path: 'sitemap.md' },
      { kind: 'file', path: 'screens.md' },
      { kind: 'file', path: 'flows.md' },
    ],
  },
  {
    id: 'wireframe',
    title: '와이어프레임',
    dir: '04-wireframe',
    approval: true,
    required: [{ kind: 'screens' }],
  },
  {
    id: 'design-system',
    title: '디자인 시스템',
    dir: '05-design-system',
    approval: true,
    required: [
      { kind: 'design-md' },
      { kind: 'file', path: 'principles.md' },
    ],
  },
  {
    id: 'figma',
    title: '피그마',
    dir: '06-figma',
    approval: false,
    required: [
      { kind: 'json', path: 'figma.json' },
      { kind: 'file', path: 'figma.md' },
      { kind: 'json', path: 'node-map.json' },
    ],
  },
  {
    id: 'verify',
    title: '검증',
    dir: '07-verify',
    approval: true,
    required: [
      { kind: 'file', path: 'report.md' },
      { kind: 'file', path: 'issues.md' },
    ],
  },
  {
    id: 'handoff',
    title: '핸드오프',
    dir: '08-handoff',
    approval: true,
    required: [
      { kind: 'file', path: 'HANDOFF.md' },
      { kind: 'screen-specs' },
      { kind: 'dir', path: 'tokens' },
    ],
  },
];

// 단계 폴더에 있어도 화면 산출물로 치지 않는 파일 (6장 되돌아가기 기록 등)
export const NON_SCREEN_FILES = new Set(['changelog.md']);

export function findStage(key) {
  const n = Number(key);
  if (Number.isInteger(n) && n >= 1 && n <= STAGES.length) return STAGES[n - 1];
  return STAGES.find((s) => s.id === key) ?? null;
}

export function stageNumber(stage) {
  return STAGES.indexOf(stage) + 1;
}
