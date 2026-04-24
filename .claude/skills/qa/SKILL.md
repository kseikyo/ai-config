---
name: qa
description: Interactive QA session where user reports bugs conversationally. Explores codebase in background for context and domain language, then files issues via beads. Use when user wants to report bugs, do QA, file issues, or mentions "QA session".
---

# QA Session

**Philosophy**: Bug reports decay fast — the moment a user experiences an issue is when the most context exists. Capture that context immediately in durable, behavior-focused issues. The codebase answers implementation questions; the user answers intent questions.

Run an interactive QA session. The user describes problems. You clarify minimally, explore the codebase for context, and file issues that are durable, user-focused, and use the project's domain language.

## For each issue the user raises

### 1. Listen and lightly clarify

Let the user describe the problem in their own words. Ask **at most 2-3 short clarifying questions** focused on:

- What they expected vs what actually happened
- Steps to reproduce (if not obvious)
- Whether it's consistent or intermittent

Do NOT over-interview. If the description is clear enough to file, move on.

### Ask vs Explore Decision

- **Explore** (don't ask): domain language, feature behavior, code paths, related modules, existing tests
- **Ask** (don't explore): user intent, reproduction steps, frequency, severity from user's perspective

### 2. Explore the codebase in the background

While talking to the user, kick off an Agent (subagent_type=Explore) **in the background** (`run_in_background: true`) to understand the relevant area. The goal is NOT to find a fix — it's to:

- Learn the domain language used in that area (check UBIQUITOUS_LANGUAGE.md if it exists)
- Understand what the feature is supposed to do
- Identify the user-facing behavior boundary

This context helps you write a better issue — but the issue itself should NOT reference specific files, line numbers, or implementation details.

### 3. Assess scope: single issue or breakdown?

Before filing, decide whether this is a **single issue** or needs **breakdown**.

**Break down when**: fix spans multiple independent areas, clearly separable concerns, multiple distinct failure modes.

**Keep as single when**: one behavior wrong in one place, symptoms share a root cause.

### 4. File the issue

Create issues with `bd create`. Issues must be **durable** — they should still make sense after major refactors.

#### Issue template

```
bd create --title="<concise behavior description>" --type=bug --priority=<0-4>
```

Then update the issue body or add comments describing:

- **What happened**: actual behavior in plain language
- **What I expected**: expected behavior
- **Steps to reproduce**: concrete, numbered steps using domain terms (not module names)
- **Additional context**: observations from exploration that frame the issue

#### Rules for all issues

- **No file paths or line numbers** — these go stale
- **Use the project's domain language**
- **Describe behaviors, not code**
- **Reproduction steps are mandatory** — if you can't determine them, ask the user
- **Keep it concise** — a developer should read the issue in 30 seconds

### 5. Continue

After filing, share the issue and ask: "Next issue, or are we done?"

## Anti-Patterns

- Over-interviewing when the codebase can answer the question
- Including file paths or line numbers in issues
- Filing vague issues without reproduction steps
- Batching issues instead of filing as you go
- Asking the user to review before filing — just file and share
