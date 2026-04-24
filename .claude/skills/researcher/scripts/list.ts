#!/usr/bin/env bun
import { loadIndex } from "../runtime/lib/index.ts";
import type { IndexEntry } from "../runtime/types.ts";

function parseArgs(): { query?: string; max: number } {
  const args = process.argv.slice(2);
  let query: string | undefined;
  let max = 50;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--query") query = args[++i];
    else if (args[i] === "--max") max = Number(args[++i] ?? 50);
  }
  return { query, max };
}

function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 1);
}

function score(entry: IndexEntry, qTokens: string[]): number {
  if (qTokens.length === 0) return 0;
  const hay = tokenize(
    `${entry.name} ${entry.description} ${(entry.hints[0] ?? "")}`,
  );
  const set = new Set(hay);
  let hits = 0;
  for (const t of qTokens) if (set.has(t)) hits += 1;
  return hits / qTokens.length;
}

const { query, max } = parseArgs();
const idx = await loadIndex();
const qTokens = query ? tokenize(query) : [];

const ranked = (query
  ? idx
      .map((e) => ({ e, s: score(e, qTokens) }))
      .sort((a, b) => b.s - a.s)
      .filter((r) => r.s > 0)
      .map((r) => r.e)
  : idx
).slice(0, max);

const out = ranked.map((e) => ({
  name: e.name,
  description: e.description,
  hint: e.hints[0] ?? null,
  runs: e.runs,
  successes: e.successes,
}));

console.log(JSON.stringify({ count: out.length, tools: out }, null, 2));
