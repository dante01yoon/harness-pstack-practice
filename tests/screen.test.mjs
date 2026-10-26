// CLAUDE.md "항상 지킬 것"을 화면 출력으로 확인한다. 숫자는 모두 data/parking.json의 실제 값이다.
import test from 'node:test';
import assert from 'node:assert/strict';
import { open, row, rows, copy, html, kst, response } from './harness.mjs';

const SEJONG = '171721';   // 세종로: 실시간, 1260면 중 404대 → 빈자리 856
const BANGHWA = '172971';  // 방화역(동): 실시간, 67면 중 67대 → 계산값 0
const CHEONGGYE = '1235522'; // 청계3(남): PRK_STTS_YN=0
const updated = kst(row(SEJONG).NOW_PRK_VHCL_UPDT_TM);
const MIN = 60 * 1000;

test('빈자리 숫자에는 기준 시각이 함께 나온다', async () => {
  const app = await open({ now: updated + 5 * MIN });
  const r = app.rowOf(SEJONG);
  assert.match(r, />856</);
  assert.match(r, /07:55 기준/);
});

test('기준 시각이 20분 이내면 오래됨이 아니다', async () => {
  const app = await open({ now: updated + 19 * MIN });
  assert.doesNotMatch(app.rowOf(SEJONG), /20분 넘음/);
  assert.doesNotMatch(app.text(), /20분 넘게 지난 숫자가 있어요/);
});

test('기준 시각이 20분을 넘으면 행과 배너에 오래됨을 표시한다', async () => {
  const app = await open({ now: updated + 21 * MIN });
  assert.match(app.rowOf(SEJONG), /class="ts stale"[\s\S]*20분 넘음/);
  assert.match(app.text(), /20분 넘게 지난 숫자가 있어요/);
});

test('실시간 미연계는 "실시간 정보 없음"이고 0이나 빈자리 숫자로 보이지 않는다', async () => {
  const app = await open({ now: updated });
  const r = app.rowOf(CHEONGGYE);
  assert.match(r, /실시간 정보 없음/);
  assert.doesNotMatch(r, /빈자리|만차|avail-count|기준/);
});

test('실시간 미연계 상세도 빈자리 대신 "실시간 정보 없음"을 보여 준다', async () => {
  const app = await open({ now: updated, hash: `#/p/${CHEONGGYE}` });
  assert.match(app.text(), /실시간 정보 없음/);
  assert.match(app.text(), /빈자리 수를 보내지 않아요/);
  assert.doesNotMatch(app.screen(), /avail-count/);
});

test('계산값 0은 "만차"로 구분한다', async () => {
  const app = await open({ now: updated });
  const r = app.rowOf(BANGHWA);
  assert.match(r, /만차/);
  assert.match(r, /총 67면/);
});

test('비었거나 "*"인 값은 "정보 없음"으로 보여 준다', async () => {
  const lot = rows.find((r) => r.OPER_SE_NM !== '버스전용 주차장' && (!r.TELNO.trim() || r.TELNO.trim() === '*'));
  assert.ok(lot, '전화번호가 빈 실제 행이 있어야 한다');
  const app = await open({ now: updated, hash: `#/p/${lot.PKLT_CD}` });
  assert.match(app.text(), /전화 정보 없음/);
});

test('API 문자열은 이스케이프해서 넣는다', async () => {
  const body = structuredClone(response);
  body.GetParkingInfo.row[0].PKLT_NM = '<img src=x onerror=alert(1)>';
  const app = await open({ body, now: updated });
  assert.doesNotMatch(app.screen(), /<img src=x/);
  assert.match(app.screen(), /&lt;img src=x/);
});

test('처음 불러오기에 실패하면 다시 시도를 보여 준다', async () => {
  const app = await open({ body: null });
  assert.match(app.text(), /주차장 정보를 불러오지 못했어요/);
  assert.match(app.screen(), /data-act="retry"/);
});

test('새로고침이 실패해도 받아 둔 목록을 지우지 않고 언제 기준인지 알린다', async () => {
  const app = await open({ now: updated });
  const before = app.rowOf(SEJONG);
  app.serve(null);
  await app.click('refresh');
  assert.equal(app.rowOf(SEJONG), before);
  assert.match(app.text(), /새 정보를 불러오지 못했어요\. \d{2}:\d{2} 기준 목록을 보여 드려요/);
});

test('하단 출처 표시(공공누리 제1유형)가 있다', () => {
  assert.match(html, /<footer class="source">[\s\S]*출처: 서울 열린데이터광장[\s\S]*공공누리 제1유형[\s\S]*<\/footer>/);
});

test('어느 상태의 화면 글자에도 금지어가 없다', async () => {
  const screens = [
    await open({ now: updated + 5 * MIN }),
    await open({ now: updated + 21 * MIN }),
    await open({ body: null }),
    await open({ now: updated, hash: `#/p/${SEJONG}` }),
    await open({ now: updated + 21 * MIN, hash: `#/p/${SEJONG}` }),
    await open({ now: updated, hash: `#/p/${CHEONGGYE}` }),
    await open({ now: updated, hash: `#/p/${BANGHWA}` }),
  ].map((a) => a.text());
  const footer = /<footer[\s\S]*?<\/footer>/.exec(html)[0].replace(/<[^>]+>/g, ' ');
  for (const word of copy.banned) {
    for (const s of [...screens, footer]) assert.ok(!s.includes(word), `금지어 "${word}"`);
  }
});
