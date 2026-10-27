// 서울시 Open API를 대신 부르는 작은 서버. 인증키는 process.env에서만 읽고 브라우저·로그로 내보내지 않는다.
// 띄우기: node --env-file=.env server/index.mjs  (PORT 기본 8000, HOST 기본 127.0.0.1)
import http from 'node:http';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const OPEN_API = 'http://openapi.seoul.go.kr:8088';
const INDEX = fileURLToPath(new URL('../index.html', import.meta.url));

// ttlMs: 성공한 Open API 응답을 다시 쓰는 시간(PRD F9). 화면이 30초마다 불러도 Open API는 그보다 자주 부르지 않는다.
export function createApp({ key, upstream = OPEN_API, log = console.error, ttlMs = 30_000, now = Date.now }) {
  const redact = (s) => String(s).replaceAll(key, '***');

  async function parking() {
    // 122곳이라 한 번(1~1000)이면 된다. 넘으면 아래 행 수 검사에서 실패한다.
    const res = await fetch(`${upstream}/${key}/json/GetParkingInfo/1/1000/`, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) throw new Error(`Open API HTTP ${res.status}`);
    const text = await res.text();
    if (text.includes(key)) throw new Error('Open API 응답에 인증키가 들어 있음');
    const body = JSON.parse(text);
    const info = body.GetParkingInfo;
    const code = info?.RESULT?.CODE ?? body.RESULT?.CODE;
    if (code !== 'INFO-000') throw new Error(`Open API RESULT ${code}`);
    if (!Array.isArray(info.row) || info.row.length !== info.list_total_count) {
      throw new Error(`행 수 ${info.row?.length} / list_total_count ${info.list_total_count}`);
    }
    return text;
  }

  // 실패는 저장하지 않는다. 동시에 온 요청은 진행 중인 한 번을 같이 기다린다.
  let cached = null;
  let pending = null;
  function cachedParking() {
    if (cached && now() - cached.at < ttlMs) return Promise.resolve(cached.text);
    pending ??= parking()
      .then((text) => { cached = { text, at: now() }; return text; })
      .finally(() => { pending = null; });
    return pending;
  }

  return http.createServer(async (req, res) => {
    const path = new URL(req.url, 'http://x').pathname;
    if (req.method !== 'GET') return res.writeHead(405).end();
    if (path === '/' || path === '/index.html') {
      return res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }).end(fs.readFileSync(INDEX));
    }
    if (path === '/api/parking') {
      try {
        const text = await cachedParking();
        return res.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }).end(text);
      } catch (err) {
        log(redact(`[api/parking] ${err.message}`));
        return res.writeHead(502, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' })
          .end('{"error":"upstream"}');
      }
    }
    res.writeHead(404).end();
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const key = process.env.SEOUL_OPENAPI_KEY?.trim();
  if (!key) {
    console.error('SEOUL_OPENAPI_KEY가 없어요. node --env-file=.env server/index.mjs 로 띄우세요.');
    process.exit(1);
  }
  const port = Number(process.env.PORT) || 8000;
  const host = process.env.HOST || '127.0.0.1';
  createApp({ key }).listen(port, host, () => console.log(`http://${host}:${port}/`));
}
