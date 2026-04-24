#!/usr/bin/env bash
INPUT=$(cat)

# Directory + git branch
CWD=$(echo "$INPUT" | jq -r '.workspace.current_dir // .cwd // ""')
[ -z "$CWD" ] && CWD="$PWD"
DIR=$(basename "$CWD")
BRANCH=$(git -C "$CWD" rev-parse --abbrev-ref HEAD 2>/dev/null)
[ -n "$BRANCH" ] && DIR_PART="$DIR  $BRANCH" || DIR_PART="$DIR"

# Changed files + diff stats
STATS=$(git -C "$CWD" diff --shortstat HEAD 2>/dev/null)
if [ -z "$STATS" ]; then
  DIFF_PART="clean"
else
  FILES=$(echo "$STATS" | awk '{print $1}')
  INS=$(echo "$STATS" | awk '{print $4}')
  DEL=$(echo "$STATS" | awk '{print $6}')
  DIFF_PART="${FILES}f +${INS}-${DEL}"
fi

# Context window progress bar (using pre-calculated field from JSON)
PCT=$(echo "$INPUT" | jq -r '.context_window.used_percentage // empty')
if [ -n "$PCT" ]; then
  PCT_INT=${PCT%.*}
  FILLED=$(( PCT_INT / 10 ))
  EMPTY=$(( 10 - FILLED ))
  BAR="[$(printf '█%.0s' $(seq 1 $FILLED 2>/dev/null))$(printf '░%.0s' $(seq 1 $EMPTY 2>/dev/null))] ${PCT_INT}%"
else
  BAR="[░░░░░░░░░░] 0%"
fi

# Model name (strip "claude-" prefix and date suffix like -20251001)
MODEL=$(echo "$INPUT" | jq -r '.model.id // ""' | sed 's/claude-//;s/-[0-9]\{8\}$//')

printf "%s | %s | %s | %s\n" "$DIR_PART" "$DIFF_PART" "$BAR" "$MODEL"
