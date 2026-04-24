#!/usr/bin/env bash
# check-drift.sh — Detect scope drift in phase files vs master plan
# Usage: bash scripts/check-drift.sh [phase-name]
#   With phase-name: checks only that phase
#   Without:         checks all phases
# Exits 0 = no drift, safe to gate
# Exits 1 = drift detected, resolve before gating

set -uo pipefail

TARGET_PHASE="${1:-}"
DRIFT_COUNT=0
CHECKED=0

warn() { echo "⚠ DRIFT: $1"; ((DRIFT_COUNT++)); }
ok()   { echo "✓ OK:    $1"; }

# ── Validate master plan exists ───────────────────────────────────────────────
if [[ ! -f .specify/memory/master-plan.md ]]; then
  echo "✗ ERROR: .specify/memory/master-plan.md not found"
  exit 1
fi

# ── Extract scope keywords from master plan ───────────────────────────────────
# Pull "Scope Out" items — these are explicitly excluded and must not appear
# in phase specs as deliverables
scope_out_section=$(awk '/^## Scope Out/,/^## /' .specify/memory/master-plan.md | \
  grep '^\- ' | \
  sed 's/^- \[TODO.*//g' | \
  sed 's/^- //' | \
  tr '[:upper:]' '[:lower:]' | \
  grep -v '^$' || echo "")

# Pull "Scope In" items — phase files should not redefine these broadly
scope_in_section=$(awk '/^## Scope In/,/^## /' .specify/memory/master-plan.md | \
  grep '^\- ' | \
  sed 's/^- \[TODO.*//g' | \
  sed 's/^- //' | \
  tr '[:upper:]' '[:lower:]' | \
  grep -v '^$' || echo "")

echo "── Checking scope drift ──────────────────────────────────"
echo "Scope Out items: $(echo "$scope_out_section" | grep -c '.' || echo 0)"
echo "Scope In items:  $(echo "$scope_in_section" | grep -c '.' || echo 0)"
echo ""

# ── Determine which phases to check ──────────────────────────────────────────
if [[ -n "$TARGET_PHASE" ]]; then
  phase_dirs=(".specify/specs/$TARGET_PHASE")
else
  phase_dirs=($(find .specify/specs -maxdepth 1 -mindepth 1 -type d 2>/dev/null | sort))
fi

if [[ ${#phase_dirs[@]} -eq 0 ]]; then
  echo "No phase directories found in .specify/specs/"
  exit 0
fi

# ── Check each phase ──────────────────────────────────────────────────────────
for dir in "${phase_dirs[@]}"; do
  [[ ! -d "$dir" ]] && { echo "⚠ Phase dir not found: $dir"; continue; }
  phase=$(basename "$dir")
  echo "── Phase: $phase ──"
  ((CHECKED++))

  # Collect all phase content (spec, plan, objective)
  phase_content=""
  for f in "$dir/objective.md" "$dir/spec.md" "$dir/plan.md"; do
    [[ -f "$f" ]] && phase_content+=$(cat "$f" | tr '[:upper:]' '[:lower:]')$'\n'
  done

  if [[ -z "$phase_content" ]]; then
    ok "$phase: no spec files yet (skip)"
    echo ""
    continue
  fi

  # Check: scope out items must not appear in phase deliverables
  if [[ -n "$scope_out_section" ]]; then
    while IFS= read -r keyword; do
      [[ -z "$keyword" ]] && continue
      # Only flag if keyword appears in a deliverable context (near "will", "implement", "add", "build")
      if echo "$phase_content" | grep -qiE "(will|implement|add|build|create|deliver).*${keyword}|${keyword}.*(will|implement|add|build|create|deliver)"; then
        warn "$phase: possible scope-out item referenced as deliverable: '$keyword'"
        echo "       Check: does phase intend to deliver '$keyword'? If yes → update master plan Scope Out."
      fi
    done <<< "$scope_out_section"
  fi

  # Check: phase does not redefine master plan mission (heuristic)
  mission_line=$(grep -A1 '^## Mission' .specify/memory/master-plan.md | tail -1 | tr '[:upper:]' '[:lower:]' || echo "")
  if [[ -n "$mission_line" ]] && [[ "$mission_line" != *"todo"* ]]; then
    # Extract key nouns from mission (simple heuristic: words >5 chars)
    mission_keywords=$(echo "$mission_line" | grep -oE '\b[a-z]{5,}\b' | sort -u | head -10)
    redefined=0
    while IFS= read -r kw; do
      [[ -z "$kw" ]] && continue
      # Flag if phase objective.md contains "our mission is" or "this program" with different context
      if grep -qiE "our (mission|goal|purpose) is" "$dir/objective.md" 2>/dev/null; then
        phase_mission=$(grep -iE "our (mission|goal|purpose) is.*" "$dir/objective.md" | tr '[:upper:]' '[:lower:]')
        if ! echo "$phase_mission" | grep -q "$kw"; then
          ((redefined++))
        fi
      fi
    done <<< "$mission_keywords"
    if [[ $redefined -gt 2 ]]; then
      warn "$phase: objective.md may redefine program mission — compare with master-plan.md ## Mission"
    fi
  fi

  # Check: no master-plan contradictions via explicit "not in scope" markers
  if grep -qiE "not in scope|out of scope|excluded" "$dir/spec.md" 2>/dev/null; then
    phase_exclusions=$(grep -iE "not in scope|out of scope|excluded" "$dir/spec.md" | tr '[:upper:]' '[:lower:]')
    # Check if phase exclusion contradicts master plan scope-in
    while IFS= read -r scope_item; do
      [[ -z "$scope_item" ]] && continue
      if echo "$phase_exclusions" | grep -q "$scope_item"; then
        warn "$phase: spec.md excludes '$scope_item' which is in master plan Scope In"
      fi
    done <<< "$scope_in_section"
  fi

  ok "$phase: checked"
  echo ""
done

# ── Summary ───────────────────────────────────────────────────────────────────
echo "────────────────────────────────────────────────────────"
echo "Phases checked: $CHECKED"
echo "Drift warnings: $DRIFT_COUNT"

if [[ $DRIFT_COUNT -gt 0 ]]; then
  echo "Status:  FAIL — resolve drift before gating phase"
  echo ""
  echo "Resolve options:"
  echo "  A) Update phase file to align with master plan"
  echo "  B) Update master plan (+ log reason in ## Change Log)"
  echo "  Never silently pick one — always document the choice."
  exit 1
else
  echo "Status:  PASS — no scope drift detected"
  exit 0
fi
