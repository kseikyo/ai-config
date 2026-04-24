#!/usr/bin/env bun
import { loadIndex } from "../runtime/lib/index.ts";
import type { IndexEntry } from "../runtime/types.ts";

const args = process.argv.slice(2);
let max = 5;
const queryParts: string[] = [];
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--max") max = Number(args[++i] ?? 5);
  else queryParts.push(args[i]!);
}
const query = queryParts.join(" ").trim();
if (!query) {
  console.log(JSON.stringify({ error: "missing query" }));
  process.exit(1);
}

function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 1 && !STOP.has(t));
}
const STOP = new Set([
  "the", "a", "an", "of", "to", "for", "and", "or", "in", "on", "at",
  "is", "it", "by", "as", "with", "from",
]);

// BM25-lite over (name, description, hint[0])
function docTokens(e: IndexEntry): string[] {
  return tokenize(`${e.name} ${e.description} ${e.hints[0] ?? ""}`);
}

const idx = await loadIndex();
const qTokens = tokenize(query);
if (qTokens.length === 0 || idx.length === 0) {
  console.log(JSON.stringify({ query, selected: [] }));
  process.exit(0);
}

const docs = idx.map((e) => ({ e, tokens: docTokens(e) }));
const N = docs.length;
const avgdl = docs.reduce((a, d) => a + d.tokens.length, 0) / N;

const df = new Map<string, number>();
for (const d of docs) {
  const seen = new Set(d.tokens);
  for (const t of seen) df.set(t, (df.get(t) ?? 0) + 1);
}

const k1 = 1.5;
const b = 0.75;

function bm25(doc: { tokens: string[] }): number {
  let score = 0;
  const tf = new Map<string, number>();
  for (const t of doc.tokens) tf.set(t, (tf.get(t) ?? 0) + 1);
  const dl = doc.tokens.length || 1;
  for (const q of qTokens) {
    const n = df.get(q) ?? 0;
    if (n === 0) continue;
    const idf = Math.log(1 + (N - n + 0.5) / (n + 0.5));
    const f = tf.get(q) ?? 0;
    const norm = f * (k1 + 1) / (f + k1 * (1 - b + b * (dl / avgdl)));
    score += idf * norm;
  }
  return score;
}

const scored = docs
  .map((d) => ({ name: d.e.name, score: bm25(d), description: d.e.description, hint: d.e.hints[0] ?? null }))
  .filter((s) => s.score > 0)
  .sort((a, b) => b.score - a.score)
  .slice(0, max);

import { appendRunLog } from "../runtime/lib/log.ts";
await appendRunLog({
  phase: "select",
  query,
  tools_suggested: scored.map((s) => s.name),
  scores: scored.map((s) => Math.round(s.score * 100) / 100),
});
console.log(JSON.stringify({ query, selected: scored }, null, 2));
