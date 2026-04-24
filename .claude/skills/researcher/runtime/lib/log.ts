import { appendFile, mkdir } from "node:fs/promises";
import { LOGS_DIR } from "./paths.ts";

const LOG_PATH = `${LOGS_DIR}/runs.jsonl`;

export async function appendRunLog(event: Record<string, unknown>): Promise<void> {
  await mkdir(LOGS_DIR, { recursive: true });
  const line = JSON.stringify({ ts: new Date().toISOString(), ...event }) + "\n";
  await appendFile(LOG_PATH, line, "utf8");
}

export { LOG_PATH, LOGS_DIR };
