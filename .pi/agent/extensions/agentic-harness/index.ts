/**
 * agentic-harness — Pi Extension
 *
 * Governance layer for AI coding agents on pi.
 * Provides: batch diagnostics via AFT, file size guard,
 * dangerous git blocking, co-author stripping, and handoff compaction.
 *
 * Dependencies: @cortexkit/aft-pi (provides lsp_diagnostics tool, format-on-edit)
 * AFT config: validate_on_edit must be "off" — this extension owns diagnostic timing.
 *
 * Philosophy: wrap don't reimplement, fail open always, token-cheap happy path.
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { isToolCallEventType } from "@mariozechner/pi-coding-agent";
import { resolve, dirname, relative } from "node:path";
import { existsSync, readFileSync } from "node:fs";

// ─── Config ─────────────────────────────────────────────────────────────────

interface HarnessConfig {
	/** Max lines before advisory (default: 500) */
	maxLines: number;
	/** Enable batch diagnostics on agent_end via AFT lsp_diagnostics (default: true) */
	diagnosticsOnEnd: boolean;
	/** Enable dangerous git blocking (default: true) */
	blockDangerousGit: boolean;
	/** Enable co-author trailer stripping (default: true) */
	stripCoAuthor: boolean;
	/** Enable file size advisory (default: true) */
	sizeGuard: boolean;
	/** Diagnostics timeout ms (default: 30000) */
	diagnosticsTimeout: number;
	/** Fallback to tsc/mypy/cargo when AFT lsp_diagnostics is unavailable (default: true) */
	fallbackTypecheck: boolean;
}

const DEFAULT_CONFIG: HarnessConfig = {
	maxLines: 500,
	diagnosticsOnEnd: true,
	blockDangerousGit: true,
	stripCoAuthor: true,
	sizeGuard: true,
	diagnosticsTimeout: 30000,
	fallbackTypecheck: true,
};

// ─── Project Detection (fallback only) ──────────────────────────────────────

type ProjectType = "pnpm" | "uv" | "cargo" | "none";

function findProjectRoot(fromDir: string): string | null {
	let d = fromDir;
	while (d !== "/" && d) {
		if (existsSync(resolve(d, "pnpm-lock.yaml")) || existsSync(resolve(d, "uv.lock")) || existsSync(resolve(d, "Cargo.toml")) || existsSync(resolve(d, "package.json")) || existsSync(resolve(d, "pyproject.toml"))) return d;
		d = dirname(d);
	}
	return null;
}

function detectProjectType(fromDir: string): ProjectType {
	const root = findProjectRoot(fromDir);
	if (!root) return "none";
	if (existsSync(resolve(root, "pnpm-lock.yaml")) || existsSync(resolve(root, "package.json"))) return "pnpm";
	if (existsSync(resolve(root, "uv.lock")) || existsSync(resolve(root, "pyproject.toml"))) return "uv";
	if (existsSync(resolve(root, "Cargo.toml"))) return "cargo";
	return "none";
}

