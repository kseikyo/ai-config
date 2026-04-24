#!/usr/bin/env bun
import { existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { SKILL_DIR, TOOLS_DIR, RUNS_DIR, INDEX_PATH } from "../runtime/lib/paths.ts";
import { atomicWriteJson } from "../runtime/lib/io.ts";

async function ensureDirs() {
  for (const d of [TOOLS_DIR, RUNS_DIR, join(SKILL_DIR, "runtime/lib"), join(SKILL_DIR, "scripts")]) {
    await mkdir(d, { recursive: true });
  }
}

async function ensureIndex() {
  if (existsSync(INDEX_PATH)) return;
  await atomicWriteJson(INDEX_PATH, []);
}

function bunInstall(): number {
  if (existsSync(join(SKILL_DIR, "node_modules"))) return 0;
  const proc = Bun.spawnSync({
    cmd: ["bun", "install"],
    cwd: SKILL_DIR,
    stdout: "inherit",
    stderr: "inherit",
  });
  return proc.exitCode;
}

await ensureDirs();
await ensureIndex();
const code = bunInstall();
console.log(JSON.stringify({ ok: code === 0, installExitCode: code }));
if (code !== 0) process.exit(code);
