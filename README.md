# ai-config

Portable, sanitized export of my Claude Code and Pi agent configuration.

Tracks **only shareable config** — hooks, commands, skills, settings
schemas, extension sources. State (sessions, transcripts, caches,
telemetry, shell snapshots, credentials) is excluded by the exporter.

## Layout

```
.claude/
  CLAUDE.md                 # personal cognitive / output rules
  settings.json             # permissions, hooks, plugins (tokens redacted)
  statusline-command.sh
  hooks/                    # session/tool hooks (bash)
  commands/                 # custom slash commands
  agents/                   # custom subagent definitions
  skills/                   # custom + checked-in skills
.pi/
  agent/
    settings.json
    aft.jsonc               # AFT extension config
    extensions/             # agentic-harness, code-mode, dev-browser sources
scripts/
  export.py                 # (re)build this repo from ~/.claude + ~/.pi
  install.sh                # restore tracked files into $HOME
  scan.sh                   # secret-scan backstop
```

## Install (on a new machine)

```bash
git clone <repo-url> ~/ai-config
cd ~/ai-config
bash scripts/install.sh        # non-destructive; --force to overwrite
```

Then:

1. Replace `__REDACTED__` placeholders in `~/.claude/settings.json`
   (e.g. MCP server bearer tokens).
2. Re-create any external symlinks you want under `~/.claude/skills/`
   (e.g. project-local `engram`, `engram-seed`). These are intentionally
   not tracked because they reference private project trees.
3. Install Claude Code plugins listed in `settings.json`
   (`enabledPlugins`) — the exporter does not ship their source.

## Re-export after local changes

```bash
python3 scripts/export.py      # rebuild .claude/ and .pi/ from $HOME
bash scripts/scan.sh           # fail-closed secret scan
git diff                       # review before committing
```

## Redaction pipeline

`scripts/export.py` applies, in order:

1. **Allow list** — only declared files/dirs are copied. Unknown entries
   are excluded by default.
2. **Global deny** — `.git`, `node_modules`, `dist`, `build`, virtualenvs,
   `__pycache__`, IDE dirs, caches, `.DS_Store` are dropped at any depth.
3. **Symlink policy** — symlinks resolved only inside `$HOME` and never
   if the target is under `~/dev`, `~/Documents`, `~/Desktop`.
4. **Per-file redactors** — regex sweep for bearer tokens, provider
   keys (`sk_`, `ghp_`, `AKIA…`, `AIza…`), JWTs, opaque
   `token/api_key/secret` values.
5. **Settings surgery** — `.claude/settings.json` has `feedbackSurveyState`
   stripped and `mcpServers.*.headers.Authorization` forced to
   `Bearer __REDACTED__`.
6. **`scripts/scan.sh`** — grep backstop over the staged tree; fails
   non-zero if any known secret shape survives.

## Visibility recommendation

**public-safe** after the final sanitization pass reflected in this repo.

Current safeguards:

- private/stateful content such as sessions, transcripts, telemetry,
  caches, runtime logs, and local histories is excluded
- known sensitive headers in `.claude/settings.json` are rewritten to
  `Bearer __REDACTED__`
- exporter rules deny previously flagged skill content and runtime
  artifacts
- `scripts/scan.sh` fails closed on surviving secret-like values,
  absolute home paths, and public IPv4s

This repository is intended to contain shareable configuration only.
If you add new skills, extensions, or settings, rerun the exporter and
scanner before publishing updates.

## Publish workflow

```bash
python3 scripts/export.py
./scripts/scan.sh
git add -A
git commit -m "Refresh sanitized AI config"
git push
```

If `scripts/scan.sh` fails, review and redact before pushing.
