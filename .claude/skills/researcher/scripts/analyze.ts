#!/usr/bin/env bun
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { LOGS_DIR } from "../runtime/lib/paths.ts";

const LOG_PATH = `${LOGS_DIR}/runs.jsonl`;

interface LogEvent {
  ts: string;
  phase: string;
  [key: string]: unknown;
}

if (!existsSync(LOG_PATH)) {
  console.log(JSON.stringify({ ok: false, error: "No logs/runs.jsonl yet. Run a research session first." }));
  process.exit(0);
}

const raw = await readFile(LOG_PATH, "utf8");
const events: LogEvent[] = raw
  .split("\n")
  .filter(Boolean)
  .map((line) => {
    try { return JSON.parse(line); }
    catch { return null; }
  })
  .filter(Boolean);

if (events.length === 0) {
  console.log(JSON.stringify({ ok: true, totalEvents: 0, message: "Log file empty." }));
  process.exit(0);
}

// Time range
const timestamps = events.map((e) => e.ts).filter(Boolean).sort();
const period = { from: timestamps[0], to: timestamps[timestamps.length - 1] };

// Tool call stats
const toolCalls = events.filter((e) => e.phase === "tool_call");
const toolMap = new Map<string, { calls: number; successes: number; durations: number[]; errors: Map<string, number> }>();

for (const tc of toolCalls) {
  const name = tc.tool as string;
  if (!toolMap.has(name)) {
    toolMap.set(name, { calls: 0, successes: 0, durations: [], errors: new Map() });
  }
  const entry = toolMap.get(name)!;
  entry.calls++;
  if (tc.ok) entry.successes++;
  if (typeof tc.duration_ms === "number") entry.durations.push(tc.duration_ms);
  if (tc.error) {
    const errKey = String(tc.error).slice(0, 80);
    entry.errors.set(errKey, (entry.errors.get(errKey) ?? 0) + 1);
  }
}

function percentile(arr: number[], p: number): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)]!;
}

const toolStats = [...toolMap.entries()].map(([name, s]) => {
  const failRate = s.calls > 0 ? Math.round((1 - s.successes / s.calls) * 100) / 100 : 0;
  const topErrors = [...s.errors.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([msg, count]) => ({ msg, count }));
  return {
    name,
    calls: s.calls,
    successes: s.successes,
    failRate,
    p50_ms: Math.round(percentile(s.durations, 50)),
    p95_ms: Math.round(percentile(s.durations, 95)),
    topErrors,
  };
}).sort((a, b) => b.calls - a.calls);

// Run completion stats
const runs = events.filter((e) => e.phase === "run_complete");
const totalRuns = runs.length;
const failedRuns = runs.filter((r) => !r.success).length;
const runDurations = runs.map((r) => r.duration_ms as number).filter(Boolean);

// Select stats
const selects = events.filter((e) => e.phase === "select");
const queryFreq = new Map<string, number>();
for (const s of selects) {
  const q = String(s.query ?? "").toLowerCase().trim();
  if (q) queryFreq.set(q, (queryFreq.get(q) ?? 0) + 1);
}
const queryPatterns = [...queryFreq.entries()]
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10)
  .map(([query, count]) => ({ query, count }));

// Registrations
const registrations = events.filter((e) => e.phase === "register");

// Suggestions
const suggestions: string[] = [];
for (const ts of toolStats) {
  if (ts.failRate >= 0.5 && ts.calls >= 2) {
    const topErr = ts.topErrors[0]?.msg ?? "unknown";
    suggestions.push(`${ts.name}: ${Math.round(ts.failRate * 100)}% failure rate (${ts.calls} calls). Top error: "${topErr}". Fix the tool or add a fallback.`);
  }
  if (ts.p95_ms > 10000) {
    suggestions.push(`${ts.name}: p95 latency ${ts.p95_ms}ms (>10s). Consider adding timeout or caching.`);
  }
}
if (failedRuns > 0 && totalRuns > 0) {
  suggestions.push(`${failedRuns}/${totalRuns} runs failed. Check .result.json files for error details.`);
}

const output = {
  ok: true,
  totalEvents: events.length,
  period,
  runs: {
    total: totalRuns,
    failed: failedRuns,
    p50_ms: Math.round(percentile(runDurations, 50)),
    p95_ms: Math.round(percentile(runDurations, 95)),
  },
  toolStats,
  queryPatterns,
  registrations: registrations.length,
  suggestions,
};

console.log(JSON.stringify(output, null, 2));
