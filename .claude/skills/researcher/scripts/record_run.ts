#!/usr/bin/env bun
import { recordRun } from "../runtime/lib/index.ts";

const [name, status] = process.argv.slice(2);
if (!name || (status !== "ok" && status !== "fail")) {
  console.error("usage: record_run.ts <tool_name> <ok|fail>");
  process.exit(1);
}
await recordRun(name, status === "ok");
console.log(JSON.stringify({ ok: true, tool: name, status }));
