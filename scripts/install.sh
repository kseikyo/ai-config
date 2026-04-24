#!/usr/bin/env bash
# Restore tracked config into ~/.claude and ~/.pi.
#
# Behaviour:
#   - Refuses to overwrite existing files unless --force is passed.
#   - Makes timestamped backups of any clobbered files.
#   - Does NOT touch state dirs (sessions, transcripts, caches, ...).
#   - Never restores secrets — redacted __REDACTED__ tokens must be
#     replaced by the user after install.
set -euo pipefail

FORCE=0
if [[ "${1:-}" == "--force" ]]; then FORCE=1; fi

REPO="$(cd "$(dirname "$0")/.." && pwd)"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"

copy_tree() {
  local src="$1" dst="$2"
  [[ -d "$src" ]] || return 0
  mkdir -p "$dst"
  # Use rsync when available for cleaner semantics; fall back to cp.
  if command -v rsync >/dev/null; then
    local flags=(-a)
    [[ $FORCE -eq 1 ]] || flags+=(--ignore-existing)
    [[ $FORCE -eq 1 ]] && flags+=(--backup --suffix=".bak-$STAMP")
    rsync "${flags[@]}" "$src"/ "$dst"/
  else
    cp -Rn "$src"/. "$dst"/
  fi
}

echo "[install] target: $HOME/.claude and $HOME/.pi"
copy_tree "$REPO/.claude" "$HOME/.claude"
copy_tree "$REPO/.pi"     "$HOME/.pi"

# Exec bits for scripts
chmod +x "$HOME/.claude/hooks/"*.sh 2>/dev/null || true
chmod +x "$HOME/.claude/statusline-command.sh" 2>/dev/null || true

echo "[install] done"
echo
echo "Next steps:"
echo "  1. Replace __REDACTED__ tokens in ~/.claude/settings.json"
echo "     (search for Bearer __REDACTED__ and any mcpServers entries)."
echo "  2. Review ~/.claude/settings.json permissions allowlist — prune to taste."
echo "  3. If you use external skill projects (engram, etc.), re-create symlinks"
echo "     under ~/.claude/skills pointing to your local copies."
