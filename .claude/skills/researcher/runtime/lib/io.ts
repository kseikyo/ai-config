import { writeFile, rename, mkdir, readFile } from "node:fs/promises";
import { dirname } from "node:path";
import { randomBytes } from "node:crypto";
import lockfile from "proper-lockfile";

export async function readJson<T>(path: string): Promise<T> {
  const buf = await readFile(path, "utf8");
  return JSON.parse(buf) as T;
}

export async function atomicWriteJson(path: string, data: unknown): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  const tmp = `${path}.${randomBytes(6).toString("hex")}.tmp`;
  await writeFile(tmp, JSON.stringify(data, null, 2) + "\n", "utf8");
  await rename(tmp, path);
}

export async function atomicWriteText(path: string, content: string): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  const tmp = `${path}.${randomBytes(6).toString("hex")}.tmp`;
  await writeFile(tmp, content, "utf8");
  await rename(tmp, path);
}

export async function withLock<T>(path: string, fn: () => Promise<T>): Promise<T> {
  await mkdir(dirname(path), { recursive: true });
  try {
    await writeFile(path, "", { flag: "a" });
  } catch {}
  const release = await lockfile.lock(path, {
    retries: { retries: 20, minTimeout: 25, maxTimeout: 200 },
    stale: 10_000,
  });
  try {
    return await fn();
  } finally {
    await release();
  }
}
