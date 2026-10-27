// CLAUDE.md "항상 지킬 것"을 화면 출력으로 확인한다. 숫자는 모두 data/parking.json의 실제 값이다.
import test from 'node:test';
import assert from 'node:assert/strict';
import { open, row, rows, copy, html, kst, response } from './harness.mjs';

const SEJONG = '171721';   // 세종로: 실시간, 1260면 중 404대 → 빈자리 856
const BANGHWA = '172971';  // 방화역(동): 실시간, 67면 중 67대 → 계산값 0
const CHEONGGYE = '1235522'; // 청계3(남): PRK_STTS_YN=0
const updated = kst(row(SEJONG).NOW_PRK_VHCL_UPDT_TM);
const MIN = 60 * 1000;

const FAVORITES = 'seoul-parking:favorites';
const favorites = (...ids) => ({ [FAVORITES]: JSON.stringify(ids) });
// 다음 불러오기 응답: 방화역(만차)의 주차 대수만 총 면수 − 1로 바꿔 빈자리 1면(알림 경계)을 만든다. 기준 시각은 실제 값 그대로.
const reopened = (change = () => {}) => {
  const body = structuredClone(response);
  const r = body.GetParkingInfo.row.find((x) => x.PKLT_CD === BANGHWA);
  r.NOW_PRK_VHCL_CNT = r.TPKCT - 1;
  change(r);
  return body;
};
const OPENING = '방화역(동) 공영주차장(시) 빈자리 1면 · 07:55 기준';
const anyOpening = /빈자리 [\d,]+면 · /;
const favoriteBtn = (app) => /<button[^>]*data-act="favorite"[^>]*>/.exec(app.screen())?.[0];

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

