import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { decide } from '../scripts/guard-approval.js';

const SCRIPT = fileURLToPath(new URL('../scripts/guard-approval.js', import.meta.url));
const bash = (command) => decide({ tool_name: 'Bash', tool_input: { command } });

test('approve·review 실행을 막는다', () => {
  assert.match(bash('design-harness approve prd --by 홍길동'), /사람이 직접/);
  assert.match(bash('npx design-harness review ia --by AI --score 5'), /review/);
  assert.match(bash('node bin/design-harness.js approve 3 --by x'), /approve/);
  assert.match(bash('cd work && node "/p/bin/design-harness.js" approve ia --by x'), /approve/);
});

test('다른 design-harness 명령과 기록 파일 읽기는 통과', () => {
  assert.equal(bash('design-harness check --json'), null);
  assert.equal(bash('design-harness refs:capture https://example.com'), null);
  assert.equal(bash('cat work/demo/approvals.json'), null);
  assert.equal(bash('jq .approvals work/demo/approvals.json 2>/dev/null'), null);
  assert.equal(bash('grep -c score work/demo/reviews.json'), null);
});

test('셸로 기록 파일을 고쳐 쓰는 것을 막는다', () => {
  assert.ok(bash('echo {} > work/demo/approvals.json'));
  assert.ok(bash("sed -i '' s/a/b/ work/demo/reviews.json"));
  assert.ok(bash('rm work/demo/approvals.json'));
  assert.ok(bash('node -e "fs.writeFileSync(\'approvals.json\', x)"'));
});

test('Write·Edit 로 기록 파일을 고치는 것을 막는다', () => {
  assert.ok(decide({ tool_name: 'Write', tool_input: { file_path: '/x/work/demo/approvals.json' } }));
  assert.ok(decide({ tool_name: 'Edit', tool_input: { file_path: '/x/work/demo/reviews.json' } }));
  assert.equal(decide({ tool_name: 'Write', tool_input: { file_path: '/x/work/demo/03-ia/screens.md' } }), null);
});

test('훅으로 실행하면 deny 결정을 JSON 으로 낸다', () => {
  const run = (input) => spawnSync(process.execPath, [SCRIPT], { input: JSON.stringify(input), encoding: 'utf8' });
  let r = run({ tool_name: 'Bash', tool_input: { command: 'design-harness approve prd --by x' } });
  assert.equal(r.status, 0, r.stderr);
  const out = JSON.parse(r.stdout);
  assert.equal(out.hookSpecificOutput.permissionDecision, 'deny');
  r = run({ tool_name: 'Bash', tool_input: { command: 'design-harness check' } });
  assert.equal(r.status, 0);
  assert.equal(r.stdout, '');
});
