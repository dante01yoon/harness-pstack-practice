// 서버(프록시): Open API를 대신 불러 화면과 같은 모양으로 돌려주고, 인증키는 어디로도 내보내지 않는다.
// Open API 자리에는 data/parking.json을 돌려주는 가짜 서버를 세운다.
import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createApp } from '../server/index.mjs';
import { response, html } from './harness.mjs';

const KEY = 'test0key0not0real0000000000';

async function listen(server) {
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  return `http://127.0.0.1:${server.address().port}`;
}

// reply(path): 가짜 Open API가 돌려줄 [상태, 본문](Promise도 됨). null이면 연결을 끊는다.
// options: createApp에 더 넘길 값(ttlMs, now).
async function start(reply, options = {}) {
  const seen = [];
  const upstream = http.createServer(async (req, res) => {
    seen.push(req.url);
    const out = await reply(req.url);
    if (!out) return req.socket.destroy();
    res.writeHead(out[0], { 'content-type': 'application/json' }).end(JSON.stringify(out[1]));
  });
  const logs = [];
  const app = createApp({ key: KEY, upstream: await listen(upstream), log: (m) => logs.push(String(m)), ...options });
  const base = await listen(app);
  const get = async (path) => {
    const res = await fetch(base + path);
    return { status: res.status, type: res.headers.get('content-type'), text: await res.text() };
  };
  test.after(() => { app.close(); upstream.close(); });
  return { get, seen, logs };
}

test('/api/parking은 Open API 응답을 화면이 읽는 모양 그대로 돌려준다', async () => {
  const { get, seen } = await start(() => [200, response]);
  const r = await get('/api/parking');
  assert.equal(r.status, 200);
  assert.deepEqual(JSON.parse(r.text), response);
  assert.deepEqual(seen, [`/${KEY}/json/GetParkingInfo/1/1000/`]);
  assert.ok(!r.text.includes(KEY));
});

test('RESULT.CODE가 INFO-000이 아니면 502이고 키가 응답·로그에 없다', async () => {
  const { get, logs } = await start(() => [200, { RESULT: { CODE: 'INFO-100', MESSAGE: '인증키가 유효하지 않습니다.' } }]);
  const r = await get('/api/parking');
  assert.equal(r.status, 502);
  assert.ok(!r.text.includes(KEY));
  assert.ok(logs.length > 0 && logs.every((l) => !l.includes(KEY)));
});

test('Open API에 닿지 못하면 502이고 키가 응답·로그에 없다', async () => {
  const { get, logs } = await start(() => null);
  const r = await get('/api/parking');
  assert.equal(r.status, 502);
  assert.ok(!r.text.includes(KEY));
  assert.ok(logs.length > 0 && logs.every((l) => !l.includes(KEY)));
});

test('Open API 응답에 키가 섞여 오면 내보내지 않는다', async () => {
  const leaked = structuredClone(response);
  leaked.GetParkingInfo.RESULT.MESSAGE = `요청 ${KEY}`;
  const { get } = await start(() => [200, leaked]);
  const r = await get('/api/parking');
  assert.equal(r.status, 502);
  assert.ok(!r.text.includes(KEY));
});

test('받은 행 수가 list_total_count보다 적으면 일부만 보여 주지 않는다', async () => {
  const cut = structuredClone(response);
  cut.GetParkingInfo.row.pop();
  const { get } = await start(() => [200, cut]);
  assert.equal((await get('/api/parking')).status, 502);
});

test('화면은 /에서 index.html을 주고, 그 밖의 파일(.env 포함)은 주지 않는다', async () => {
  const { get } = await start(() => [200, response]);
  const page = await get('/');
  assert.equal(page.status, 200);
  assert.match(page.type, /text\/html/);
  assert.equal(page.text, html);
  for (const path of ['/.env', '/data/parking.json', '/server/index.mjs', '/../.env']) {
    assert.equal((await get(path)).status, 404, path);
  }
});

test('화면은 저장해 둔 응답이 아니라 서버의 /api/parking을 읽는다', () => {
  assert.match(html, /const DATA_URL = 'api\/parking'/);
  assert.doesNotMatch(html, /data\/parking\.json/);
});

test('Open API 응답은 30초 동안 저장해 두고 같이 쓴다', async () => {
  let t = 1_000_000;
  const { get, seen } = await start(() => [200, response], { now: () => t });
  assert.equal((await get('/api/parking')).status, 200);
  t += 30_000 - 1;
  const r = await get('/api/parking');
  assert.equal(r.status, 200);
  assert.deepEqual(JSON.parse(r.text), response);
  assert.equal(seen.length, 1);
});

test('30초가 지나면 Open API를 다시 부른다', async () => {
  let t = 1_000_000;
  const { get, seen } = await start(() => [200, response], { now: () => t });
  await get('/api/parking');
  t += 30_000;
  assert.equal((await get('/api/parking')).status, 200);
  assert.equal(seen.length, 2);
});

test('실패한 불러오기는 저장해 두지 않는다', async () => {
  let calls = 0;
  const { get, seen } = await start(() => (++calls === 1 ? null : [200, response]), { now: () => 1_000_000 });
  assert.equal((await get('/api/parking')).status, 502);
  assert.equal((await get('/api/parking')).status, 200);
  assert.equal(seen.length, 2);
});

test('동시에 온 요청은 Open API를 한 번만 불러 같은 응답을 받는다', async () => {
  const { get, seen } = await start(() => new Promise((r) => setTimeout(() => r([200, response]), 50)));
  const all = await Promise.all([get('/api/parking'), get('/api/parking'), get('/api/parking')]);
  assert.deepEqual(all.map((r) => r.status), [200, 200, 200]);
  assert.ok(all.every((r) => r.text === all[0].text));
  assert.equal(seen.length, 1);
});
