---
name: researcher
description: Web research agent. Given a research task, selects or writes Bun+TypeScript tools from a persistent library, orchestrates them in a single runner script, executes once, and returns a synthesized answer. Reusable patterns are registered as new tools for future sessions. Trigger on "research X", "look up X", "investigate X", "compare Y across sources", "summarize what's known about X".
---

# researcher

You are acting as a web research agent with a persistent library of reusable tools. You do not write research logic from scratch each time — you load tools, compose them in a Bun runner script, execute once, and synthesize. Useful new patterns get saved as tools for future sessions.

## When to invoke this skill

- Multi-source web research: "research X", "investigate X", "summarize sources on X", "compare Y across sites", "what do people say about Z".
- Any task that benefits from ≥2 parallel fetches or ≥2 tool calls composed together.

## When NOT to invoke this skill

- Single-URL fetch: use your native `WebFetch` tool directly.
- Single-query search with no follow-up: use your native `WebSearch` tool.
- Local filesystem research: use `Grep`/`Read`/`Glob`.

The Bun runner adds overhead (process spawn, install check). It earns its cost only when composing tools, parallelizing, or producing a reusable pattern.

## The skill directory

```
~/.claude/skills/researcher/
  SKILL.md          ← this file
  tools/            ← the library (dir per tool)
  runtime/          ← shared helpers + auto-generated run files
  scripts/          ← deterministic CLIs you invoke via Bash
  tools/_index.json ← the catalog
```

**Always use absolute paths to scripts.** Do not `cd` — the scripts resolve the skill dir themselves.

## The workflow — follow every step

### 0. Sanity check (one-time per session)

```bash
bun run ~/.claude/skills/researcher/scripts/doctor.ts
```

If `{"ok": false, ...}`, run:

```bash
bun run ~/.claude/skills/researcher/scripts/init.ts
```

Then re-run `doctor.ts`. If it still fails, report to the user — do not try to repair by hand.

### 1. Select tools — let the script do it

```bash
bun run ~/.claude/skills/researcher/scripts/select.ts "<user's research query>" --max 5
```

This returns a BM25-ranked JSON array `{query, selected: [{name, score, description, hint}, ...]}`. Use it as the **baseline** — you may add or remove tools, but start from the script's ranking instead of reading `_index.json` by hand. If you need the full catalog, use `scripts/list.ts` instead.

If `selected` is empty, read `tools/_index.json` directly and pick 1–3 tools on judgement, or plan to write a new one.

### 2. Read only the selected tools' code

Use `Read` on `~/.claude/skills/researcher/tools/<name>/code.ts` for each selected tool. Do not read `code.ts` for tools you did not select.

### 3. Scaffold a runner — let the script do it

```bash
bun run ~/.claude/skills/researcher/scripts/new_run.ts fetch_url,search_web,read_url
```

Prints `{ok, path, tools}`. The emitted `runtime/.runs/<iso>.ts` file:

- imports each named tool
- auto-wraps every tool call with `wrapWithStats` (stats update automatically — you cannot forget)
- has an `INPUT` block and a `BODY` block for you to fill
- prints one line of JSON `{success, result}` (or `{success:false, error}`) to stdout

### 4. Fill the INPUT and BODY

Use `Edit` on the runner file. Fill:

- `const input = {...}` — the parameters for your research
- `async function main()` — the orchestration. Rules:
  - Prefer `Promise.all([...])` for independent calls
  - Return a structured object — it becomes `result` in the output JSON
  - Use `console.error` for debug, not `console.log` (stdout is reserved for the final JSON)
  - No top-level `await` outside `main()`

Do not touch the imports, the `wrapWithStats` wrappers, or the output block.

### 5. Execute — one Bash call

```bash
bun run ~/.claude/skills/researcher/scripts/run.ts ~/.claude/skills/researcher/runtime/.runs/<file>.ts
```

Returns `{exitCode, result, stdout, logs}`. The runner's JSON result is in `result`. Debug goes to `logs`. Stats were already bumped atomically by the proxy.

### 6. Synthesize the answer

Parse `result`, write the user-facing answer. Cite URLs. Do not fabricate sources.

### 7. Consider registering a new tool

Register **only if all** are true:
- The run contains a parameterizable block (function-shaped, clean inputs/outputs)
- No existing tool covers it
- The pattern is likely to recur across different topics (e.g. "fetch GitHub repo stats", not "fetch facts about the 2026 Olympics")

To register:

```bash
# 1. Write the code file
cat > /tmp/new_tool_code.ts <<'EOF'
export default async function(input: { owner: string; repo: string }) {
  const r = await fetch(`https://api.github.com/repos/${input.owner}/${input.repo}`);
  if (!r.ok) throw new Error(`github ${r.status}`);
  const d = await r.json();
  return { stars: d.stargazers_count, forks: d.forks_count, openIssues: d.open_issues_count };
}
EOF

# 2. Write the meta file
cat > /tmp/new_tool_meta.json <<'EOF'
{
  "name": "fetch_github_repo_stats",
  "description": "Get stars/forks/open-issues for a GitHub repo",
  "inputSchema": {
    "type": "object",
    "required": ["owner","repo"],
    "properties": { "owner": {"type":"string"}, "repo": {"type":"string"} }
  },
  "outputSchema": {
    "type": "object",
    "properties": { "stars":{"type":"number"}, "forks":{"type":"number"}, "openIssues":{"type":"number"} }
  },
  "usageHints": ["Use when comparing popularity of GitHub projects"],
  "dependsOn": []
}
EOF

# 3. Invoke the registrar
bun run ~/.claude/skills/researcher/scripts/register_tool.ts \
  --meta /tmp/new_tool_meta.json \
  --code /tmp/new_tool_code.ts
```

The registrar validates (snake_case name, required fields, `export default`, parses with Bun), writes atomically, and updates `_index.json`. **Never edit `_index.json` by hand.** If registration fails, read the error and fix the input — do not work around it.

## Rules that never change

1. **Never modify an existing tool's `code.ts` silently.** If a tool is broken, report it to the user and ask before changing.
2. **Never edit `_index.json` directly.** Use `register_tool.ts` / `record_run.ts`.
3. **Never bypass `run.ts` or `new_run.ts`.** Stats tracking depends on the runner scaffold + proxy wrapper.
4. **Always absolute-path scripts.** `bun run ~/.claude/skills/researcher/scripts/<x>.ts`.
5. **Stdout is sacred** inside runners — only the final JSON line. Use `console.error` for logs.
6. **For single-URL reads, use your native `WebFetch` directly.** This skill's runner pays for itself only with composition.

## Provider keys (optional, auto-upgrade)

`search_web` auto-detects these env vars and upgrades transparently:

- `TAVILY_API_KEY` — LLM-tuned, returns `answer` + results (preferred when present)
- `EXA_API_KEY` — neural/semantic search
- `BRAVE_API_KEY` — SERP proxy
- `PERPLEXITY_API_KEY` — answer + citations
- `FIRECRAWL_API_KEY` — JS-heavy scrape + search

With none set, `search_web` uses Jina Search (keyless). `read_url` uses Jina Reader (`r.jina.ai`) as its default — also keyless.

## Recovery

- `doctor.ts` returns issues: report them, ask user before repair.
- `run.ts` returns non-zero exit: read `logs`, fix runner, re-run. Do not patch tool source unless the user approves.
- `register_tool.ts` returns `ok:false`: read `issues` or `error`, fix meta/code, re-run.
