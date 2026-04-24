#!/bin/bash
# PreCompact hook: ensure auto-compaction always produces a handoff summary

cat <<'EOF'
Compact this session into a HANDOFF SUMMARY using this exact format:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HANDOFF SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

USER REQUESTS
• [verbatim user goals — do NOT paraphrase]

GOAL
[1 sentence]

WORK COMPLETED
• [what was done, with file paths where relevant]

CURRENT STATE
[current state of the work]

PENDING TASKS
• [what remains, in priority order]

KEY FILES (max 10)
• path/to/file — [why it matters]

IMPORTANT DECISIONS
• [decisions and rationale]

EXPLICIT CONSTRAINTS
• [verbatim constraints only — do not invent]

CONTEXT FOR CONTINUATION
[2-3 sentences of nuance needed to continue without confusion]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EOF
exit 0
