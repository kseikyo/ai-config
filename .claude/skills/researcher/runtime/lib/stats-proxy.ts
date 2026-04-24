import { spawn } from "node:child_process";
import { SKILL_DIR } from "./paths.ts";
import { appendRunLog } from "./log.ts";
import type { ToolFn } from "../types.ts";

export function wrapWithStats<I, O>(
  name: string,
  fn: ToolFn<I, O>,
  runId?: string,
): ToolFn<I, O> {
  return async (input: I) => {
    const start = Date.now();
    let ok = false;
    let errMsg: string | undefined;
    try {
      const out = await fn(input);
      ok = true;
      return out;
    } catch (e: any) {
      errMsg = e?.message ?? String(e);
      throw e;
    } finally {
      const duration_ms = Date.now() - start;
      // Fire-and-forget counter bump
      spawn(
        "bun",
        ["run", `${SKILL_DIR}/scripts/record_run.ts`, name, ok ? "ok" : "fail"],
        { stdio: "ignore", detached: true },
      ).unref();
      // Append to run log
      appendRunLog({
        phase: "tool_call",
        runId: runId ?? "unknown",
        tool: name,
        duration_ms,
        ok,
        ...(errMsg ? { error: errMsg } : {}),
      }).catch(() => {}); // never block on log failure
    }
  };
}
