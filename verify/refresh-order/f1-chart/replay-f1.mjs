// F1 그림의 버그 1·2를 실제 index.html로 따라간다. 단계 번호는 그림 번호. tests/harness.mjs로 <script>를 그대로 돌린다.
// 숫자는 data/parking.json의 방화역(동) 실제 행에서만 바꾼다(총 면수 TPKCT 그대로, 주차 대수만 TPKCT−1, TPKCT−2).
import { open, response, row, kst } from '../../../tests/harness.mjs';
const ID = '172971';
const updated = kst(row(ID).NOW_PRK_VHCL_UPDT_TM);
const withCnt = (d, minutesLater) => { const r = structuredClone(response); const x = r.GetParkingInfo.row.find((y) => y.PKLT_CD === ID);
  x.NOW_PRK_VHCL_CNT = x.TPKCT - d;
  const t = new Date(updated + minutesLater * 60000 + 9 * 3600000).toISOString().replace('T', ' ').slice(0, 19); x.NOW_PRK_VHCL_UPDT_TM = t; return r; };
const banner = (app) => (app.text().match(/방화역\(동\)[^빈]*빈자리 (\d+)면 · (\d\d:\d\d) 기준/) || []).slice(1).join('면 @ ') || '없음';
for (const [name, last] of [['버그 1 (5. 새 숫자 도착: 만차)', 0], ['버그 2 (5. 새 숫자 도착: 빈자리)', 2]]) {
  const app = await open({ now: updated + 5 * 60000, storage: { 'seoul-parking:favorites': JSON.stringify([ID]) } }); // 1. 만차
  app.serve(withCnt(1, 1)); await app.tick();      // 2·3. 새로고침 → 빈자리 1면, 배너
  const shown = banner(app);
  app.serve(withCnt(last, 2)); await app.tick();   // 4·5. 새로고침 → 다시 만차 / 빈자리 2면
  console.log(`${name}: 3 뒤 배너 ${shown} / 5 뒤 목록 "${app.rowOf(ID).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').replace(/.*빈자리 /, '').trim()}" / 배너 ${banner(app)}`);
}
