#!/bin/bash
LOG=~/.claude/hooks/strip-claude-coauthor.log
ts() { date -u +'%Y-%m-%dT%H:%M:%SZ'; }
log() { printf '%s %s\n' "$(ts)" "$*" >> "$LOG"; }

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command' 2>/dev/null)
log "fired cwd=$PWD cmd=$(printf '%s' "$COMMAND" | head -c 80)"

# Match any command that mentions `git` AND `commit` as whole words. Cheap,
# robust to any option order (`git -C DIR commit`, `git --no-verify commit`,
# `cd X && git commit`, etc). False-positive on strings like
# `echo "git commit"` is acceptable — next check reads actual HEAD anyway.
if ! printf '%s' "$COMMAND" | grep -qE '\bgit\b' \
   || ! printf '%s' "$COMMAND" | grep -qE '\bcommit\b'; then
  log "skip: no git+commit tokens"
  exit 0
fi
if echo "$COMMAND" | grep -qE -- "--amend"; then
  log "skip: --amend"
  exit 0
fi

# Locate the target repo. Preference order:
#   1. `git -C DIR commit` form → use DIR
#   2. leading `cd DIR &&` → use DIR
#   3. fall back to $PWD
TARGET_DIR=""
if [[ "$COMMAND" =~ git[[:space:]]+-C[[:space:]]+([^[:space:]]+)[[:space:]]+([^[:space:]]+[[:space:]]+)*commit ]]; then
  TARGET_DIR="${BASH_REMATCH[1]}"
elif [[ "$COMMAND" =~ ^[[:space:]]*cd[[:space:]]+([^[:space:]&|;]+) ]]; then
  TARGET_DIR="${BASH_REMATCH[1]}"
fi
if [[ -n "$TARGET_DIR" ]]; then
  TARGET_DIR="${TARGET_DIR%\"}"; TARGET_DIR="${TARGET_DIR#\"}"
  TARGET_DIR="${TARGET_DIR%\'}"; TARGET_DIR="${TARGET_DIR#\'}"
fi
GIT=(git)
if [[ -n "$TARGET_DIR" ]]; then
  GIT=(git -C "$TARGET_DIR")
  log "using -C $TARGET_DIR"
fi

if ! "${GIT[@]}" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  log "skip: target ${TARGET_DIR:-$PWD} is not a git work tree"
  exit 0
fi

MSG=$("${GIT[@]}" log -1 --format=%B 2>/dev/null)
if [[ -z "$MSG" ]]; then
  log "skip: empty git log -1 output"
  exit 0
fi

if ! printf '%s\n' "$MSG" | grep -qiE "^Co-Authored-By:"; then
  log "ok: no trailer in $("${GIT[@]}" rev-parse --short HEAD)"
  exit 0
fi

CLEAN_MSG=$(printf '%s\n' "$MSG" | grep -viE "^Co-Authored-By:" | sed -e :a -e '/^[[:space:]]*$/{$d;N;ba' -e '}')

if "${GIT[@]}" commit --amend -m "$CLEAN_MSG" >>"$LOG" 2>&1; then
  log "stripped trailer from $("${GIT[@]}" rev-parse --short HEAD)"
else
  log "FAIL: amend rejected"
  exit 1
fi
