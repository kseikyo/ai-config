import { resolve, join } from "node:path";
import { existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import type { IndexEntry, ToolMeta } from "../types.ts";
import { INDEX_PATH, TOOLS_DIR } from "./paths.ts";
import { readJson, atomicWriteJson, atomicWriteText, withLock } from "./io.ts";

export async function loadIndex(): Promise<IndexEntry[]> {
  if (!existsSync(INDEX_PATH)) return [];
  return readJson<IndexEntry[]>(INDEX_PATH);
}

export function toolDir(name: string): string {
  return resolve(TOOLS_DIR, name);
}

export async function getToolMeta(name: string): Promise<ToolMeta | null> {
  const p = join(toolDir(name), "meta.json");
  if (!existsSync(p)) return null;
  return readJson<ToolMeta>(p);
}

function metaToIndexEntry(m: ToolMeta): IndexEntry {
  return {
    name: m.name,
    description: m.description,
    hints: m.usageHints,
    runs: m.runs,
    successes: m.successes,
    createdAt: m.createdAt,
  };
}

export async function saveToolFiles(
  meta: ToolMeta,
  code: string,
): Promise<void> {
  const dir = toolDir(meta.name);
  await mkdir(dir, { recursive: true });
  await atomicWriteJson(join(dir, "meta.json"), meta);
  await atomicWriteText(join(dir, "code.ts"), code);
}

export async function upsertIndexEntry(entry: IndexEntry): Promise<void> {
  await withLock(INDEX_PATH, async () => {
    const idx = await loadIndex();
    const i = idx.findIndex((e) => e.name === entry.name);
    if (i >= 0) idx[i] = entry;
    else idx.push(entry);
    idx.sort((a, b) => a.name.localeCompare(b.name));
    await atomicWriteJson(INDEX_PATH, idx);
  });
}

export async function removeIndexEntry(name: string): Promise<void> {
  await withLock(INDEX_PATH, async () => {
    const idx = await loadIndex();
    const next = idx.filter((e) => e.name !== name);
    await atomicWriteJson(INDEX_PATH, next);
  });
}

export async function recordRun(name: string, ok: boolean): Promise<void> {
  const metaPath = join(toolDir(name), "meta.json");
  if (!existsSync(metaPath)) return;
  await withLock(metaPath, async () => {
    const meta = await readJson<ToolMeta>(metaPath);
    meta.runs += 1;
    if (ok) meta.successes += 1;
    await atomicWriteJson(metaPath, meta);
    await upsertIndexEntry(metaToIndexEntry(meta));
  });
}

export { metaToIndexEntry };
