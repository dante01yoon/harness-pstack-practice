import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { lintHtml, lintWeb, parseCss } from '../lib/lint-web.js';
import { normalizeColor, lengthToPx, forbiddenPhrases } from '../lib/design-system.js';
import { makeProject, FILL, TOKENS, COPY } from './helpers.js';

const BIN = fileURLToPath(new URL('../bin/design-harness.js', import.meta.url));
const ctx = {
  colors: new Set(Object.values(TOKENS.color).map(normalizeColor)),
  fontSizes: new Set(Object.values(TOKENS.fontSize).map(lengthToPx)),
  phrases: forbiddenPhrases(COPY),
};
const lint = (html) => lintHtml(html, ctx).map((i) => `${i.line} ${i.rule} ${i.message}`);

test('토큰과 같은 값은 표기가 달라도 통과한다', () => {
  assert.deepEqual(
    lint(`<style>
  body { color: #111111; background: #FFF; font-size: 1rem; }
  h1 { font: bold 24px/1.2 sans-serif; color: rgb(26 115 232); }
  small { font-size: 12px; } .x { color: var(--color-text); font-size: inherit; border-color: transparent }
  .rel { font-size: 0.875em; }
</style><p style="color: rgba(17,17,17,1)">안녕하세요</p><svg><path fill="#1a73e8" stroke="none"/></svg>`),
    [],
  );
});

test('토큰 밖 색을 줄 번호와 함께 찾는다', () => {
  assert.deepEqual(
    lint(`<style>
  .a { color: #333; }
  .b { border: 1px solid rgb(255, 0, 0); background-color: red; }
  /* .c { color: #abcdef } 주석은 무시 */
</style>
<div style="background: #1A73E8; color: hsl(0, 0%, 50%)">x</div>
<svg><rect fill="#00ff00"/></svg>`),
    [
      '2 color color: #333 — 토큰에 없는 색',
      '3 color border: rgb(255, 0, 0) — 토큰에 없는 색',
      '3 color background-color: red — 이름 색 대신 토큰 값을 쓰세요',
      '6 color color: hsl(0, 0%, 50%) — 토큰에 없는 색',
      '7 color fill: #00ff00 — 토큰에 없는 색',
    ],
  );
});

test('토큰 밖 글자 크기를 찾는다', () => {
  assert.deepEqual(
    lint(`<style>
@media (min-width: 600px) {
  h2 { font-size: 20px; }
}
@font-face { font-family: X; src: url(x.woff); }
p { font: 13px sans-serif; } em { font-size: large; }
</style><span style="font-size: 0.75rem">ok</span><svg><text font-size="15">t</text></svg>`),
    [
      '3 font-size font-size: 20px — 토큰에 없는 글자 크기 (토큰: 12, 16, 24px)',
      '6 font-size font: 13px — 토큰에 없는 글자 크기 (토큰: 12, 16, 24px)',
      '6 font-size font-size: large — 토큰에 없는 글자 크기',
      '7 font-size font-size: 15 — 토큰에 없는 글자 크기 (토큰: 12, 16, 24px)',
    ],
  );
});

test('44px 보다 작은 버튼을 찾는다', () => {
  assert.deepEqual(
    lint(`<style>
  button { height: 48px; }
  .small { height: 32px; }
  .wide-enough { min-height: 44px; }
  .icon { width: 2rem; height: 2rem; }
  .btn:hover { height: 10px; }
  nav > [role="button"] { height: 40px }
</style>
<button>기본</button>
<button class="small">작음</button>
<button class="small wide-enough">최소 높이로 보완</button>
<button class="icon" id="close">x</button>
<input type="submit" style="height: 30px" value="보내기">
<input type="text" style="height: 30px">
<a role="button">역할 버튼</a>
<div class="btn">패딩만</div>`),
    [
      '10 touch-target <button.small> 높이 32px — 44px 보다 작음',
      '12 touch-target <button#close> 높이 32px — 44px 보다 작음',
      '12 touch-target <button#close> 너비 32px — 44px 보다 작음',
      '13 touch-target <input> 높이 30px — 44px 보다 작음',
      '15 touch-target <a> 높이 40px — 44px 보다 작음',
    ],
  );
});

test('금지 문구를 본문과 속성에서 찾고, 스크립트·주석은 보지 않는다', () => {
  assert.deepEqual(
    lint(`<p>여기를 클릭하세요</p>
<!-- 사인인 -->
<script>const label = "사인인";</script>
<input placeholder="사인인 아이디">
<p>오류가
  발생했습니다</p>
<img alt="로그온 화면">`),
    [
      '1 copy 금지 문구 "클릭하세요"',
      '4 copy 금지 문구 "사인인" — "로그인"(으)로 쓰세요',
      '5 copy 금지 문구 "오류가\n  발생했습니다" — 원인과 할 일을 적는다',
      '7 copy 금지 문구 "로그온" — "로그인"(으)로 쓰세요',
    ],
  );
});

test('parseCss 는 중첩 @media 를 펼치고 @import 를 건너뛴다', () => {
  const rules = parseCss('@import url(a.css);\n@media screen { @supports (display: grid) { .a { color: red } } }\n.b{x:1}');
  assert.deepEqual(rules.map((r) => r.selector), ['.a', '.b']);
});

test('lintWeb 은 프로젝트 아래 HTML 을 모두 검사하고 CLI 는 문제가 있으면 1 로 끝난다', (t) => {
  const { root, dir, write } = makeProject(t);
  write('05-design-system/tokens.json', JSON.stringify(TOKENS));
  write('05-design-system/copy.json', JSON.stringify(COPY));
  write('screens/ok.html', '<p style="color:#111">로그인</p>');
  write('screens/bad.htm', '<button style="height:20px">사인인</button>');
  write('screens/notes.txt', '사인인');

  const result = lintWeb(dir);
  assert.deepEqual(result.files.map((f) => [f.file, f.issues.length]), [['screens/bad.htm', 2], ['screens/ok.html', 0]]);
  assert.equal(result.total, 2);

  let r = spawnSync(process.execPath, [BIN, 'lint:web'], { cwd: root, encoding: 'utf8' });
  assert.equal(r.status, 1, r.stderr);
  assert.match(r.stdout, /work\/demo\/screens\/bad\.htm:1 {2}\[터치 영역\] <button> 높이 20px — 44px 보다 작음/);
  assert.match(r.stdout, /\[문구\] 금지 문구 "사인인"/);
  assert.match(r.stdout, /HTML 2개, 문제 2건/);

  r = spawnSync(process.execPath, [BIN, 'lint:web', 'work/demo/screens/ok.html'], { cwd: root, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /HTML 1개, 문제 없음/);
});

test('검사 기준 파일이 없거나 틀리면 오류로 알린다', (t) => {
  const { dir, write } = makeProject(t);
  write('a.html', '<p>x</p>');
  assert.throws(() => lintWeb(dir), (err) => /tokens\.json 없음/.test(err.message) && /copy\.json 없음/.test(err.message) && !/components/.test(err.message));
  FILL['design-system'](write);
  assert.equal(lintWeb(dir, [`${dir}/a.html`]).total, 0);
  assert.throws(() => lintWeb(dir, [`${dir}/none.html`]), /파일이 없습니다/);
});
