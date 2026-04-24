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

**private-ready only.**

The staged tree passes the local backstop scan, but the content is
intentionally personal:

- `CLAUDE.md` encodes personal workflow preferences.
- `settings.json` `permissions.allow` exposes the exact tool/command
  surface used locally — not sensitive, but more information than
  needed for a public share.
- Skills include project-specific prompts and research workflows.

Keep this repo private by default. If you want a public-safe cut, run
an additional pass: strip `permissions.allow`, replace `CLAUDE.md` with
a redacted version, and audit each skill's `SKILL.md` for project names.

## Next manual steps (not executed automatically)

```bash
# create a private GitHub repo WITHOUT pushing yet:
#   gh repo create <you>/ai-config --private --source . --remote origin
# then push:
#   git push -u origin main
```

These are listed here for reference — the exporter deliberately stops
before any remote publish.
