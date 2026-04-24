#!/bin/bash
# Gather deterministic handoff context for Claude to use as a scaffold

echo "=== KEY FILES ==="
echo "-- Modified/staged (git status) --"
git status --short 2>/dev/null || echo "(not a git repo)"
echo ""
echo "-- Recently changed (last 10 commits) --"
git diff --name-only HEAD~10..HEAD 2>/dev/null | sort -u | head -20
echo ""

echo "=== CURRENT STATE ==="
echo "-- Branch & last commits --"
git log --oneline -5 2>/dev/null
echo ""
echo "-- Uncommitted changes --"
git diff --stat HEAD 2>/dev/null

echo ""
echo "=== PENDING TASKS (beads) ==="
if command -v bv &>/dev/null; then
  bv --robot-triage 2>/dev/null || echo "(bv not available in this workspace)"
elif command -v bd &>/dev/null; then
  bd list --status=open 2>/dev/null || echo "(no open tasks)"
else
  echo "(beads not available — Claude: use TaskList tool as fallback)"
fi
