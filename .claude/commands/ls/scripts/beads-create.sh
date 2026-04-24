#!/bin/bash
# beads-create.sh - Batch bead creation from JSON input
# Creates epic/task/subtask hierarchy using bd CLI
#
# Usage: beads-create.sh input.json
#        echo '{"epic":...}' | beads-create.sh -
#
# JSON Schema:
# {
#   "epic": {"title": "...", "description": "...", "priority": "P0-P3", "appetite": "small|big"},
#   "tasks": [
#     {"title": "...", "description": "...", "priority": "P0-P3", "subtasks": ["...", "..."]}
#   ]
# }

set -e

# Read JSON from file or stdin
if [ "$1" = "-" ] || [ -z "$1" ]; then
    JSON=$(cat)
else
    if [ ! -f "$1" ]; then
        echo "Error: File not found: $1" >&2
        exit 1
    fi
    JSON=$(cat "$1")
fi

# Validate JSON
if ! echo "$JSON" | jq empty 2>/dev/null; then
    echo "Error: Invalid JSON input" >&2
    exit 1
fi

# Check if bd is available
if ! command -v bd &>/dev/null; then
    echo "Error: bd CLI not found in PATH" >&2
    exit 1
fi

# Initialize beads if needed
if [ ! -d ".beads" ]; then
    bd init --silent 2>/dev/null || true
fi

# Extract epic info
EPIC_TITLE=$(echo "$JSON" | jq -r '.epic.title // empty')
EPIC_DESC=$(echo "$JSON" | jq -r '.epic.description // ""')
EPIC_PRIORITY=$(echo "$JSON" | jq -r '.epic.priority // "P2"')
EPIC_APPETITE=$(echo "$JSON" | jq -r '.epic.appetite // "big"')

if [ -z "$EPIC_TITLE" ]; then
    echo "Error: Epic title is required" >&2
    exit 1
fi

# Add appetite to description if provided
if [ "$EPIC_APPETITE" != "null" ] && [ -n "$EPIC_APPETITE" ]; then
    EPIC_DESC="[Appetite: $EPIC_APPETITE] $EPIC_DESC"
fi

# Create epic
echo "Creating epic: $EPIC_TITLE"
EPIC_ID=$(bd create --title "$EPIC_TITLE" --description "$EPIC_DESC" --priority "$EPIC_PRIORITY" --silent 2>/dev/null | grep -oE '\.[a-z]+-[a-z0-9]+' | head -1)

if [ -z "$EPIC_ID" ]; then
    # Fallback: try to get ID from bd q
    EPIC_ID=$(bd q "$EPIC_TITLE" --description "$EPIC_DESC" --priority "$EPIC_PRIORITY" 2>/dev/null)
fi

if [ -z "$EPIC_ID" ]; then
    echo "Error: Failed to create epic" >&2
    exit 1
fi

echo "  → Epic ID: $EPIC_ID"

# Process tasks
TASK_COUNT=$(echo "$JSON" | jq '.tasks | length')

for i in $(seq 0 $((TASK_COUNT - 1))); do
    TASK_TITLE=$(echo "$JSON" | jq -r ".tasks[$i].title")
    TASK_DESC=$(echo "$JSON" | jq -r ".tasks[$i].description // \"\"")
    TASK_PRIORITY=$(echo "$JSON" | jq -r ".tasks[$i].priority // \"P2\"")

    echo "Creating task: $TASK_TITLE"
    TASK_ID=$(bd create --title "$TASK_TITLE" --description "$TASK_DESC" --parent "$EPIC_ID" --priority "$TASK_PRIORITY" --silent 2>/dev/null | grep -oE '\.[a-z]+-[a-z0-9]+(\.[0-9]+)?' | head -1)

    if [ -z "$TASK_ID" ]; then
        TASK_ID=$(bd q "$TASK_TITLE" --description "$TASK_DESC" --parent "$EPIC_ID" --priority "$TASK_PRIORITY" 2>/dev/null)
    fi

    echo "  → Task ID: $TASK_ID"

    # Process subtasks
    SUBTASK_COUNT=$(echo "$JSON" | jq ".tasks[$i].subtasks | length // 0")

    if [ "$SUBTASK_COUNT" -gt 0 ]; then
        for j in $(seq 0 $((SUBTASK_COUNT - 1))); do
            SUBTASK=$(echo "$JSON" | jq -r ".tasks[$i].subtasks[$j]")

            # Handle subtask as string or object
            if echo "$SUBTASK" | jq -e 'type == "string"' >/dev/null 2>&1; then
                SUBTASK_TITLE="$SUBTASK"
                SUBTASK_DESC=""
            else
                SUBTASK_TITLE=$(echo "$SUBTASK" | jq -r '.title // empty')
                SUBTASK_DESC=$(echo "$SUBTASK" | jq -r '.description // ""')
            fi

            if [ -n "$SUBTASK_TITLE" ] && [ -n "$TASK_ID" ]; then
                echo "  Creating subtask: $SUBTASK_TITLE"
                SUBTASK_ID=$(bd create --title "$SUBTASK_TITLE" --description "$SUBTASK_DESC" --parent "$TASK_ID" --silent 2>/dev/null | grep -oE '\.[a-z]+-[a-z0-9]+(\.[0-9]+)*' | head -1)
                echo "    → Subtask ID: $SUBTASK_ID"
            fi
        done
    fi
done

echo ""
echo "✅ Created hierarchy under epic $EPIC_ID"
echo "   Run 'bd show $EPIC_ID' to view"
