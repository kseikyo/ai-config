#!/usr/bin/env bun
import { spawn } from "node:child_process";
import { writeFile } from "node:fs/promises";
import { resolve, basename } from "node:path";
import { existsSync } from "node:fs";
import { SKILL_DIR } from "../runtime/lib/paths.ts";
import { appendRunLog } from "../runtime/lib/log.ts";

const runArg = process.argv[2];
if (!runArg) {
  console.error("usage: run.ts <runfile.ts>");
  process.exit(1);
}
const runFile = resolve(process.cwd(), runArg);
if (!existsSync(runFile)) {
  console.error(`runfile not found: ${runFile}`);
  process.exit(1);
}

const runId = basename(runFile, ".ts");
const startTime = Date.now();

const child = spawn("bun", ["run", runFile], {
  cwd: SKILL_DIR,
  env: process.env,
  stdio: ["ignore", "pipe", "pipe"],
});

let out = "";
let err = "";
child.stdout.on("data", (b: Buffer) => (out += b.toString()));
child.stderr.on("data", (b: Buffer) => (err += b.toString()));

child.on("close", async (code) => {
  const duration_ms = Date.now() - startTime;
  const logs = err.split("\n").filter(Boolean);
  let parsed: unknown = null;
  const lastLine = out.trim().split("\n").pop() ?? "";
  try {
    parsed = JSON.parse(lastLine);
  } catch {
    parsed = null;
  }
  const payload = {
    exitCode: code,
    result: parsed,
    stdout: out,
    logs,
    duration_ms,
    runId,
  };

  // Persist result alongside the .ts runner
  const resultPath = runFile.replace(/\.ts$/, ".result.json");
  try {
    await writeFile(resultPath, JSON.stringify(payload, null, 2) + "\n", "utf8");
  } catch {}

  // Log the run completion
  try {
    await appendRunLog({
      phase: "run_complete",
      runId,
      exitCode: code,
      duration_ms,
      success: code === 0,
    });
  } catch {}

  console.log(JSON.stringify(payload, null, 2));
  process.exit(code ?? 0);
});
