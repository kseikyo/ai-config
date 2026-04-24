#!/usr/bin/env bash
# check-architecture.sh — Verify program structure integrity
# Usage: bash scripts/check-architecture.sh
# Exits 0 = structure valid, ready to proceed
# Exits 1 = problems found, fix before proceeding

set -uo pipefail

ERRORS=0
WARNINGS=0

error() { echo "✗ ERROR: $1"; ((ERRORS++)); }
warn()  { echo "⚠ WARN:  $1"; ((WARNINGS++)); }
ok()    { echo "✓ OK:    $1"; }

echo "── Checking program architecture ──────────────────────────"

# ── Required files ────────────────────────────────────────────────────────────
if [[ -f .specify/memory/master-plan.md ]]; then
  ok "master-plan.md exists"
  # Check for unfilled TODOs
  todo_count=$(grep -c '\[TODO' .specify/memory/master-plan.md 2>/dev/null || echo 0)
  if [[ "$todo_count" -gt 0 ]]; then
    warn "master-plan.md has $todo_count unfilled [TODO] items"
  fi
else
  error ".specify/memory/master-plan.md missing — run init-program.sh first"
fi

if [[ -f .specify/memory/source-registry.md ]]; then
  ok "source-registry.md exists"
else
  error ".specify/memory/source-registry.md missing — run init-program.sh first"
fi

# ── Phase dirs ────────────────────────────────────────────────────────────────
if [[ -d .specify/specs ]]; then
  phase_dirs=($(find .specify/specs -maxdepth 1 -mindepth 1 -type d 2>/dev/null | sort))
  if [[ ${#phase_dirs[@]} -eq 0 ]]; then
    error ".specify/specs/ has no phase directories — run init-program.sh with phase names"
  else
    ok "Found ${#phase_dirs[@]} phase dir(s): $(basename -a "${phase_dirs[@]}" | tr '\n' ' ')"
  fi

  # For each phase dir, check required files based on apparent state
  for dir in "${phase_dirs[@]}"; do
    phase=$(basename "$dir")

    if [[ ! -f "$dir/objective.md" ]]; then
      error "Phase '$phase': objective.md missing"
      continue
    fi

    # If spec.md exists, plan.md should also exist (or be in progress)
    if [[ -f "$dir/spec.md" ]] && [[ ! -f "$dir/plan.md" ]]; then
      warn "Phase '$phase': spec.md exists but plan.md missing (in-progress?)"
    fi

    # If plan.md exists, tasks.md should also exist
    if [[ -f "$dir/plan.md" ]] && [[ ! -f "$dir/tasks.md" ]]; then
      warn "Phase '$phase': plan.md exists but tasks.md missing (in-progress?)"
    fi

    # If tasks.md exists, count incomplete tasks
    if [[ -f "$dir/tasks.md" ]]; then
      incomplete=$(grep -c '^\- \[ \]' "$dir/tasks.md" 2>/dev/null || echo 0)
      complete=$(grep -c '^\- \[X\]' "$dir/tasks.md" 2>/dev/null || echo 0)
      ok "Phase '$phase': $complete done / $incomplete remaining tasks"
    fi
  done
else
  error ".specify/specs/ directory missing — run init-program.sh first"
fi

# ── Beads alignment ───────────────────────────────────────────────────────────
if command -v bd &>/dev/null; then
  echo ""
  echo "── Checking beads alignment ───────────────────────────────"
  for dir in "${phase_dirs[@]:-}"; do
    [[ -z "${dir:-}" ]] && continue
    phase=$(basename "$dir")
    # Check if beads issue exists with this label
    bd_result=$(bd list --label "$phase" --format json 2>/dev/null | grep -c '"id"' || echo 0)
    if [[ "$bd_result" -gt 0 ]]; then
      ok "Phase '$phase': beads issue found"
    else
      warn "Phase '$phase': no beads issue found (run: bd create --label $phase --title 'Phase: $phase')"
    fi
  done
else
  warn "'bd' not found — skipping beads alignment check"
fi

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
echo "────────────────────────────────────────────────────────"
echo "Errors:   $ERRORS"
echo "Warnings: $WARNINGS"

if [[ $ERRORS -gt 0 ]]; then
  echo "Status:   FAIL — fix errors before proceeding"
  exit 1
else
  echo "Status:   PASS — architecture valid"
  exit 0
fi
