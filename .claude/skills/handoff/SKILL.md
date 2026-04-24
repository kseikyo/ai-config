---
name: handoff
description: Create a structured context summary to continue work in a new Claude Code session. Use when the session context is getting long, when switching sessions, or when the user says "handoff", "context summary", "new session summary", or "summarize for handoff".
---

# Handoff

**Philosophy**: Context is the most expensive thing to reconstruct. A good handoff captures *decisions and constraints* (hard to rediscover) over *code changes* (visible in git). The summary should make the next session productive within 30 seconds of reading it.

Generate a structured summary so work can continue seamlessly in a new Claude Code session.

## Workflow

### Phase 0 — Validate
Confirm meaningful work exists to summarize. If the conversation has no substantive content, say so and stop.

### Phase 1 — Gather deterministic context
Run: `bash ~/.claude/skills/handoff/scripts/gather_context.sh`

This outputs: git status, recently changed files, recent commits, and beads task triage (`bv --robot-triage` → `bd list --status=open` → TaskList tool as fallback if beads is not available).

### Phase 2 — Extract (LLM synthesis)
From the conversation history, identify:
- What the user asked for (verbatim)
- What was completed
- Decisions and patterns established
- Explicit constraints or requirements

### Phase 3 — Format output

Using the script output to anchor KEY FILES and CURRENT STATE, produce:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HANDOFF SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

USER REQUESTS
• [verbatim user goals — do NOT paraphrase]

GOAL
[1 sentence]

WORK COMPLETED
• [what was done]

CURRENT STATE
[from git log/status output]

PENDING TASKS
• [from bv --robot-triage / bd list / TaskList, in priority order]

KEY FILES (max 10)
• path/to/file — [why it matters]
(use git status + diff output — do not invent paths)

IMPORTANT DECISIONS
• [decisions made, with brief rationale]

EXPLICIT CONSTRAINTS
• [verbatim constraints only — do not invent]

CONTEXT FOR CONTINUATION
[2-3 sentences of nuance needed to pick up without confusion]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Phase 4 — Instructions
After the summary, output:

> **To compact context to this summary, run:**
> `/compact Keep only the HANDOFF SUMMARY above. Discard all prior conversation.`
>
> This reduces context in-session. Alternatively, start a new session (`claude` in terminal) and paste the summary as your first message.

## Anti-Patterns

- Summarizing code changes instead of decisions (git diff is authoritative for changes)
- Inventing constraints the user never stated
- Including file paths that might not exist after further work
- Paraphrasing user goals instead of capturing them verbatim
- Omitting pending tasks or blocking issues
