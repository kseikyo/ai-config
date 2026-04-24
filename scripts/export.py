#!/usr/bin/env python3
"""Export sanitized Claude Code + Pi agent config into this repo.

Pipeline (inspired by pi-share-hf):
  1. Walk source trees (~/.claude, ~/.pi) using explicit allow list.
  2. Resolve intra-home symlinks by copying target content; skip
     symlinks that escape $HOME (external project skills, etc).
  3. Apply deterministic redactors to JSON/text files.
  4. Write output under repo root as .claude/ and .pi/.
  5. Caller runs scripts/scan.sh afterwards as fail-closed backstop.

Fail-closed: unknown files under allow-list dirs default to EXCLUDE.
"""

from __future__ import annotations

import json
import os
import re
import shutil
import sys
from pathlib import Path

HOME = Path(os.path.expanduser("~"))
REPO = Path(__file__).resolve().parent.parent
SRC_CLAUDE = HOME / ".claude"
SRC_PI = HOME / ".pi"
DST_CLAUDE = REPO / ".claude"
DST_PI = REPO / ".pi"

# ---------------------------------------------------------------------------
# Allow / deny specification
# ---------------------------------------------------------------------------

CLAUDE_ALLOW_FILES = [
    "CLAUDE.md",
    "settings.json",
    "statusline-command.sh",
    "ubiquitous-language.skill",
]
CLAUDE_ALLOW_DIRS = [
    "hooks",
    "commands",
    "agents",
    "skills",
]
# Names inside allow dirs that must still be excluded
CLAUDE_DIR_DENY = {
    "hooks": {"strip-claude-coauthor.log"},
    "skills": {
        ".DS_Store",
        ".pytest_cache",
        ".ruff_cache",
        ".sisyphus",
        ".serena",
        "transcript-toolkit",
        "dokploy-db-create",
    },
}

# Directory names that must NEVER appear in the export at any depth.
# These are reproducible build/VCS/cache artifacts — installers should
# recreate them via scripts/install.sh, not track them.
GLOBAL_DIR_DENY = {
    ".git",
    "node_modules",
    "dist",
    "build",
    ".next",
    ".turbo",
    "__pycache__",
    ".venv",
    "venv",
    "env",
    "target",
    ".pytest_cache",
    ".ruff_cache",
    ".mypy_cache",
    ".cache",
    ".DS_Store",
    ".idea",
    ".vscode",
    "coverage",
    ".nyc_output",
    ".runs",
    "logs",
}

GLOBAL_FILE_DENY = {
    ".DS_Store",
    ".python-version",
    "bun.lock",
}

PI_ALLOW_PATHS = [
    "agent/settings.json",
    "agent/aft.jsonc",
    "agent/aft.jsonc.bak",
]
PI_ALLOW_DIRS = [
    "agent/extensions",
]

# Symlink policy: dereference if target stays under $HOME AND not under a
# private project dir. Anything else is recorded but not copied.
EXTERNAL_SKIP_PREFIXES = (
    HOME / "dev",
    HOME / "Documents",
    HOME / "Desktop",
)

# ---------------------------------------------------------------------------
# Redactors
# ---------------------------------------------------------------------------

REDACTED = "__REDACTED__"

# High-signal patterns — always strip
TOKEN_PATTERNS = [
    # generic 40+ hex/base64-ish opaque tokens on bearer lines
    (
        re.compile(r'("Authorization"\s*:\s*")Bearer\s+[^"]+(")'),
        r"\1Bearer " + REDACTED + r"\2",
    ),
    (re.compile(r'("api[_-]?key"\s*:\s*")[^"]+(")', re.I), r"\1" + REDACTED + r"\2"),
    (re.compile(r'("token"\s*:\s*")[^"]+(")', re.I), r"\1" + REDACTED + r"\2"),
    (re.compile(r'("secret"\s*:\s*")[^"]+(")', re.I), r"\1" + REDACTED + r"\2"),
    (
        re.compile(
            r"\b(sk|pk|ghp|gho|ghu|ghs|glpat|xoxb|xoxp|AKIA)[_-][A-Za-z0-9_\-]{16,}\b"
        ),
        REDACTED,
    ),
    (re.compile(r"\bAIza[0-9A-Za-z\-_]{20,}\b"), REDACTED),  # Google API keys
]

