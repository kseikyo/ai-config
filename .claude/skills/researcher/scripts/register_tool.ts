#!/usr/bin/env bun
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve, join } from "node:path";
import { z } from "zod";
import { TOOLS_DIR } from "../runtime/lib/paths.ts";
import {
  saveToolFiles,
  upsertIndexEntry,
  metaToIndexEntry,
  loadIndex,
} from "../runtime/lib/index.ts";
import type { ToolMeta } from "../runtime/types.ts";

const MetaInput = z.object({
  name: z.string().regex(/^[a-z][a-z0-9_]*$/, "name must be snake_case"),
  description: z.string().min(10),
  inputSchema: z.record(z.unknown()),
  outputSchema: z.record(z.unknown()),
  usageHints: z.array(z.string()).min(1),
  dependsOn: z.array(z.string()).default([]),
});

function parseArgs(): { meta: string; code: string; force: boolean } {
  const a = process.argv.slice(2);
  let meta = "";
  let code = "";
  let force = false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] === "--meta") meta = a[++i] ?? "";
    else if (a[i] === "--code") code = a[++i] ?? "";
    else if (a[i] === "--force") force = true;
  }
  if (!meta || !code) {
    console.error("usage: register_tool.ts --meta meta.json --code code.ts [--force]");
    process.exit(1);
  }
  return { meta: resolve(process.cwd(), meta), code: resolve(process.cwd(), code), force };
}

function fail(obj: object): never {
  console.log(JSON.stringify({ ok: false, ...obj }, null, 2));
  process.exit(1);
}

const { meta: metaPath, code: codePath, force } = parseArgs();
if (!existsSync(metaPath)) fail({ error: `meta file not found: ${metaPath}` });
if (!existsSync(codePath)) fail({ error: `code file not found: ${codePath}` });

let metaJson: unknown;
try {
  metaJson = JSON.parse(await readFile(metaPath, "utf8"));
} catch (e) {
  fail({ error: "meta.json is not valid JSON", detail: (e as Error).message });
}

const parsed = MetaInput.safeParse(metaJson);
if (!parsed.success) {
  fail({ error: "meta validation failed", issues: parsed.error.issues });
}
const data = parsed.data;

const existing = await loadIndex();
if (!force && existing.some((e) => e.name === data.name)) {
  fail({
    error: `tool '${data.name}' already exists`,
    hint: "pass --force to overwrite",
  });
}

const code = await readFile(codePath, "utf8");
if (!/export\s+default\s+/.test(code)) {
  fail({ error: "code.ts must `export default` an async function" });
}

// Light syntax check via bun parse (no exec).
const proc = Bun.spawnSync({
  cmd: ["bun", "build", codePath, "--target=bun", "--outdir=/tmp/.researcher-check"],
  stderr: "pipe",
  stdout: "pipe",
});
if (proc.exitCode !== 0) {
  fail({
    error: "code.ts failed to parse",
    stderr: new TextDecoder().decode(proc.stderr),
  });
}

const fullMeta: ToolMeta = {
  name: data.name,
  description: data.description,
  inputSchema: data.inputSchema,
  outputSchema: data.outputSchema,
  usageHints: data.usageHints,
  dependsOn: data.dependsOn,
  createdAt: new Date().toISOString(),
  runs: 0,
  successes: 0,
};

await saveToolFiles(fullMeta, code);
await upsertIndexEntry(metaToIndexEntry(fullMeta));

import { appendRunLog } from "../runtime/lib/log.ts";
await appendRunLog({ phase: "register", tool_name: data.name, description: data.description });

console.log(
  JSON.stringify(
    { ok: true, name: data.name, path: join(TOOLS_DIR, data.name) },
    null,
    2,
  ),
);
