// PostToolUse 훅: 파일을 고칠 때마다 node --test로 전체 테스트를 돌린다.
// 통과하면 조용히 끝나고, 실패하면 요약을 stderr로 내고 종료 코드 2로 Claude에게 알린다.
import { readFileSync, readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";

const root = process.env.CLAUDE_PROJECT_DIR || process.cwd();

let file = "";
try {
  const input = JSON.parse(readFileSync(0, "utf8"));
  file = input.tool_input?.file_path || input.tool_input?.notebook_path || "";
} catch {}

// 저장소 밖 파일(스크래치 등)은 건너뛴다.
const rel = path.relative(root, path.resolve(root, file));
if (!file || rel.startsWith("..") || path.isAbsolute(rel)) process.exit(0);

// Node 18은 --test 글롭을 펼치지 않으므로 직접 고른다.
const dir = path.join(root, "tests");
const files = readdirSync(dir).filter((f) => f.endsWith(".test.mjs")).map((f) => path.join(dir, f));
if (files.length === 0) process.exit(0);

const r = spawnSync(process.execPath, ["--test", ...files], { cwd: root, encoding: "utf8", timeout: 60000 });
if (r.status === 0) process.exit(0);

const out = (r.stdout || "") + (r.stderr || "");
const lines = out.split("\n");
const failed = lines.filter((l) => /^✖ /.test(l));
const summary = lines.filter((l) => /^ℹ (tests|pass|fail) /.test(l));
process.stderr.write(
  `테스트 실패 (${rel} 수정 후, node --test tests/*.test.mjs)\n` +
    [...failed, ...summary].join("\n") +
    "\n--- 출력 끝부분 ---\n" +
    lines.slice(-40).join("\n") +
    "\n"
);
process.exit(2);
