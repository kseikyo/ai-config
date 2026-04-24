#!/usr/bin/env bash
# init-program.sh — Scaffold master plan, source registry, phase dirs, beads issues
# Usage: bash scripts/init-program.sh [phase1] [phase2] ...
# Example: bash scripts/init-program.sh foundation auth payments notifications

set -euo pipefail

PHASES=("$@")

if [[ ${#PHASES[@]} -eq 0 ]]; then
  echo "Usage: bash scripts/init-program.sh [phase1] [phase2] ..."
  echo "Example: bash scripts/init-program.sh foundation auth payments"
  exit 1
fi

# ── Dirs ─────────────────────────────────────────────────────────────────────
mkdir -p .specify/memory
mkdir -p .specify/specs

echo "✓ Created .specify/memory/ and .specify/specs/"

# ── Master plan ───────────────────────────────────────────────────────────────
if [[ ! -f .specify/memory/master-plan.md ]]; then
  cat > .specify/memory/master-plan.md << 'TEMPLATE'
# Master Plan

> Source of truth for program scope, sequencing, and dependencies.
> This file wins over all phase files. Update here; never override in phase files.

## Mission

[TODO: One sentence — what is this program trying to achieve?]

## Scope In

- [TODO: capability 1]
- [TODO: capability 2]

## Scope Out

- [TODO: explicitly excluded area 1]
- [TODO: explicitly excluded area 2]

## Constraints

- Tech: [TODO: stack, runtime, infra constraints]
- Time: [TODO: deadline or appetite]
- Team: [TODO: size, skills, availability]

## Phases

<!-- List in execution order. Mark deps explicitly. -->

| Phase | Description | Depends On | Status |
|-------|-------------|------------|--------|
| TODO  | TODO        | -          | pending |

## Links

- Constitution: `.specify/memory/constitution.md`
- Source registry: `.specify/memory/source-registry.md`
- [TODO: add relevant external references]

## Change Log

<!-- Record all scope/constraint changes with date and rationale -->

| Date | Change | Rationale |
|------|--------|-----------|
TEMPLATE
  echo "✓ Created .specify/memory/master-plan.md"
else
  echo "⚠  .specify/memory/master-plan.md already exists — skipping"
fi

# ── Source registry ───────────────────────────────────────────────────────────
if [[ ! -f .specify/memory/source-registry.md ]]; then
  cat > .specify/memory/source-registry.md << 'TEMPLATE'
# Source Registry

> Shared evidence and citations used across phases.
> Append-only during execution. Remove entries only at explicit phase boundaries.
> This file wins over scattered inline citations in phase files.

## Format

| ID | Source | Type | Used By | Notes |
|----|--------|------|---------|-------|

## Entries

<!-- Add rows as you discover shared evidence -->
<!-- Example: -->
<!-- | src-001 | user-research/interviews-q1.md | research | foundation, auth | 12 interviews, Jan 2026 | -->
TEMPLATE
  echo "✓ Created .specify/memory/source-registry.md"
else
  echo "⚠  .specify/memory/source-registry.md already exists — skipping"
fi

# ── Phase dirs ────────────────────────────────────────────────────────────────
for phase in "${PHASES[@]}"; do
  dir=".specify/specs/$phase"
  if [[ ! -d "$dir" ]]; then
    mkdir -p "$dir"
    cat > "$dir/objective.md" << PHASE_TEMPLATE
# Phase: $phase

## Objective

[TODO: 1-2 sentences — what does this phase deliver?]

## Inputs

- [TODO: what must exist before this phase starts]

## Risks

- [TODO: technical or scope risks for this phase]

## Acceptance Criteria

- [ ] [TODO: verifiable outcome 1]
- [ ] [TODO: verifiable outcome 2]

## Source Registry References

<!-- List src-XXX IDs from .specify/memory/source-registry.md that apply here -->
PHASE_TEMPLATE
    echo "✓ Created $dir/objective.md"
  else
    echo "⚠  $dir already exists — skipping"
  fi
done

# ── Beads issues ──────────────────────────────────────────────────────────────
if command -v bd &>/dev/null; then
  echo ""
  echo "Creating beads issues for phases..."
  prev_id=""
  for phase in "${PHASES[@]}"; do
    # Create issue; capture ID from output
    if [[ -n "$prev_id" ]]; then
      issue_id=$(bd create --label "$phase" --title "Phase: $phase" --deps "$prev_id" 2>&1 | grep -oE '[0-9]+' | head -1 || echo "")
    else
      issue_id=$(bd create --label "$phase" --title "Phase: $phase" 2>&1 | grep -oE '[0-9]+' | head -1 || echo "")
    fi

    if [[ -n "$issue_id" ]]; then
      echo "✓ Created beads issue #$issue_id for phase: $phase"
      prev_id="$issue_id"
    else
      echo "⚠  Could not parse issue ID for phase: $phase (bd create may have succeeded anyway)"
    fi
  done
else
  echo ""
  echo "⚠  'bd' not found — skipping beads issue creation"
  echo "   To create issues manually: bd create --label [phase] --title 'Phase: [phase]'"
fi

echo ""
echo "────────────────────────────────────────────────────────"
echo "Program scaffolded. Next steps:"
echo "  1. Fill .specify/memory/master-plan.md (mission, scope, constraints)"
echo "  2. Run /speckit.constitution if constitution doesn't exist yet"
echo "  3. Run: bash scripts/check-architecture.sh"
echo "  4. Begin Phase 1: write objective.md → /speckit.specify → ..."
echo "────────────────────────────────────────────────────────"
