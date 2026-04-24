#!/bin/bash
# hill-chart.sh - ASCII hill chart visualization using bv --robot-* commands
# Renders items ON the hill at their respective positions
#
# Usage: hill-chart.sh [--json] [--compact]
#
# Uses: bv --robot-triage for issue list, bv --robot-insights for metrics

set -e

JSON_OUTPUT=false
COMPACT=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --json) JSON_OUTPUT=true; shift ;;
        --compact) COMPACT=true; shift ;;
        *) shift ;;
    esac
done

# Check bv availability
command -v bv &>/dev/null || { echo "Error: bv not found" >&2; exit 1; }

# Get triage data
TRIAGE=$(bv --robot-triage 2>/dev/null)
[ -z "$TRIAGE" ] && { echo "Error: No triage data" >&2; exit 1; }

# Get insights for velocity/parallel info
INSIGHTS=$(bv --robot-insights 2>/dev/null)

# Extract metrics
CLOSED_7D=$(echo "$INSIGHTS" | jq -r '.Velocity.closed_last_7_days // 0')
MAX_PARALLEL=$(echo "$INSIGHTS" | jq -r '.advanced_insights.parallel_cut.max_parallel // 0')

# Status to position (1-10, 5=peak)
# Shape Up: uphill=figuring out, peak=transition, downhill=executing
status_to_pos() {
    case "$1" in
        open|backlog) echo 2 ;;
        blocked|waiting) echo 3 ;;
        investigating|planning) echo 4 ;;
        in-progress|active) echo 5 ;;
        reviewing|review) echo 6 ;;
        testing|qa) echo 7 ;;
        deploying|staging) echo 8 ;;
        done|closed|shipped) echo 9 ;;
        *) echo 3 ;;
    esac
}

# Build position data from triage recommendations
build_data() {
    echo "$TRIAGE" | jq -r '.triage.recommendations[] | "\(.id)|\(.title)|\(.status)"' 2>/dev/null | while IFS='|' read -r id title status; do
        [ -z "$id" ] && continue
        status=$(echo "$status" | tr '[:upper:]' '[:lower:]')
        pos=$(status_to_pos "$status")
        # Get short ID - just the suffix number or short form
        short=$(echo "$id" | sed 's/^\.//' | sed 's/.*\.//')
        # If it's a number, prefix with #
        if [[ "$short" =~ ^[0-9]+$ ]]; then
            short="#$short"
        fi
        [ ${#short} -gt 6 ] && short="${short:0:6}"
        echo "$pos|$short|$status"
    done
}

# Get items for a position from data
get_items_for_pos() {
    local data="$1"
    local target="$2"
    echo "$data" | grep "^$target|" | cut -d'|' -f2 | head -3 | tr '\n' ',' | sed 's/,$//'
}

# Render hill with items positioned on it
render_hill() {
    local data="$1"

    # Get items per position
    local p2=$(get_items_for_pos "$data" "2")  # open
    local p3=$(get_items_for_pos "$data" "3")  # blocked/unknown
    local p4=$(get_items_for_pos "$data" "4")  # planning
    local p5=$(get_items_for_pos "$data" "5")  # in-progress (peak)
    local p6=$(get_items_for_pos "$data" "6")  # reviewing
    local p7=$(get_items_for_pos "$data" "7")  # testing
    local p8=$(get_items_for_pos "$data" "8")  # deploying
    local p9=$(get_items_for_pos "$data" "9")  # done

    echo ""
    echo "  ═══════════════════════════════════════════════════════════════"
    echo "                           HILL CHART"
    echo "  ═══════════════════════════════════════════════════════════════"
    echo ""

    # Hill with items positioned on slopes
    printf "                              ╱╲\n"
    printf "                             ╱  ╲\n"
    if [ -n "$p5" ]; then
        printf "                            ╱ ● ╲  ← %s\n" "$p5"
    else
        printf "                            ╱    ╲\n"
    fi
    printf "                           ╱    ╲\n"
    if [ -n "$p4" ] || [ -n "$p6" ]; then
        printf "              %12s ╱      ╲ %-12s\n" "$p4" "$p6"
    else
        printf "                          ╱        ╲\n"
    fi
    if [ -n "$p3" ] || [ -n "$p7" ]; then
        printf "        %16s ╱          ╲ %-16s\n" "$p3" "$p7"
    else
        printf "                        ╱            ╲\n"
    fi
    if [ -n "$p2" ] || [ -n "$p8" ]; then
        printf "    %20s ╱              ╲ %-20s\n" "$p2" "$p8"
    else
        printf "                      ╱                ╲\n"
    fi
    printf "                    ╱                    ╲\n"
    printf "       ────────────╱                      ╲────────────\n"
    if [ -n "$p9" ]; then
        printf "                                                   ✓ %s\n" "$p9"
    fi
    echo ""
    printf "       ◀── FIGURING OUT                    EXECUTING ──▶\n"
    echo ""

    # Quick ref from triage
    local open=$(echo "$TRIAGE" | jq -r '.triage.quick_ref.open_count // 0')
    local actionable=$(echo "$TRIAGE" | jq -r '.triage.quick_ref.actionable_count // 0')
    local blocked=$(echo "$TRIAGE" | jq -r '.triage.quick_ref.blocked_count // 0')
    local in_prog=$(echo "$TRIAGE" | jq -r '.triage.quick_ref.in_progress_count // 0')
    echo "  ───────────────────────────────────────────────────────────────"
    echo "  OPEN: $open | ACTIONABLE: $actionable | BLOCKED: $blocked | IN-PROGRESS: $in_prog"
    echo "  VELOCITY: $CLOSED_7D closed (7d) | PARALLEL: $MAX_PARALLEL concurrent"
    echo ""
}

# JSON output
render_json() {
    local data="$1"

    local items=$(echo "$data" | while IFS='|' read -r pos short status; do
        [ -z "$pos" ] && continue
        phase=""
        if [ "$pos" -le 4 ]; then
            phase="uphill"
        elif [ "$pos" -eq 5 ]; then
            phase="peak"
        elif [ "$pos" -le 9 ]; then
            phase="downhill"
        else
            phase="done"
        fi
        echo "{\"id\":\"$short\",\"status\":\"$status\",\"position\":$pos,\"phase\":\"$phase\"}"
    done | jq -s '.')

    jq -n --argjson items "$items" \
          --argjson closed "$CLOSED_7D" \
          --argjson parallel "$MAX_PARALLEL" \
          '{items: $items, velocity: {closed_7d: $closed}, max_parallel: $parallel}'
}

# Main
DATA=$(build_data)
[ -z "$DATA" ] && { echo "No issues"; exit 0; }

if [ "$JSON_OUTPUT" = true ]; then
    render_json "$DATA"
else
    render_hill "$DATA"
fi
