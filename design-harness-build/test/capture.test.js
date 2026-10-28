import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { chmodSync, readFileSync, existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { captureReferences, captureName, extractUrls } from '../lib/capture.js';
import { makeProject, openStage } from './helpers.js';

const BIN = fileURLToPath(new URL('../bin/design-harness.js', import.meta.url));

// --screenshot=<경로> 에 가짜 PNG 를 쓰고 받은 인자를 기록하는 브라우저 대역.
// URL 에 "fail" 이 들어 있으면 아무것도 쓰지 않고 실패한다.
function fakeBrowser(root) {
  const path = join(root, 'fake-chrome.mjs');
  writeFileSync(
    path,
    `#!${process.execPath}
import { writeFileSync, appendFileSync } from 'node:fs';
const args = process.argv.slice(2);
appendFileSync(${JSON.stringify(join(root, 'calls.log'))}, JSON.stringify(args) + '\\n');
const url = args[args.length - 1];
if (url.includes('fail')) { console.error('net::ERR_NAME_NOT_RESOLVED'); process.exit(1); }
writeFileSync(args.find((a) => a.startsWith('--screenshot=')).slice(13), 'PNG ' + url);
`,
  );
  chmodSync(path, 0o755);
  return path;
}
const calls = (root) => readFileSync(join(root, 'calls.log'), 'utf8').trim().split('\n').map((l) => JSON.parse(l));

test('URL 추출과 파일 이름', () => {
  assert.deepEqual(extractUrls('- [토스](https://toss.im/pricing).\n- https://www.figma.com/community, https://toss.im/pricing'), [
    'https://toss.im/pricing',
    'https://www.figma.com/community',
  ]);
  assert.equal(captureName('https://www.Example.com/a/b?x=1#top', 'desktop'), 'example.com-a-b-x-1.png');
  assert.equal(captureName('https://example.com/', 'mobile'), 'example.com-mobile.png');
});

test('links.md 의 URL 을 캡처하고 captures.json 에 남긴다', (t) => {
  const { root, dir, write } = makeProject(t);
  openStage(dir, write, 'research');
  write('02-research/references/links.md', '# 참고\n- https://a.example/home 홈 화면\n- https://b.example/\n');
  const browser = fakeBrowser(root);
  const now = () => new Date('2026-10-27T06:00:00Z');
  const r = captureReferences(dir, { browser, now });
  assert.deepEqual(r.added, []);
  assert.deepEqual(r.results.map((x) => [x.file, x.status]), [['a.example-home.png', 'captured'], ['b.example.png', 'captured']]);
  const refs = join(dir, '02-research/references');
  assert.equal(readFileSync(join(refs, 'a.example-home.png'), 'utf8'), 'PNG https://a.example/home');
  const index = JSON.parse(readFileSync(join(refs, 'captures.json'), 'utf8'));
  assert.deepEqual(Object.keys(index), ['a.example-home.png', 'b.example.png']);
  assert.equal(index['b.example.png'].url, 'https://b.example/');
  assert.equal(index['b.example.png'].width, 1440);
  const args = calls(root)[0];
  assert.ok(args.includes('--headless=new'));
  assert.ok(args.includes('--window-size=1440,900'));
  assert.ok(args.some((a) => a.startsWith('--user-data-dir=')));
});

test('이미 있으면 건너뛰고, --force 면 다시 찍고, 새 URL 은 links.md 에 덧붙인다', (t) => {
  const { root, dir, write } = makeProject(t);
  openStage(dir, write, 'research');
  write('02-research/references/links.md', '- https://a.example/');
  const browser = fakeBrowser(root);
  captureReferences(dir, { browser });
  let r = captureReferences(dir, { browser });
  assert.equal(r.results[0].status, 'skipped');
  r = captureReferences(dir, { browser, force: true, urls: ['https://a.example/', 'https://c.example/x'], viewport: 'mobile' });
  assert.deepEqual(r.added, ['https://c.example/x']);
  assert.deepEqual(r.results.map((x) => [x.file, x.status]), [['a.example-mobile.png', 'captured'], ['c.example-x-mobile.png', 'captured']]);
  assert.equal(readFileSync(join(dir, '02-research/references/links.md'), 'utf8'), '- https://a.example/\n- https://c.example/x\n');
  assert.ok(calls(root).at(-1).includes('--window-size=390,844'));
});

test('실패한 캡처는 이유와 함께 알리고 나머지는 계속한다 (CLI 종료 코드 1)', (t) => {
  const { root, dir, write } = makeProject(t);
  openStage(dir, write, 'research');
  write('02-research/references/links.md', '- https://fail.example/\n- https://ok.example/\n');
  const browser = fakeBrowser(root);
  const r = spawnSync(process.execPath, [BIN, 'refs:capture', '--browser', browser], { cwd: root, encoding: 'utf8' });
  assert.equal(r.status, 1, r.stderr);
  assert.match(r.stdout, /실패: https:\/\/fail\.example\/ → 02-research\/references\/fail\.example\.png — 캡처 파일이 만들어지지 않음 \(종료 코드 1\): net::ERR_NAME_NOT_RESOLVED/);
  assert.match(r.stdout, /캡처: https:\/\/ok\.example\//);
  const index = JSON.parse(readFileSync(join(dir, '02-research/references/captures.json'), 'utf8'));
  assert.deepEqual(Object.keys(index), ['ok.example.png']);
});

test('거부하는 경우', (t) => {
  const { root, dir, write } = makeProject(t);
  const browser = fakeBrowser(root);
  assert.throws(() => captureReferences(dir, { browser, urls: ['https://a.example/'] }), /앞 단계가 끝나지 않아 참고 화면을 캡처할 수 없습니다: PRD\(prd\)/);
  openStage(dir, write, 'research');
  assert.throws(() => captureReferences(dir, { browser }), /캡처할 URL 이 없습니다/);
  assert.throws(() => captureReferences(dir, { browser, urls: ['file:///etc/passwd'] }), /http\(s\) 주소만/);
  assert.throws(() => captureReferences(dir, { browser, urls: ['https://a.example/'], viewport: 'tv' }), /알 수 없는 화면 크기/);
  assert.throws(() => captureReferences(dir, { browser: join(root, 'nope'), urls: ['https://a.example/'] }), /브라우저 실행 파일이 없습니다/);
  assert.ok(!existsSync(join(dir, '02-research/references/links.md')));
});
