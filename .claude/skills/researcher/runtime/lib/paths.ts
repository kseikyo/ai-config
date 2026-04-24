import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
export const SKILL_DIR = resolve(here, "../..");
export const TOOLS_DIR = resolve(SKILL_DIR, "tools");
export const INDEX_PATH = resolve(TOOLS_DIR, "_index.json");
export const RUNS_DIR = resolve(SKILL_DIR, "runtime/.runs");
export const SCRIPTS_DIR = resolve(SKILL_DIR, "scripts");
export const LOGS_DIR = resolve(SKILL_DIR, "logs");
