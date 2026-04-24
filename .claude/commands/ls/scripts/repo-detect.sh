#!/bin/bash
# repo-detect.sh - Detect git repos and determine .beads/ placement
# Handles single-repo and multi-repo (monorepo parent) scenarios
#
# Usage: repo-detect.sh [directory]
# Output: JSON with repo info and recommended .beads/ location
#
# Cases:
# 1. Current dir has .git → use local .beads/
# 2. Parent (non-repo) contains repos → use parent .beads/ for cross-repo
# 3. No git repos found → use current dir .beads/

set -e

TARGET_DIR="${1:-.}"
TARGET_DIR=$(cd "$TARGET_DIR" && pwd)

# Output JSON
output_json() {
    local type="$1"
    local beads_path="$2"
    local git_root="$3"
    local repos="$4"

    cat <<EOF
{
  "type": "$type",
  "beads_path": "$beads_path",
  "git_root": "$git_root",
  "detected_repos": $repos,
  "recommendation": "$(get_recommendation "$type")"
}
EOF
}

get_recommendation() {
    case "$1" in
        "single-repo")
            echo "Use local .beads/ for this repository"
            ;;
        "multi-repo")
            echo "Use parent .beads/ to track issues across repositories"
            ;;
        "no-repo")
            echo "Initialize .beads/ in current directory"
            ;;
        *)
            echo "Unknown configuration"
            ;;
    esac
}

# Check if directory is a git repo
is_git_repo() {
    git -C "$1" rev-parse --git-dir >/dev/null 2>&1
}

# Get git root for a directory
get_git_root() {
    git -C "$1" rev-parse --show-toplevel 2>/dev/null
}

# Find child git repos (max depth 2)
find_child_repos() {
    local dir="$1"
    local repos=()

    # Find .git directories within 2 levels
    while IFS= read -r git_dir; do
        if [ -n "$git_dir" ]; then
            repo_path=$(dirname "$git_dir")
            repos+=("\"$repo_path\"")
        fi
    done < <(find "$dir" -maxdepth 3 -name ".git" -type d 2>/dev/null)

    # Return JSON array
    if [ ${#repos[@]} -eq 0 ]; then
        echo "[]"
    else
        echo "[$(IFS=,; echo "${repos[*]}")]"
    fi
}

# Main detection logic
main() {
    # Case 1: Current directory is a git repo
    if is_git_repo "$TARGET_DIR"; then
        GIT_ROOT=$(get_git_root "$TARGET_DIR")
        output_json "single-repo" "$GIT_ROOT/.beads" "$GIT_ROOT" "[\"$GIT_ROOT\"]"
        return 0
    fi

    # Case 2: Check for child repos (multi-repo/monorepo scenario)
    CHILD_REPOS=$(find_child_repos "$TARGET_DIR")
    REPO_COUNT=$(echo "$CHILD_REPOS" | jq 'length')

    if [ "$REPO_COUNT" -gt 0 ]; then
        output_json "multi-repo" "$TARGET_DIR/.beads" "null" "$CHILD_REPOS"
        return 0
    fi

    # Case 3: Check parent directories for git repo
    CURRENT="$TARGET_DIR"
    while [ "$CURRENT" != "/" ]; do
        PARENT=$(dirname "$CURRENT")

        if is_git_repo "$PARENT"; then
            GIT_ROOT=$(get_git_root "$PARENT")
            output_json "single-repo" "$GIT_ROOT/.beads" "$GIT_ROOT" "[\"$GIT_ROOT\"]"
            return 0
        fi

        # Check if parent has multiple repos
        PARENT_REPOS=$(find_child_repos "$PARENT")
        PARENT_REPO_COUNT=$(echo "$PARENT_REPOS" | jq 'length')

        if [ "$PARENT_REPO_COUNT" -gt 1 ]; then
            output_json "multi-repo" "$PARENT/.beads" "null" "$PARENT_REPOS"
            return 0
        fi

        CURRENT="$PARENT"
    done

    # Case 4: No git repos found
    output_json "no-repo" "$TARGET_DIR/.beads" "null" "[]"
}

main
