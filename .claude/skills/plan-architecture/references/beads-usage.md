# Beads Usage Reference (plan-architecture scope)

Scoped reference for `bd` and `bv` commands relevant to program-level orchestration.
This is NOT the full beads documentation — only commands used by this skill.

⚠️ NEVER run bare `bv` — it launches an interactive TUI that blocks the session.
⚠️ ALWAYS use `--robot-*` flags or non-interactive `bd` subcommands.

---

## bv — Program Status (read-only, robot mode)

### Get program triage
```bash
bv --robot-triage --format toon
```
Token-optimized summary of all open issues. Use at program start or when context is stale.

### Get next actionable
```bash
bv --robot-next
```
Returns the single highest-priority next action. Use when unsure what to do next.

### Get phase plan
```bash
bv --robot-plan --label [phase-name]
```
Returns planned work for a specific phase label. Use before starting a phase.

### Diff since last check
```bash
bv --robot-diff
```
Shows what changed since last triage. Useful after returning from context gap.

---

## bd — Issue Management (write)

### Create a phase issue
```bash
bd create --label [phase-name] --title "Phase: [phase-name]"
```

### Create with dependency
```bash
bd create --label [phase-name] --title "Phase: [phase-name]" --deps [prior-issue-id]
```
Deps enforce sequencing — beads will not mark a dependent issue ready until its deps are done.

### Set phase state
```bash
bd set-state [issue-id] done       # phase complete
bd set-state [issue-id] in-progress
bd set-state [issue-id] blocked
```

### Gate a phase (release to next)
```bash
bd gate release [issue-id]
```
Signals that the phase has passed its gate check and the next phase can begin.

### List issues for a phase
```bash
bd list --label [phase-name]
bd list --label [phase-name] --format json   # machine-readable
```

---

## Excluded Commands

The following are available in full beads docs but NOT used by this skill:
- `bv --burndown` — sprint charts
- `bv --forecast` — delivery forecasting
- `bv --label-health` — label hygiene
- `bv --label-flow` — flow metrics
- `bv --graph export` — graph visualization
- `bv --insights` — aggregate analytics

These are out of scope for program-level orchestration. Use directly if needed.

---

## Phase Lifecycle in Beads

```
pending → in-progress → done (gated)
         ↓
       blocked
```

1. `init-program.sh` creates issues with deps between phases
2. Phase starts: `bd set-state [id] in-progress`
3. Phase drifts: `bd set-state [id] blocked` (then resolve)
4. Phase complete: verify with `check-drift.sh`, then `bd set-state [id] done`
5. Gate: `bd gate release [id]` → unblocks dependent phases
