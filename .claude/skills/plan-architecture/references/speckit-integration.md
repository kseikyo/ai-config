# Spec Kit Integration Reference

Per-phase command sequence, file paths, and integration patterns for `plan-architecture`.

---

## Project Setup (first time only)

Before any phase can run, the Spec Kit project must be initialized in your repo.

**Ask the user which AI assistant they use before running init.** Supported values:
`claude`, `opencode`, `gemini`, `copilot`, `cursor-agent`, `windsurf`, `roo`, `codex`, `kiro-cli`, `agy`, `amp`, `auggie`, `bob`, `codebuddy`, `qodercli`, `qwen`, `shai`, or `generic` (requires `--ai-commands-dir`).

```bash
# Interactive — prompts for AI selection
specify init .

# Or specify directly
specify init . --ai claude
specify init . --ai opencode
```

This downloads the Spec Kit template into the current directory, setting up:
- `.specify/` directory structure
- AI-specific slash commands (`/speckit.specify`, `/speckit.plan`, etc.)
- Constitution template

Run this once per project, before `init-program.sh`.

**Check tools are installed:**
```bash
specify check
```

---

## File Paths

```
.specify/
  memory/
    master-plan.md        ← program scope (created by init-program.sh)
    source-registry.md    ← shared evidence (created by init-program.sh)
    constitution.md       ← engineering principles (created by /speckit.constitution)
  specs/
    [phase-name]/
      objective.md        ← you write this (phase inputs, risks, acceptance criteria)
      spec.md             ← created by /speckit.specify
      plan.md             ← created by /speckit.plan
      tasks.md            ← created by /speckit.tasks
```

---

## Per-Phase Command Sequence

### Step 0: Pre-flight check
```bash
bash scripts/check-architecture.sh
# Must exit 0 before starting a phase
```

### Step 1: Write phase objective
Manually create `.specify/specs/[phase]/objective.md` with:
- **Objective**: what this phase delivers (1-2 sentences)
- **Inputs**: what must exist before this phase (dependencies)
- **Risks**: technical or scope risks
- **Acceptance Criteria**: verifiable completion conditions

### Step 2 (optional): Frame the phase with Shape Up
```
/speckit.shape-up.frame
```
Sets appetite (time box) and boundaries before writing spec.

### Step 3: Generate spec
```
/speckit.specify
```
Reads `objective.md` → creates `.specify/specs/[phase]/spec.md`

Point spec context at `.specify/memory/master-plan.md` to inherit program constraints.

### Step 4: Resolve ambiguities
```
/speckit.clarify
```
Iterative Q&A pass over `spec.md`. Resolves open questions before planning.

### Step 5: Generate plan
```
/speckit.plan
```
Reads `spec.md` → creates `.specify/specs/[phase]/plan.md`

### Step 6: Generate tasks
```
/speckit.tasks
```
Reads `plan.md` → creates `.specify/specs/[phase]/tasks.md` with `[ ]` checkboxes.

### Step 7 (optional): Shape Up bet
```
/speckit.shape-up.bet
```
3-perspective validation (engineer / designer / product). Good gate before implementation.

### Step 8: Implement
```
/speckit.implement
```
Executes `tasks.md` items sequentially. Marks `[ ]` → `[X]` as each completes.

### Step 9: Phase handoff
```bash
bash scripts/check-drift.sh [phase-name]
# Pass → gate the phase
# Fail → resolve first
```

Gate when passing:
```bash
bd set-state [issue-id] done
bd gate release [issue-id]
```

---

## Source Registry Reference Pattern

When a spec or plan cites shared evidence, use registry IDs instead of inline citations:

**In spec.md / plan.md:**
```markdown
Based on user research [src-001] and API constraints [src-003]...
```

**In source-registry.md:**
```markdown
| src-001 | user-research/interviews-q1.md | research | foundation, auth | 12 interviews, Jan 2026 |
| src-003 | api-docs/rate-limits.md        | technical | auth, payments   | 100 req/min limit |
```

This keeps phase files lean and prevents the same source from being described differently in different phases.

---

## Constitution Integration

The constitution (`/speckit.constitution`) is created once and lives at `.specify/memory/constitution.md`. It contains engineering principles that apply to every phase.

When running `/speckit.specify` or `/speckit.plan`, reference the constitution explicitly:
```
/speckit.specify — reference .specify/memory/constitution.md for constraints
```

---

## Shape Up Extension Hooks

Both shape-up commands are optional but valuable at specific moments:

| Command | When to use | What it produces |
|---------|-------------|------------------|
| `/speckit.shape-up.frame` | Before spec, when scope is fuzzy | Appetite, boundaries, non-goals |
| `/speckit.shape-up.bet` | After tasks, before implement | Engineer/designer/product sign-off |

Use `frame` to prevent over-speccing. Use `bet` to prevent under-validating.

---

## Multi-Phase Dependency Example

Given phases: `foundation` → `auth` → `payments`

```bash
# Initialize
bash scripts/init-program.sh foundation auth payments

# Phase 1: foundation
# ... write objective.md, run speckit sequence, implement ...
bash scripts/check-drift.sh foundation  # must pass
bd set-state [foundation-id] done

# Phase 2: auth (depends on foundation being done)
bash scripts/check-architecture.sh      # verifies foundation complete
# ... run speckit sequence for auth ...
bash scripts/check-drift.sh auth
bd gate release [auth-id]

# Phase 3: payments (depends on auth)
# etc.
```
