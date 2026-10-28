import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync, appendFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, delimiter } from 'node:path';
import { HarnessError } from './errors.js';
import { assertStageOpen } from './gate.js';
import { isoWithOffset } from './approve.js';

// 리서치 참고 화면을 헤드리스 Chrome 으로 캡처해 02-research/references/ 에 PNG 로 둔다.
// 캡처한 URL 과 시각은 references/captures.json 에 남겨 research.md 의 출처로 쓸 수 있게 한다.

export const REFERENCES_DIR = '02-research/references';
export const LINKS_FILE = 'links.md';
export const CAPTURES_FILE = 'captures.json';

export const VIEWPORTS = {
  desktop: { width: 1440, height: 900 },
  mobile: { width: 390, height: 844 },
};

const URL_RE = /https?:\/\/[^\s<>()\[\]"'`]+/g;

export function extractUrls(text) {
  return [...new Set((text.match(URL_RE) ?? []).map((u) => u.replace(/[.,;:!?]+$/, '')))];
}

// https://www.example.com/pricing?a=1 → example.com-pricing-a-1
export function captureName(url, viewport) {
  const u = new URL(url);
  const base = `${u.hostname.replace(/^www\./, '')}${u.pathname}${u.search}`
    .toLowerCase()
    .replace(/[^a-z0-9가-힣.]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/, '');
  return `${base}${viewport === 'desktop' ? '' : `-${viewport}`}.png`;
}

const BROWSER_CANDIDATES = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
];
const BROWSER_COMMANDS = ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser', 'microsoft-edge'];

export function findBrowser(explicit = process.env.CHROME_PATH) {
  if (explicit) {
    if (!existsSync(explicit)) throw new HarnessError(`브라우저 실행 파일이 없습니다: ${explicit}`);
    return explicit;
  }
  for (const p of BROWSER_CANDIDATES) if (existsSync(p)) return p;
  for (const dir of (process.env.PATH ?? '').split(delimiter)) {
    for (const cmd of BROWSER_COMMANDS) if (dir && existsSync(join(dir, cmd))) return join(dir, cmd);
  }
  throw new HarnessError('Chrome 계열 브라우저를 찾지 못했습니다. CHROME_PATH 환경 변수나 --browser 로 실행 파일을 지정하세요.');
}

function screenshot(browser, url, out, { width, height }, timeoutMs) {
  const profile = mkdtempSync(join(tmpdir(), 'design-harness-chrome-'));
  try {
    const r = spawnSync(
      browser,
      [
        '--headless=new',
        '--disable-gpu',
        '--hide-scrollbars',
        '--no-first-run',
        '--no-default-browser-check',
        `--user-data-dir=${profile}`,
        `--window-size=${width},${height}`,
        `--screenshot=${out}`,
        url,
      ],
      { encoding: 'utf8', timeout: timeoutMs },
    );
    if (r.error) return r.error.code === 'ETIMEDOUT' ? `${timeoutMs / 1000}초 안에 끝나지 않음` : r.error.message;
    if (!existsSync(out) || statSync(out).size === 0) {
      return `캡처 파일이 만들어지지 않음 (종료 코드 ${r.status})${r.stderr ? `: ${r.stderr.trim().split('\n').pop()}` : ''}`;
    }
    return null;
  } finally {
    rmSync(profile, { recursive: true, force: true });
  }
}

// urls 를 주면 그것만, 안 주면 references/links.md 의 모든 URL 을 캡처한다.
// 새로 받은 URL 은 links.md 에 덧붙여 출처 목록이 캡처와 어긋나지 않게 한다.
export function captureReferences(
  projectDir,
  { urls = [], viewport = 'desktop', force = false, browser, timeoutMs = 60000, now = () => new Date() } = {},
) {
  assertStageOpen(projectDir, 'research', '참고 화면을 캡처할 수 없습니다');
  const size = VIEWPORTS[viewport];
  if (!size) throw new HarnessError(`알 수 없는 화면 크기입니다: ${viewport} (가능한 값: ${Object.keys(VIEWPORTS).join(', ')})`);

  const dir = join(projectDir, REFERENCES_DIR);
  const linksPath = join(dir, LINKS_FILE);
  const known = existsSync(linksPath) ? extractUrls(readFileSync(linksPath, 'utf8')) : [];
  for (const u of urls) {
    if (!/^https?:\/\//.test(u)) throw new HarnessError(`http(s) 주소만 캡처할 수 있습니다: ${u}`);
  }
  const targets = urls.length > 0 ? [...new Set(urls)] : known;
  if (targets.length === 0) {
    throw new HarnessError(`캡처할 URL 이 없습니다. ${REFERENCES_DIR}/${LINKS_FILE} 에 적거나 인자로 주세요.`);
  }
  const bin = findBrowser(browser);

  mkdirSync(dir, { recursive: true });
  const added = targets.filter((u) => !known.includes(u));
  if (added.length > 0) {
    const prefix = existsSync(linksPath) && !readFileSync(linksPath, 'utf8').endsWith('\n') ? '\n' : '';
    appendFileSync(linksPath, prefix + added.map((u) => `- ${u}\n`).join(''));
  }

  const indexPath = join(dir, CAPTURES_FILE);
  const index = existsSync(indexPath) ? JSON.parse(readFileSync(indexPath, 'utf8')) : {};
  const results = [];
  for (const url of targets) {
    const file = captureName(url, viewport);
    const out = join(dir, file);
    if (!force && existsSync(out)) {
      results.push({ url, file, status: 'skipped' });
      continue;
    }
    const error = screenshot(bin, url, out, size, timeoutMs);
    if (error) {
      results.push({ url, file, status: 'failed', error });
      continue;
    }
    index[file] = { url, viewport, width: size.width, height: size.height, capturedAt: isoWithOffset(now()) };
    results.push({ url, file, status: 'captured' });
  }
  const sorted = Object.fromEntries(Object.entries(index).sort(([a], [b]) => a.localeCompare(b)));
  writeFileSync(indexPath, JSON.stringify(sorted, null, 2) + '\n');
  return { dir: REFERENCES_DIR, added, results };
}
