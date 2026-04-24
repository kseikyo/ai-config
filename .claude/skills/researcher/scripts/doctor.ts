#!/usr/bin/env bun
import { readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";
import { TOOLS_DIR, SKILL_DIR } from "../runtime/lib/paths.ts";
import { loadIndex, getToolMeta } from "../runtime/lib/index.ts";

const MetaSchema = z.object({
  name: z.string().regex(/^[a-z][a-z0-9_]*$/),
  description: z.string().min(10),
  inputSchema: z.record(z.unknown()),
  outputSchema: z.record(z.unknown()),
  usageHints: z.array(z.string()),
  dependsOn: z.array(z.string()),
  createdAt: z.string(),
  runs: z.number().int().nonnegative(),
  successes: z.number().int().nonnegative(),
});

const issues: string[] = [];

if (!existsSync(join(SKILL_DIR, "node_modules"))) {
  issues.push("node_modules/ missing — run: bun install");
}

const idx = await loadIndex();
const idxNames = new Set(idx.map((e) => e.name));

let dirs: string[] = [];
try {
  dirs = (await readdir(TOOLS_DIR, { withFileTypes: true }))
    .filter((d) => d.isDirectory())
    .map((d) => d.name);
} catch {
  issues.push(`tools/ dir missing: ${TOOLS_DIR}`);
}

const dirNames = new Set(dirs);

for (const name of idxNames) {
  if (!dirNames.has(name)) issues.push(`index entry '${name}' has no tool directory`);
}
for (const name of dirNames) {
  if (!idxNames.has(name)) issues.push(`tool dir '${name}' not in _index.json`);
}

for (const name of dirNames) {
  const metaPath = join(TOOLS_DIR, name, "meta.json");
  const codePath = join(TOOLS_DIR, name, "code.ts");
  if (!existsSync(metaPath)) issues.push(`${name}: missing meta.json`);
  if (!existsSync(codePath)) issues.push(`${name}: missing code.ts`);
  const meta = await getToolMeta(name);
  if (!meta) continue;
  const parsed = MetaSchema.safeParse(meta);
  if (!parsed.success) {
    issues.push(
      `${name}: meta.json invalid — ${parsed.error.issues.map((i) => i.path.join(".") + ":" + i.message).join("; ")}`,
    );
  } else if (parsed.data.name !== name) {
    issues.push(`${name}: meta.name='${parsed.data.name}' mismatches dir`);
  }
}

console.log(
  JSON.stringify(
    { ok: issues.length === 0, toolCount: dirNames.size, issues },
    null,
    2,
  ),
);
process.exit(issues.length === 0 ? 0 : 1);
