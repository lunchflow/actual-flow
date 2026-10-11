import { exec } from "node:child_process";
import { promisify } from "node:util";
const run = promisify(exec);

(async () => {
  console.log("[sync] Running Lunchflow → Actual import...");
  const { stdout, stderr } = await run("npx @lunchflow/actual-flow import", {
    env: { ...process.env },
    shell: "/bin/bash",
  });
  if (stdout) console.log(stdout);
  if (stderr) console.error(stderr);
  console.log("[sync] Done.");
})().catch((err) => {
  console.error("[sync] Failed:", err);
  process.exit(1);
});