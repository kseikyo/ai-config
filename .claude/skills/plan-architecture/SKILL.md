---
name: plan-architecture
description: "Program-level orchestration for projects too large for a single spec. Creates master plan + source registry, decomposes into bounded phases, executes each through Spec Kit (specify, plan, tasks, implement), enforces coherence, uses beads for phase tracking. Trigger phrases: project too large for one spec, multi-feature planning, master plan + phases, orchestrate multiple specs, planning drift/fragmentation, program-level plan."
---

# Plan Architecture

> **Scripts**: `scripts/init-program.sh` scaffolds the file structure and creates beads issues.
> **Verification**: `scripts/check-architecture.sh` (pre-flight) and `scripts/check-drift.sh` (post-phase).
> **Spec Kit reference**: see `references/speckit-integration.md`
> **Beads reference**: see `references/beads-usage.md`

Meta-orchestrator for programs spanning multiple features. Spec Kit handles individual features — this skill coordinates them.

**Philosophy**: Good architecture emerges from thin vertical slices, not horizontal layers. Each phase should deliver a narrow but complete path through every integration layer — demoable, verifiable, independently valuable. Horizontal decomposition (all schemas first, then all APIs, then all UI) creates integration risk that compounds with each phase. Vertical slices surface integration issues early when they're cheapest to fix.

<background_information>
Use when program scope exceeds a single spec. Signs: multiple independent feature areas, cross-team dependencies, phased delivery, >3 distinct user journeys.

- Constitution = engineering principles (created once via `/speckit.constitution`)
- Master plan = program scope/sequencing/dependencies (created by this skill)
- Spec Kit = per-feature execution (specifies, plans, tasks, implements each phase)
- Beads (bd/bv) = phase-level issue tracking and gate coordination

This skill does NOT replace any of the above — it orchestrates them.
</background_information>

<architecture>
Three required components:

1. **Master plan** — scope, phases, deps, constraints, links
   - Path: `.specify/memory/master-plan.md`
   - Source of truth: wins over all phase files

2. **Source registry** — shared cross-feature evidence and citations
   - Path: `.specify/memory/source-registry.md`
   - Source of truth: wins over scattered inline citations

3. **Phase files** — per-phase inputs/outputs feeding Spec Kit
   - Path: `.specify/specs/[phase-name]/`
   - Contains: `objective.md` → `spec.md` → `plan.md` → `tasks.md`
</architecture>

<instructions>
## Program initialization

0. If Spec Kit not yet set up: ask the user which AI they use, then run `specify init . --ai [claude|opencode|gemini|...]` (one-time — see `references/speckit-integration.md` for all options)
1. Run `bash scripts/init-program.sh [phase1] [phase2] ...` — scaffolds files + creates beads issues per phase
2. Run `/speckit.constitution` once if not already exists
3. Fill `.specify/memory/master-plan.md`:
   - Mission statement (one sentence)
   - Scope in / scope out
   - Constraints (tech, time, team)
   - Phase list with dependencies between phases
   - Links to key references

## Per-phase execution (repeat for each phase)

1. Write `.specify/specs/[phase]/objective.md` — objective, inputs, risks, acceptance criteria
   - ⚠️ Each phase must be a **vertical slice**: narrow end-to-end path through all layers (schema → API → UI → tests), NOT a horizontal layer
   - A completed phase must be demoable or verifiable on its own
2. *(optional)* Design-it-twice: spawn 2-3 sub-agents with different design constraints to explore alternative phase interfaces before committing
3. *(optional)* `/speckit.shape-up.frame` — appetite + boundaries
3. `/speckit.specify` — creates `spec.md`
4. `/speckit.clarify` — resolves open ambiguities
5. `/speckit.plan` — creates `plan.md`
6. `/speckit.tasks` — creates `tasks.md` (checkbox tracking)
7. *(optional)* `/speckit.shape-up.bet` — 3-perspective validation
8. `/speckit.implement` — executes tasks `[ ]` → `[X]`
9. Phase handoff:
   ```
   bash scripts/check-drift.sh
   ```
   - **Pass** → `bd set-state [phase] done`, `bd gate release`, proceed to next phase
   - **Fail** → flag `requires master-plan update`, stop and resolve before continuing

## Source of truth rules

- Master plan wins over all phase files
- Source registry wins over scattered citations
- Contradiction found → update master plan OR flag explicitly — no silent drift
- If a phase redefines scope from master plan → stop, escalate, resolve
</instructions>

<tool_guidance>
```
Program status:    bv --robot-triage --format toon
Next action:       bv --robot-next
Phase plan:        bv --robot-plan --label [phase-name]
Full bv reference: see references/beads-usage.md
```

⚠️ NEVER run bare `bv` — launches interactive TUI that blocks session
⚠️ ALWAYS use `--robot-*` flags with bv
</tool_guidance>

<verification_checklist>
**Before executing any phase:**
```bash
bash scripts/check-architecture.sh
# exits 0 = ready to proceed
# exits 1 = fix missing files first
```

**After each phase completes:**
```bash
bash scripts/check-drift.sh
# exits 0 = no drift detected, safe to gate
# exits 1 = scope keywords redefined in phase files, resolve before gating
```
</verification_checklist>

<guardrails>
## Anti-fragmentation

- One master plan per program. No "mini master plans" per phase.
- Source registry is append-only during execution. Remove entries only at explicit phase boundaries.
- Phase files inherit constraints from master plan — they do not override them.
- If a phase spec contradicts master plan scope: **stop**, update master plan with explicit rationale, then continue.

## Conflict escalation

When phase file conflicts with master plan:
1. Do NOT silently pick one. Surface the conflict explicitly.
2. Ask: "Does this change the program mission?" If yes → update master plan + notify stakeholders.
3. If no → update phase file to align with master plan.
4. Record the resolution in `.specify/memory/master-plan.md` under `## Change Log`.

## Beads gate discipline

- Do not gate a phase until `check-drift.sh` exits 0.
- Do not start a new phase until previous phase is gated (`bd gate release`).
- Phase dependencies declared in master plan are enforced by beads deps — do not bypass.

## Ask vs explore

- **Explore first**: existing architecture, patterns, integration points, test coverage, dependencies
- **Ask the user**: product priorities, stakeholder constraints, timeline/appetite, scope trade-offs
- If the codebase can answer it, don't ask

## Anti-patterns

- **Horizontal slicing**: "Phase 1: all schemas, Phase 2: all APIs, Phase 3: all UI" — integration risk compounds
- **Monolithic phases**: phases so large they can't be independently verified
- **Scope creep via phase files**: phase specs that silently redefine master plan scope
- **Premature optimization**: over-engineering phase boundaries before understanding the domain
- **Skipping design exploration**: committing to the first architecture that comes to mind without considering alternatives
</guardrails>
