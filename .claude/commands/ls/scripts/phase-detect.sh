#!/bin/bash
# phase-detect.sh - Smart phase detection from input text
# Returns recommended starting phase for /ls:shapeup
#
# Usage: phase-detect.sh "input text"
# Output: CAPTURE|QUALIFY|APPETITE|SHAPE|DE-RISK|PITCH|BET|BUILD

set -e

INPUT="${1:-}"

if [ -z "$INPUT" ]; then
    echo "CAPTURE"
    exit 0
fi

# Convert to lowercase for pattern matching
INPUT_LOWER=$(echo "$INPUT" | tr '[:upper:]' '[:lower:]')

# Phase detection patterns (order matters - more specific first)

# BUILD phase indicators
if echo "$INPUT_LOWER" | grep -qE "(track progress|hill chart|week [0-9]|scope hammer|shipping|deployed)"; then
    echo "BUILD"
    exit 0
fi

# BET phase indicators
if echo "$INPUT_LOWER" | grep -qE "(review pitch|betting table|commit to|start cycle|assign team|approved)"; then
    echo "BET"
    exit 0
fi

# PITCH phase indicators
if echo "$INPUT_LOWER" | grep -qE "(pitch|package|present|decision time|no-gos defined)"; then
    echo "PITCH"
    exit 0
fi

# DE-RISK phase indicators
if echo "$INPUT_LOWER" | grep -qE "(risk|rabbit hole|uncertain|not sure about|what could go wrong|spike|unknown)"; then
    echo "DE-RISK"
    exit 0
fi

# SHAPE phase indicators (with appetite)
if echo "$INPUT_LOWER" | grep -qE "(small batch|big batch|1-2 weeks|6 weeks|solution|design|breadboard)"; then
    echo "SHAPE"
    exit 0
fi

# APPETITE phase indicators
if echo "$INPUT_LOWER" | grep -qE "(worth|investment|how much time|appetite|priority p[0-3])"; then
    echo "APPETITE"
    exit 0
fi

# QUALIFY phase indicators - clear problem statements
if echo "$INPUT_LOWER" | grep -qE "(users complain|problem is|bug|error|slow|broken|fails|pain point|issue with)"; then
    echo "QUALIFY"
    exit 0
fi

# CAPTURE phase indicators - vague ideas
if echo "$INPUT_LOWER" | grep -qE "(i want|thinking about|maybe|could we|idea|explore|improve|enhance|wondering)"; then
    echo "CAPTURE"
    exit 0
fi

# Default to CAPTURE for anything unclear
echo "CAPTURE"
