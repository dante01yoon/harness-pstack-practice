// 발견 F1을 실제 index.html로 재현한다(tests/harness.mjs로 <script>를 그대로 돌림).
// 모델 finding-banner.cfg의 반례와 같은 순서: 만차 → 빈자리 1면(배너) → 다시 만차.
// 재현되면 exit 1, 배너 숫자가 목록과 맞으면(고쳐짐) exit 0.
import { open, response, row, kst } from '../../tests/harness.mjs';

const BANGHWA = '172971'; // 방화역(동): 실제 응답에서 67면 중 67대 → 만차
const updated = kst(row(BANGHWA).NOW_PRK_VHCL_UPDT_TM);
const reopened = structuredClone(response);
const r = reopened.GetParkingInfo.row.find((x) => x.PKLT_CD === BANGHWA);
r.NOW_PRK_VHCL_CNT = r.TPKCT - 1;

const app = await open({ now: updated + 5 * 60 * 1000, storage: { 'seoul-parking:favorites': JSON.stringify([BANGHWA]) } });
app.serve(reopened);
await app.tick();               // 2번째 load: 빈자리 1면 → 배너
const bannerShown = /빈자리 1면 · /.test(app.text());
app.serve(response);
await app.tick();               // 3번째 load: 다시 만차
const rowFull = /만차/.test(app.rowOf(BANGHWA));
const bannerStill = /방화역\(동\)[^·]*빈자리 1면 · /.test(app.text());

console.log(`배너가 떴다: ${bannerShown} / 다음 응답에서 목록 행은 만차: ${rowFull} / 배너는 여전히 빈자리 1면: ${bannerStill}`);
if (bannerShown && rowFull && bannerStill) {
  console.log('F1 재현됨: 목록은 최신 응답(만차)인데 배너는 이전 응답의 빈자리 1면을 보여 줘요.');
  process.exit(1);
}
console.log('F1 재현 안 됨');
