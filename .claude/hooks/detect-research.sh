#!/usr/bin/env bash
# UserPromptSubmit hook: detect research-like prompts and inject researcher skill directive.
# Reads JSON from stdin, checks user_input for research signals, emits additionalContext if matched.

set -uo pipefail

INPUT=$(cat)
PROMPT=$(echo "$INPUT" | jq -r '.user_input // empty' 2>/dev/null || true)

[ -z "$PROMPT" ] && exit 0

LP=$(echo "$PROMPT" | tr '[:upper:]' '[:lower:]')

SCORE=0

# Strong signals: explicit research verbs
if echo "$LP" | grep -qiE '\b(research|investigate|look up|look into|verify .*(findings|data|prices|costs|claims|numbers|math)|validate .*(findings|handoff|data|prices))\b'; then
  SCORE=$((SCORE + 2))
fi

# Medium signals: comparison/analysis verbs + web context
if echo "$LP" | grep -qiE '\b(compare|summarize sources|what do people say|market (research|analysis|price)|price check)\b'; then
  SCORE=$((SCORE + 1))
fi

# URL signals: 2+ URLs suggest multi-source research
URL_COUNT=$(echo "$PROMPT" | grep -oiE 'https?://[^ ]+' | wc -l | tr -d ' ')
if [ "$URL_COUNT" -ge 2 ]; then
  SCORE=$((SCORE + 2))
elif [ "$URL_COUNT" -eq 1 ]; then
  SCORE=$((SCORE + 1))
fi

# Threshold: score >= 2 triggers the directive
if [ "$SCORE" -ge 2 ]; then
  cat <<'EOF'
{
  "hookSpecificOutput": {
    "hookEventName": "UserPromptSubmit",
    "additionalContext": "RESEARCHER SKILL DETECTED: This prompt involves multi-source web research. You MUST follow the researcher skill workflow at ~/.claude/skills/researcher/SKILL.md. Steps: (1) bun run scripts/doctor.ts, (2) bun run scripts/select.ts with the query, (3) bun run scripts/new_run.ts with selected tools, (4) Edit the runner with input+body, (5) bun run scripts/run.ts, (6) synthesize answer. Do NOT use bare WebFetch/WebSearch for multi-source tasks — use the Bun runner for parallel execution and stats tracking."
  }
}
EOF
fi