function hasConfiguredPythonTypechecker(projectRoot: string, checker: "mypy" | "pyright"): boolean {
	if (checker === "mypy" && (existsSync(resolve(projectRoot, "mypy.ini")) || existsSync(resolve(projectRoot, ".mypy.ini")))) return true;
	if (checker === "pyright" && existsSync(resolve(projectRoot, "pyrightconfig.json"))) return true;

	const pyproject = resolve(projectRoot, "pyproject.toml");
	if (!existsSync(pyproject)) return false;

	try {
		const content = readFileSync(pyproject, "utf8");
		return checker === "mypy"
			? /^\s*\[tool\.mypy\]/m.test(content) || /["']mypy[<>=!~\s]/.test(content)
			: /^\s*\[tool\.pyright\]/m.test(content) || /["'](?:based)?pyright[<>=!~\s]/.test(content);
	} catch {
		return false;
	}
}

function getFallbackTypechecker(projectType: ProjectType, projectRoot: string): string | null {
	switch (projectType) {
		case "pnpm":
			return existsSync(resolve(projectRoot, "tsconfig.json")) ? "pnpm exec tsc --noEmit" : null;
		case "uv":
			if (hasConfiguredPythonTypechecker(projectRoot, "mypy")) return "uv run mypy";
			if (hasConfiguredPythonTypechecker(projectRoot, "pyright")) return "uv run pyright";
			return null;
		case "cargo":
			return "cargo check";
		default:
			return null;
	}
}

// ─── AFT Integration ────────────────────────────────────────────────────────

function hasAftDiagnostics(pi: ExtensionAPI): boolean {
	return pi.getAllTools().some((t) => t.name === "lsp_diagnostics");
}

// ─── Dangerous Git Patterns ─────────────────────────────────────────────────

const DANGEROUS_GIT_PATTERNS = [
	/\bgit\s+push\b/,
	/\bgit\s+reset\s+--hard\b/,
	/\bgit\s+clean\s+-f/,
	/\bgit\s+branch\s+-D\b/,
	/\bgit\s+checkout\s+\./,
	/\bgit\s+restore\s+\./,
	/--force\b/,
	/\breset\s+--hard\b/,
];

// ─── Extension ──────────────────────────────────────────────────────────────

export default function (pi: ExtensionAPI) {
	const config: HarnessConfig = { ...DEFAULT_CONFIG };
	const editedFiles: Set<string> = new Set();

	// ─── PreToolUse: Block dangerous git commands ───────────────────────────

	pi.on("tool_call", async (event, _ctx) => {
		if (!config.blockDangerousGit) return;
		if (!isToolCallEventType("bash", event)) return;

		const cmd = event.input.command || "";
		for (const pattern of DANGEROUS_GIT_PATTERNS) {
			if (pattern.test(cmd)) {
				return {
					block: true,
					reason: `[agentic-harness] BLOCKED: '${cmd}' matches dangerous git pattern '${pattern.source}'. Use the terminal directly if intentional.`,
				};
			}
		}
	});

	// ─── PostToolUse: Track edited files, size guard ────────────────────────

	pi.on("tool_result", async (event, ctx) => {
		const toolName = event.toolName;
		if (toolName !== "edit" && toolName !== "write") return;

		// AFT uses filePath, pi builtins use path
		const fp: string | undefined = event.input?.filePath ?? event.input?.path;
		if (!fp) return;

		const resolved = resolve(ctx.cwd, fp);
		editedFiles.add(resolved);

		// ── Size guard ──
		if (config.sizeGuard) {
			try {
				const { stdout } = await pi.exec("wc", ["-l", resolved], { timeout: 2000 });
				const lines = parseInt(stdout.trim().split(/\s+/)[0], 10);
				if (lines > config.maxLines) {
					ctx.ui.notify(
						`📏 ${fp}: ${lines} lines (exceeds ${config.maxLines})`,
						"warning",
					);
				}
			} catch {
				/* fail open */
			}
		}
	});

	// ─── PostToolUse: Strip Co-Authored-By trailers ─────────────────────────

	pi.on("tool_result", async (event, _ctx) => {
		if (!config.stripCoAuthor) return;
		if (event.toolName !== "bash") return;

		const cmd: string = event.input?.command || "";
		if (!/\bgit\b/.test(cmd) || !/\bcommit\b/.test(cmd)) return;
		if (/--amend/.test(cmd)) return;

		try {
			const { stdout: msg } = await pi.exec("git", ["log", "-1", "--format=%B"], {
				timeout: 3000,
			});
			if (!msg || !/^Co-Authored-By:/im.test(msg)) return;

			const cleanMsg = msg
				.split("\n")
				.filter((line) => !/^Co-Authored-By:/i.test(line))
				.join("\n")
				.replace(/\n+$/, "");

			await pi.exec("git", ["commit", "--amend", "-m", cleanMsg], { timeout: 5000 });
		} catch {
			/* fail open */
		}
	});

	// ─── Agent End: Batch diagnostics ───────────────────────────────────────
	//
	// This is the key governance decision: diagnostics run ONCE after ALL edits
	// in a turn are complete. AFT's inline validate_on_edit is set to "off" —
	// we call lsp_diagnostics here instead, so the LLM only sees real errors,
	// not intermediate noise from half-finished refactors.

	pi.on("agent_end", async (_event, ctx) => {
		if (!config.diagnosticsOnEnd || editedFiles.size === 0) {
			editedFiles.clear();
			return;
		}

		const files = [...editedFiles];
		editedFiles.clear();

		// ── Try AFT lsp_diagnostics first ──
		if (hasAftDiagnostics(pi)) {
			try {
				// Deduce unique directories to check — more efficient than per-file
				const dirs = [...new Set(files.map((f) => dirname(f)))];

				// If all files are in one directory (or project root), check that directory.
				// Otherwise check the whole project (no args = all tracked files).
				const allTools = pi.getAllTools();
				const lspTool = allTools.find((t) => t.name === "lsp_diagnostics");
				if (!lspTool) throw new Error("lsp_diagnostics not found");

				// Use the tool's execute function directly
				// We need to invoke it through the agent — but we can't call tools directly.
				// Instead, use pi.exec to call the AFT binary's diagnostics via the bridge.
				// Simpler approach: just invoke it via the bash tool calling the AFT CLI,
				// or send a message to trigger diagnostics.

				// The cleanest approach: call AFT's Rust binary directly for diagnostics.
				// AFT stores its binary path in ~/.cache/aft/bin/
				const aftBinDir = resolve(
					process.env.HOME || "~",
					".cache/aft/bin",
				);

				// Find the latest AFT binary
				let aftBin: string | null = null;
				if (existsSync(aftBinDir)) {
					const { stdout: versions } = await pi.exec("ls", ["-1", aftBinDir], {
						timeout: 2000,
					});
					const latestVersion = versions.trim().split("\n").pop();
					if (latestVersion) {
						const candidate = resolve(aftBinDir, latestVersion, "aft");
						if (existsSync(candidate)) aftBin = candidate;
					}
				}

				if (aftBin) {
					// Call AFT directly for diagnostics — project-wide, errors only
					const { stdout, code } = await pi.exec(
						aftBin,
						["lsp-diagnostics", "--severity", "error", "--format", "json"],
						{
							timeout: config.diagnosticsTimeout,
						},
					);

					if (code === 0 && stdout.trim()) {
						let diagnostics: any;
						try {
							diagnostics = JSON.parse(stdout.trim());
						} catch {
							diagnostics = null;
						}

						if (diagnostics && Array.isArray(diagnostics) && diagnostics.length > 0) {
							// Filter to only diagnostics in files we edited
							const editedSet = new Set(files);
							const relevant = diagnostics.filter((d: any) => {
								const dPath = resolve(ctx.cwd, d.file || d.path || "");
								return editedSet.has(dPath);
							});

							if (relevant.length > 0) {
								const output = relevant
									.slice(0, 20)
									.map((d: any) => {
										const file = relative(ctx.cwd, resolve(ctx.cwd, d.file || d.path || ""));
										const line = d.range?.start?.line ?? d.line ?? "?";
										return `${file}:${line} — ${d.message}`;
									})
									.join("\n");

								pi.sendMessage(
									{
										customType: "agentic-harness-diagnostics",
										content: `⚠️ **Diagnostics** (${relevant.length} issue${relevant.length === 1 ? "" : "s"} in ${editedFiles.size} edited file${files.length === 1 ? "" : "s"}):\n\n\`\`\`\n${output}\n\`\`\``,
										display: true,
									},
									{ deliverAs: "nextTurn" },
								);
								return; // AFT handled it
							}
						}
					}
					return; // AFT ran, no errors — done
				}
			} catch {
				/* AFT diagnostics failed — fall through to fallback */
			}
		}

		// ── Fallback: traditional typecheck when AFT is unavailable ──
		if (!config.fallbackTypecheck) return;

		const firstFile = files[0];
		const projectRoot = findProjectRoot(dirname(firstFile));
		if (!projectRoot) return;
		const projectType = detectProjectType(projectRoot);
		const checker = getFallbackTypechecker(projectType, projectRoot);
		if (!checker) return;

		try {
			let cmd: string;
			if (projectType === "uv") {
				cmd = `${checker} ${files.join(" ")}`;
			} else {
				cmd = checker;
			}

			const { stdout, stderr, code } = await pi.exec("bash", ["-c", cmd], {
				timeout: config.diagnosticsTimeout,
			});

			if (code !== 0) {
				const output = (stdout + stderr).trim();
				if (output) {
					pi.sendMessage(
						{
							customType: "agentic-harness-diagnostics",
							content: `⚠️ **Typecheck findings** (${files.length} file${files.length === 1 ? "" : "s"} edited this turn):\n\n\`\`\`\n${output.slice(0, 2000)}\n\`\`\``,
							display: true,
						},
						{ deliverAs: "nextTurn" },
					);
				}
			}
		} catch {
			/* fail open */
		}
	});

	// ─── Compaction: Handoff summary format ──────────────────────────────────

	pi.on("session_before_compact", async (event, ctx) => {
		const { preparation, signal } = event;
		const {
			messagesToSummarize,
			turnPrefixMessages,
			tokensBefore,
			firstKeptEntryId,
			previousSummary,
		} = preparation;

		// Gather git context for the summary
		let gitContext = "";
		try {
			const { stdout: status } = await pi.exec("git", ["status", "--short"], {
				timeout: 3000,
			});
			const { stdout: log } = await pi.exec("git", ["log", "--oneline", "-10"], {
				timeout: 3000,
			});
			if (status.trim() || log.trim()) {
				gitContext = `\nGit status:\n${status}\nRecent commits:\n${log}`;
			}
		} catch {
			/* no git — fine */
		}

		// Use the current model for summarization
		const model = ctx.model;
		if (!model) return;

		const auth = await ctx.modelRegistry.getApiKeyAndHeaders(model);
		if (!auth.ok || !auth.apiKey) return;

		const { convertToLlm, serializeConversation } = await import(
			"@mariozechner/pi-coding-agent"
		);
		const { complete } = await import("@mariozechner/pi-ai");

		const allMessages = [...messagesToSummarize, ...turnPrefixMessages];
		const conversationText = serializeConversation(convertToLlm(allMessages));

		const previousContext = previousSummary
			? `\nPrevious summary:\n${previousSummary}`
			: "";

		const summaryMessages = [
			{
				role: "user" as const,
				content: [
					{
						type: "text" as const,
						text: `Compact this session into a HANDOFF SUMMARY. Use this exact structure:

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
${previousContext}${gitContext}

<conversation>
${conversationText}
</conversation>`,
					},
				],
				timestamp: Date.now(),
			},
		];

		try {
			const response = await complete(
				model,
				{ messages: summaryMessages },
				{ apiKey: auth.apiKey, headers: auth.headers, maxTokens: 4096, signal },
			);

			const summary = response.content
				.filter((c): c is { type: "text"; text: string } => c.type === "text")
				.map((c) => c.text)
				.join("\n");

			if (!summary.trim()) return;

			return {
				compaction: { summary, firstKeptEntryId, tokensBefore },
			};
		} catch {
			return;
		}
	});

	// ─── Commands ───────────────────────────────────────────────────────────

	pi.registerCommand("ah", {
		description: "Agentic harness status and config",
		handler: async (args, ctx) => {
			const aftAvailable = hasAftDiagnostics(pi);

			if (!args || args === "status") {
				const lines = [
					"⚡ agentic-harness extension",
					"",
					`  diagnostics:     ${config.diagnosticsOnEnd ? "✓" : "✗"} (${aftAvailable ? "AFT lsp_diagnostics" : "fallback typecheck"})`,
					`  block-dangerous: ${config.blockDangerousGit ? "✓" : "✗"}`,
					`  strip-co-author: ${config.stripCoAuthor ? "✓" : "✗"}`,
					`  size-guard:      ${config.sizeGuard ? "✓" : "✗"} (max ${config.maxLines} lines)`,
					`  fallback-tc:     ${config.fallbackTypecheck ? "✓" : "✗"}`,
					"",
					`  AFT available:   ${aftAvailable ? "✓" : "✗"}`,
					`  files edited:    ${editedFiles.size}`,
					`  project type:    ${detectProjectType(ctx.cwd)}`,
				];
				ctx.ui.notify(lines.join("\n"), "info");
			} else if (args.startsWith("set ")) {
				const [, key, value] = args.match(/^set\s+(\S+)\s+(.+)$/) || [];
				if (key && value) {
					if (key in config) {
						const val =
							value === "true" ? true : value === "false" ? false : parseInt(value, 10);
						(config as any)[key] = val;
						ctx.ui.notify(`[ah] ${key} = ${val}`, "info");
					} else {
						ctx.ui.notify(`[ah] Unknown key: ${key}`, "error");
					}
				} else {
					ctx.ui.notify("[ah] Usage: /ah set <key> <value>", "error");
				}
			} else {
				ctx.ui.notify("[ah] Commands: status, set <key> <value>", "info");
			}
		},
	});

	// ─── Session start: detect project, show status ─────────────────────────

	pi.on("session_start", async (_event, ctx) => {
		const aftAvailable = hasAftDiagnostics(pi);
		const projectType = detectProjectType(ctx.cwd);
		const diagLabel = aftAvailable ? "aft" : projectType !== "none" ? "tc" : "off";

		ctx.ui.setStatus(
			"ah",
			`⚡ ah: diag:${diagLabel} | git-guard:✓`,
		);
	});
}