test('상세에서 즐겨찾기를 누르면 이 기기에 저장되고 목록 행에 별과 "즐겨찾기"가 보인다', async () => {
  const storage = {};
  const detail = await open({ now: updated, hash: `#/p/${BANGHWA}`, storage });
  assert.match(favoriteBtn(detail), /aria-pressed="false"/);
  assert.match(favoriteBtn(detail), /aria-label="즐겨찾기 추가"/);
  await detail.click('favorite');
  assert.match(favoriteBtn(detail), /aria-pressed="true"/);
  assert.match(favoriteBtn(detail), /aria-label="즐겨찾기 빼기"/);
  assert.deepEqual(JSON.parse(storage[FAVORITES]), [BANGHWA]);

  const list = await open({ now: updated, storage });
  assert.match(list.rowOf(BANGHWA), /#i-star-fill[\s\S]*<span class="sr-only">즐겨찾기<\/span>/);
  assert.doesNotMatch(list.rowOf(BANGHWA), /<button/, '행은 링크 하나로 남는다');
  assert.doesNotMatch(list.rowOf(SEJONG), /즐겨찾기/);

  await detail.click('favorite');
  assert.deepEqual(JSON.parse(storage[FAVORITES]), []);
  assert.doesNotMatch((await open({ now: updated, storage })).rowOf(BANGHWA), /즐겨찾기/);
});

test('저장된 즐겨찾기가 깨졌거나 저장소를 쓸 수 없어도 목록과 상세를 보여 준다', async () => {
  for (const storage of [{ [FAVORITES]: '{깨짐' }, { [FAVORITES]: '"172971"' }, null]) {
    const list = await open({ now: updated, storage });
    assert.match(list.rowOf(SEJONG), />856</);
    assert.doesNotMatch(list.rowOf(BANGHWA), /즐겨찾기/);
    const detail = await open({ now: updated, hash: `#/p/${BANGHWA}`, storage });
    await detail.click('favorite');
    assert.match(favoriteBtn(detail), /aria-pressed="true"/, '저장은 못 해도 이번 화면에서는 켜진다');
  }
});

test('화면이 보이면 30초마다 새로 불러온다', async () => {
  const app = await open({ now: updated + 5 * MIN });
  assert.deepEqual(app.intervals(), [30 * 1000]);
  assert.match(app.rowOf(BANGHWA), /만차/);
  app.serve(reopened());
  await app.tick();
  assert.doesNotMatch(app.rowOf(BANGHWA), /만차/);
  assert.match(app.rowOf(BANGHWA), /avail-count">1</);
});

test('검색창에 입력하는 동안에는 자동으로 불러오지 않고, 검색창을 벗어나면 다시 불러온다', async () => {
  const app = await open({ now: updated + 5 * MIN });
  app.serve(reopened());
  app.focus('q');
  await app.tick();
  assert.match(app.rowOf(BANGHWA), /만차/, '입력 중에 입력창을 다시 그리면 한글 조합이 끊긴다');
  app.focus(null);
  await app.tick();
  assert.doesNotMatch(app.rowOf(BANGHWA), /만차/);
});

test('화면이 숨겨져 있으면 자동으로 불러오지 않고, 다시 보일 때 30초가 지났으면 바로 불러온다', async () => {
  const app = await open({ now: updated + 5 * MIN });
  app.serve(reopened());
  await app.setVisibility('hidden');
  await app.tick();
  assert.match(app.rowOf(BANGHWA), /만차/, '숨겨져 있을 때는 불러오지 않는다');
  await app.setVisibility('visible');
  assert.match(app.rowOf(BANGHWA), /만차/, '30초가 안 지났으면 다시 보여도 불러오지 않는다');
  app.advance(30 * 1000);
  await app.setVisibility('hidden');
  await app.setVisibility('visible');
  assert.doesNotMatch(app.rowOf(BANGHWA), /만차/);
});

test('즐겨찾기한 주차장이 만차였다가 빈자리가 생기면 이름·빈자리 수·기준 시각을 배너로 알린다', async () => {
  for (const hash of ['', `#/p/${SEJONG}`]) {
    const app = await open({ now: updated + 5 * MIN, hash, storage: favorites(BANGHWA) });
    assert.doesNotMatch(app.text(), anyOpening);
    app.serve(reopened());
    await app.tick();
    assert.ok(app.text().includes(OPENING), `${hash || '목록'}: ${app.text().slice(0, 200)}`);
    assert.match(app.screen(), /role="status"[^>]*>[\s\S]*방화역\(동\)[\s\S]*data-act="dismiss" data-id="172971"[^>]*>닫기</);
  }
});

test('즐겨찾기가 아닌 주차장은 빈자리가 생겨도 알리지 않는다', async () => {
  const app = await open({ now: updated + 5 * MIN, storage: favorites(SEJONG) });
  app.serve(reopened());
  await app.tick();
  assert.doesNotMatch(app.rowOf(BANGHWA), /만차/, '새 응답은 받았다');
  assert.doesNotMatch(app.text(), anyOpening);
});

test('처음 불러올 때는 빈자리가 있어도 알리지 않는다', async () => {
  const app = await open({ body: reopened(), now: updated + 5 * MIN, storage: favorites(BANGHWA) });
  assert.match(app.rowOf(BANGHWA), /avail-count">1</);
  assert.doesNotMatch(app.text(), anyOpening);
});

test('20분 넘은 숫자이거나 실시간 정보 없음이면 알리지 않는다', async () => {
  const stale = await open({ now: updated + 21 * MIN, storage: favorites(BANGHWA) });
  stale.serve(reopened());
  await stale.tick();
  assert.match(stale.rowOf(BANGHWA), /20분 넘음/);
  assert.doesNotMatch(stale.text(), anyOpening);

  const noRealtime = await open({ now: updated + 5 * MIN, storage: favorites(BANGHWA, CHEONGGYE) });
  noRealtime.serve(reopened((r) => { r.PRK_STTS_YN = '0'; }));
  await noRealtime.tick();
  assert.match(noRealtime.rowOf(BANGHWA), /실시간 정보 없음/);
  assert.match(noRealtime.rowOf(CHEONGGYE), /실시간 정보 없음/);
  assert.doesNotMatch(noRealtime.text(), anyOpening);
});

test('빈자리 배너의 닫기를 누르면 배너가 사라진다', async () => {
  const app = await open({ now: updated + 5 * MIN, storage: favorites(BANGHWA) });
  app.serve(reopened());
  await app.tick();
  assert.ok(app.text().includes(OPENING));
  await app.click('dismiss', { id: BANGHWA });
  assert.doesNotMatch(app.text(), anyOpening);
  await app.tick();
  assert.doesNotMatch(app.text(), anyOpening, '빈자리가 이어지면 다시 알리지 않는다');
});

test('빈자리 배너의 숫자는 목록처럼 가장 새 응답을 따른다', async () => {
  const app = await open({ now: updated + 5 * MIN, storage: favorites(BANGHWA) });
  app.serve(reopened());
  await app.tick();
  assert.ok(app.text().includes(OPENING));
  app.serve(reopened((r) => { r.NOW_PRK_VHCL_CNT = r.TPKCT - 2; }));
  await app.tick();
  assert.match(app.rowOf(BANGHWA), /avail-count">2</);
  assert.ok(app.text().includes('방화역(동) 공영주차장(시) 빈자리 2면 · 07:55 기준'), app.text().slice(0, 300));
  assert.equal(app.text().match(/빈자리 [\d,]+면 · /g).length, 1, '배너는 하나');
});

test('빈자리 배너를 띄운 주차장이 다시 만차이거나 실시간 정보 없음이 되면 배너를 내린다', async () => {
  for (const [label, next, shown] of [
    ['만차', response, /만차/],
    ['실시간 정보 없음', reopened((r) => { r.PRK_STTS_YN = '0'; }), /실시간 정보 없음/],
  ]) {
    const app = await open({ now: updated + 5 * MIN, storage: favorites(BANGHWA) });
    app.serve(reopened());
    await app.tick();
    assert.ok(app.text().includes(OPENING));
    app.serve(next);
    await app.tick();
    assert.match(app.rowOf(BANGHWA), shown, label);
    assert.doesNotMatch(app.text(), anyOpening, label);
  }
});

test('빈자리 배너도 기준 시각이 20분을 넘으면 오래됨을 표시한다', async () => {
  const app = await open({ now: updated + 5 * MIN, storage: favorites(BANGHWA) });
  app.serve(reopened());
  await app.tick();
  app.advance(16 * MIN);
  await app.tick();
  assert.ok(app.text().includes(`${OPENING} · 20분 넘음`), app.text().slice(0, 300));
});

test('어느 상태의 화면 글자에도 금지어가 없다', async () => {
  const opening = await open({ now: updated + 5 * MIN, storage: favorites(BANGHWA) });
  opening.serve(reopened());
  await opening.tick();
  const screens = [
    opening,
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

// PRD F2: 구를 고르면 서버에서 그 구(와 즐겨찾기가 있는 구)만 받는다. 아래는 서버처럼 요청한 구의 행만 돌려주는 가짜 응답이다.
const guOf = (r) => r.ADDR.trim().split(/\s+/)[0];
const DISTRICTS = [...new Set(rows.map(guOf))].sort((a, b) => a.localeCompare(b, 'ko'));
const gusIn = (url) => new URL(url, 'http://x').searchParams.getAll('gu');
const byGu = (body = response) => (url) => {
  const gus = gusIn(url);
  if (!gus.length) return body;
  const out = structuredClone(body);
  out.GetParkingInfo.row = out.GetParkingInfo.row.filter((r) => gus.includes(guOf(r)));
  out.GetParkingInfo.list_total_count = out.GetParkingInfo.row.length;
  return out;
};
const flush = async () => { for (let i = 0; i < 5; i++) await new Promise(setImmediate); };
const chipsOf = (app) => [...app.screen().matchAll(/data-district="([^"]+)"/g)].map((m) => m[1]);

test('구를 고르면 그 구 주차장만 서버에서 받아 보여 주고, 전체로 돌아가면 전체를 받는다', async () => {
  const app = await open({ now: updated + 5 * MIN });
  app.serve(byGu());
  await app.pick('중구');
  assert.deepEqual(gusIn(app.fetched().at(-1)), ['중구']);
  assert.ok(app.rowOf(CHEONGGYE));
  assert.equal(app.rowOf(SEJONG), null);
  assert.match(app.text(), /중구 31곳/);

  await app.pick('전체');
  assert.equal(app.fetched().at(-1), 'api/parking');
  assert.ok(app.rowOf(SEJONG));
});

test('구 선택지는 받은 주차장과 상관없이 데이터의 23개 구 그대로다', async () => {
  const app = await open({ now: updated + 5 * MIN });
  app.serve(byGu());
  await app.pick('중구');
  assert.deepEqual(chipsOf(app), ['전체', ...DISTRICTS]);
  assert.equal(DISTRICTS.length, 23);
});

test('구를 골라도 즐겨찾기가 있는 구를 함께 받아 그 주차장의 빈자리 알림이 온다', async () => {
  const app = await open({ now: updated + 5 * MIN, storage: favorites(BANGHWA) });
  app.serve(byGu());
  await app.pick('중구');
  assert.deepEqual(gusIn(app.fetched().at(-1)).sort(), ['강서구', '중구'].sort());
  assert.equal(app.rowOf(BANGHWA), null, '목록에는 고른 구만');
  app.serve(byGu(reopened()));
  await app.tick();
  assert.ok(app.text().includes(OPENING), app.text().slice(0, 300));
});

test('아직 받지 않은 구로 바꾸면 받는 동안 불러오는 중을, 실패하면 다시 시도를 보여 준다', async () => {
  const app = await open({ now: updated + 5 * MIN });
  app.serve(byGu());
  await app.pick('중구');
  let release;
  app.serve(() => new Promise((r) => { release = r; }));
  await app.pick('종로구');
  assert.match(app.text(), /불러오는 중/);
  assert.doesNotMatch(app.text(), /찾는 주차장이 없어요/);
  release(null);
  await flush();
  assert.match(app.text(), /주차장 정보를 불러오지 못했어요/);
  assert.match(app.screen(), /data-act="retry"/);
  app.serve(byGu());
  await app.click('retry');
  await flush();
  assert.ok(app.rowOf(SEJONG));
});

test('구를 빨리 바꾸면 마지막에 고른 구의 응답만 쓴다', async () => {
  const app = await open({ now: updated + 5 * MIN });
  const waiting = {};
  app.serve((url) => new Promise((r) => { waiting[gusIn(url)[0]] = () => r(byGu()(url)); }));
  await app.pick('중구');
  await app.pick('종로구');
  waiting['종로구']();
  await flush();
  waiting['중구']();
  await flush();
  assert.ok(app.rowOf(SEJONG), app.text().slice(0, 300));
  assert.doesNotMatch(app.text(), /불러오는 중/);
});