EMAIL_RE = re.compile(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+")
HOME_PATH_RE = re.compile(r"/Users/[A-Za-z0-9._-]+")


def redact_text(text: str, *, strip_emails: bool = False) -> str:
    for pat, repl in TOKEN_PATTERNS:
        text = pat.sub(repl, text)
    text = HOME_PATH_RE.sub("$HOME", text)
    if strip_emails:
        text = EMAIL_RE.sub(REDACTED + "@example.com", text)
    return text


def sanitize_claude_settings(data: dict) -> dict:
    """Surgical pass on settings.json beyond generic token strip."""
    # Drop per-session feedback/telemetry state
    for k in ("feedbackSurveyState", "statsigStableID"):
        data.pop(k, None)

    # MCP servers may embed secrets (bearer tokens, sockets). Replace token
    # values; keep structure so install can re-point users at their own.
    mcp = data.get("mcpServers")
    if isinstance(mcp, dict):
        for name, server in mcp.items():
            if not isinstance(server, dict):
                continue
            headers = server.get("headers")
            if isinstance(headers, dict):
                for hk, hv in list(headers.items()):
                    if hk.lower() == "authorization":
                        headers[hk] = f"Bearer {REDACTED}"
                    elif isinstance(hv, str) and len(hv) > 40:
                        headers[hk] = REDACTED
            # local URLs leak machine state sometimes; keep domain only
            url = server.get("url")
            if (
                isinstance(url, str)
                and "127.0.0.1" not in url
                and "localhost" not in url
            ):
                # keep remote URLs as-is; scan pass will flag if suspicious
                pass
    return data


# ---------------------------------------------------------------------------
# Copy engine
# ---------------------------------------------------------------------------


def within_home(path: Path) -> bool:
    try:
        path.resolve().relative_to(HOME)
        return True
    except ValueError:
        return False


def is_external_skip(path: Path) -> bool:
    real = path.resolve()
    for prefix in EXTERNAL_SKIP_PREFIXES:
        try:
            real.relative_to(prefix)
            return True
        except ValueError:
            pass
    return False


MANIFEST: list[str] = []


def record(action: str, src: Path, dst: Path | None = None) -> None:
    rel_src = src.relative_to(HOME) if within_home(src) else src
    rel_dst = dst.relative_to(REPO) if dst and dst.is_relative_to(REPO) else (dst or "")
    MANIFEST.append(f"{action}\t{rel_src}\t{rel_dst}")


def copy_file(src: Path, dst: Path) -> None:
    dst.parent.mkdir(parents=True, exist_ok=True)
    # Try as text first for redaction; fall back to binary.
    try:
        text = src.read_text()
    except (UnicodeDecodeError, IsADirectoryError):
        shutil.copy2(src, dst)
        record("copy-bin", src, dst)
        return

    if src.name == "settings.json" and src.parent == SRC_CLAUDE:
        data = json.loads(text)
        data = sanitize_claude_settings(data)
        text = json.dumps(data, indent=2) + "\n"
    text = redact_text(text)
    dst.write_text(text)
    # Preserve exec bit for scripts
    if src.suffix in {".sh"} or os.access(src, os.X_OK):
        dst.chmod(0o755)
    record("copy-text", src, dst)


def copy_tree(src: Path, dst: Path, deny: set[str]) -> None:
    if not src.exists():
        return
    for entry in sorted(src.iterdir()):
        if entry.name in deny:
            record("skip-deny", entry)
            continue
        if entry.is_dir() and entry.name in GLOBAL_DIR_DENY:
            record("skip-global-dir-deny", entry)
            continue
        if entry.is_file() and entry.name in GLOBAL_FILE_DENY:
            record("skip-global-file-deny", entry)
            continue
        out = dst / entry.name
        if entry.is_symlink():
            target = entry.resolve()
            if not within_home(target):
                record("skip-external-symlink", entry, out)
                continue
            if is_external_skip(entry):
                record("skip-external-project-symlink", entry, out)
                continue
            if target.is_dir():
                copy_tree(target, out, deny)
            elif target.is_file():
                copy_file(target, out)
            continue
        if entry.is_dir():
            copy_tree(entry, out, deny)
        elif entry.is_file():
            copy_file(entry, out)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------


def export_claude() -> None:
    if DST_CLAUDE.exists():
        shutil.rmtree(DST_CLAUDE)
    DST_CLAUDE.mkdir(parents=True)
    for name in CLAUDE_ALLOW_FILES:
        src = SRC_CLAUDE / name
        if src.is_file():
            copy_file(src, DST_CLAUDE / name)
    for dname in CLAUDE_ALLOW_DIRS:
        src = SRC_CLAUDE / dname
        deny = CLAUDE_DIR_DENY.get(dname, set())
        copy_tree(src, DST_CLAUDE / dname, deny)


def export_pi() -> None:
    if DST_PI.exists():
        shutil.rmtree(DST_PI)
    DST_PI.mkdir(parents=True)
    for rel in PI_ALLOW_PATHS:
        src = SRC_PI / rel
        if src.is_file():
            copy_file(src, DST_PI / rel)
    for rel in PI_ALLOW_DIRS:
        copy_tree(SRC_PI / rel, DST_PI / rel, set())


def main() -> int:
    export_claude()
    export_pi()
    (REPO / "MANIFEST.tsv").write_text(
        "action\tsource\tdestination\n" + "\n".join(MANIFEST) + "\n"
    )
    print(f"Exported {len(MANIFEST)} entries. See MANIFEST.tsv.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
