/**
 * code-mode — Pi Extension
 *
 * Provides an `execute_typescript` tool that lets the LLM write a TypeScript
 * program and execute it in one shot via Bun. The program has access to typed
 * tool stubs for file operations (read, write, edit, bash, exists, glob).
 *
 * Pattern borrowed from Cloudflare/TanStack "code mode" — fewer round-trips,
 * cheaper, faster for multi-step file operations.
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Text } from "@mariozechner/pi-tui";
import { Type } from "@sinclair/typebox";
import { writeFileSync, unlinkSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { randomUUID } from "node:crypto";

// ─── Stub Template ───────────────────────────────────────────────────────────

function generateStubs(cwd: string): string {
	return `
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync } from "node:fs";
import { execSync } from "node:child_process";
import { dirname, resolve, relative, join } from "node:path";

const CWD = ${JSON.stringify(cwd)};
const resolvePath = (p: string) => resolve(CWD, p);

/**
 * Typed tool stubs for file operations.
 * All paths are resolved relative to the project working directory.
 */
export const tools = {
  /** Read a file and return its contents as a string. */
  read(path: string): string {
    return readFileSync(resolvePath(path), "utf-8");
  },

  /** Read a file and return lines as an array. Optionally slice with offset/limit. */
  readLines(path: string, offset?: number, limit?: number): string[] {
    const lines = readFileSync(resolvePath(path), "utf-8").split("\\n");
    const start = (offset ?? 1) - 1;
    return limit ? lines.slice(start, start + limit) : lines.slice(start);
  },

  /** Write content to a file. Creates parent directories automatically. */
  write(path: string, content: string): void {
    const full = resolvePath(path);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, content, "utf-8");
  },

  /** Replace exact text in a file. Returns true if replacement was made. */
  edit(path: string, oldText: string, newText: string): boolean {
    const full = resolvePath(path);
    const content = readFileSync(full, "utf-8");
    if (!content.includes(oldText)) return false;
    writeFileSync(full, content.replace(oldText, newText), "utf-8");
    return true;
  },

  /** Execute a shell command and return stdout. */
  bash(command: string, options?: { timeout?: number; cwd?: string }): string {
    return execSync(command, {
      encoding: "utf-8",
      timeout: options?.timeout ?? 30000,
      cwd: options?.cwd ? resolvePath(options.cwd) : CWD,
      stdio: ["pipe", "pipe", "pipe"],
    }).toString();
  },

  /** Check if a file or directory exists. */
  exists(path: string): boolean {
    return existsSync(resolvePath(path));
  },

  /** Find files matching a glob pattern (uses find, excludes node_modules/.git). */
  glob(pattern: string): string[] {
    const result = execSync(
      \`find . -path "\${pattern}" -not -path "*/node_modules/*" -not -path "*/.git/*" 2>/dev/null\`,
      { encoding: "utf-8", cwd: CWD, timeout: 10000 }
    );
    return result.trim().split("\\n").filter(Boolean);
  },

  /** List directory contents with file/dir indicator. */
  ls(path: string = "."): Array<{ name: string; type: "file" | "dir"; size: number }> {
    const full = resolvePath(path);
    return readdirSync(full).map(name => {
      const stat = statSync(join(full, name));
      return { name, type: stat.isDirectory() ? "dir" as const : "file" as const, size: stat.size };
    });
  },

  /** Grep for a pattern in files. Returns matching lines with file:line format. */
  grep(pattern: string, pathOrGlob: string = "."): string[] {
    try {
      const result = execSync(
        \`grep -rn --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" --include="*.json" --include="*.md" "\${pattern}" \${pathOrGlob}\`,
        { encoding: "utf-8", cwd: CWD, timeout: 15000 }
      );
      return result.trim().split("\\n").filter(Boolean);
    } catch {
      return [];
    }
  },
};

/** Resolve a path relative to the project root. */
export const resolve_path = resolvePath;

/** The project working directory. */
export const cwd = CWD;
`;
}

// ─── Runner Template ─────────────────────────────────────────────────────────

function generateRunner(stubs: string, program: string): string {
	return `${stubs}

// ─── User Program ────────────────────────────────────────────────────────────

${program}

// ─── Runner ──────────────────────────────────────────────────────────────────

async function __run() {
  try {
    const result = await main();
    const output = JSON.stringify({ success: true, result });
    process.stdout.write(output + "\\n");
  } catch (e: any) {
    const output = JSON.stringify({
      success: false,
      error: e.message,
      stack: e.stack?.split("\\n").slice(0, 5).join("\\n"),
    });
    process.stdout.write(output + "\\n");
    process.exit(1);
  }
}
__run();
`;
}

// ─── Extension ───────────────────────────────────────────────────────────────

export default function (pi: ExtensionAPI) {
	const tmpDir = join(tmpdir(), "pi-code-mode");

	pi.registerTool({
		name: "execute_typescript",
		label: "Script Runner",
		description: `Run a deterministic TypeScript script via Bun in a single shot.

Use this for automation, computation, structured data transformation, repetitive tasks, and multi-step orchestration that are more naturally expressed as code than as individual tool calls.

This is not the default tool for ordinary coding workflow. Prefer native/AFT tools for routine file reads, search, edits, writes, and diagnostics. File helpers are available here as support primitives when a script legitimately needs them.

The program has access to a \`tools\` object with typed stubs:
- \`tools.read(path)\` → string
- \`tools.readLines(path, offset?, limit?)\` → string[]
- \`tools.write(path, content)\` → void (creates dirs)
- \`tools.edit(path, oldText, newText)\` → boolean
- \`tools.bash(command, { timeout?, cwd? }?)\` → string
- \`tools.exists(path)\` → boolean
- \`tools.glob(pattern)\` → string[]
- \`tools.ls(path?)\` → Array<{ name, type, size }>
- \`tools.grep(pattern, path?)\` → string[]

Also available: \`cwd\` (project root string), \`resolve_path(p)\` (resolve relative path).

Your program MUST define an \`async function main()\` that returns the result.
Use \`console.error()\` for debug logging (stdout is reserved for the JSON result).
All paths resolve relative to the project working directory.`,
		promptSnippet:
			"Run deterministic TypeScript scripts for automation, computation, and multi-step orchestration",
		promptGuidelines: [
			"Use execute_typescript for deterministic scripting, exact computation, repetitive transformations, and automation tasks that are more naturally expressed as code than as direct tool calls",
			"Use it when you need programmable control flow such as loops, branching, aggregation, or Promise.all parallelism",
			"Do not use execute_typescript for ordinary coding workflow: prefer native/AFT tools for routine reads, search, edits, writes, and diagnostics",
			"Do not use it for simple one-off file changes or normal repo exploration when standard tools already express the task clearly",
			"Treat the `tools` object as support primitives for scripts, not as a replacement for the normal editing/search toolchain",
			"The program MUST define `async function main()` that returns the result — this is the entry point",
			"Use console.error() for debug output — console.log() will corrupt the JSON result channel",
			"Prefer Promise.all() for independent operations that can run in parallel",
			"All paths are relative to the project root — no need to resolve manually",
		],
		parameters: Type.Object({
			description: Type.String({
				description:
					"Brief description of the automation, computation, or scripted task this program performs (for logging/display)",
			}),
			program: Type.String({
				description:
					"TypeScript program to execute. Must define `async function main()` returning the result. Use it for deterministic scripting and automation; native/AFT tools remain preferred for normal editing/search workflows. The program has access to the `tools` object with read/write/edit/bash/exists/glob/ls/grep stubs.",
			}),
			timeout: Type.Optional(
				Type.Number({
					description: "Timeout in milliseconds (default: 30000)",
					default: 30000,
				}),
			),
		}),
		renderCall(args, theme, context) {
			const text =
				(context.lastComponent as Text | undefined) ?? new Text("", 0, 0);
			text.setText(
				`${theme.fg("toolTitle", theme.bold("execute_typescript"))}: ${theme.fg("toolOutput", args.description ?? "Running program...")}`,
			);
			return text;
		},
		async execute(toolCallId, params, signal, onUpdate, ctx) {
			const { description, program, timeout = 30000 } = params;
			const cwd = ctx.cwd;

			mkdirSync(tmpDir, { recursive: true });
			const id = randomUUID().slice(0, 8);
			const tmpFile = join(tmpDir, `run-${id}.ts`);

			const stubs = generateStubs(cwd);
			const runner = generateRunner(stubs, program);

			writeFileSync(tmpFile, runner, "utf-8");

			try {
				onUpdate?.({
					content: [
						{
							type: "text",
							text: `Executing: ${description ?? "TypeScript program"}...`,
						},
					],
				});

				const result = await pi.exec("bun", ["run", tmpFile], {
					signal,
					timeout,
				});

				// Clean up temp file
				try {
					unlinkSync(tmpFile);
				} catch {}

				const stdout = result.stdout?.trim() ?? "";
				const stderr = result.stderr?.trim() ?? "";

				if (result.code !== 0) {
					// Try to parse structured error from our runner
					const lines = stdout.split("\n");
					const lastLine = lines[lines.length - 1];
					let errorInfo: string;
					try {
						const parsed = JSON.parse(lastLine);
						errorInfo = `${parsed.error}\n${parsed.stack ?? ""}`;
					} catch {
						errorInfo = stdout || stderr || `Exit code ${result.code}`;
					}
					throw new Error(
						`Program failed:\n\n${errorInfo}${stderr && !errorInfo.includes(stderr) ? `\n\nDebug output:\n${stderr}` : ""}`,
					);
				}

				// Parse the JSON result from the last stdout line
				const lines = stdout.split("\n");
				const lastLine = lines[lines.length - 1];
				let parsed: { success: boolean; result?: unknown; error?: string };

				try {
					parsed = JSON.parse(lastLine);
				} catch {
					// Program didn't output our expected JSON — return raw output
					return {
						content: [
							{
								type: "text",
								text: `${stdout}${stderr ? `\n\nDebug output:\n${stderr}` : ""}`,
							},
						],
						details: { stdout, stderr },
					};
				}

				if (!parsed.success) {
					throw new Error(
						`Program error: ${parsed.error}${stderr ? `\n\nDebug output:\n${stderr}` : ""}`,
					);
				}

				const resultText =
					typeof parsed.result === "string"
						? parsed.result
						: JSON.stringify(parsed.result, null, 2);

				return {
					content: [
						{
							type: "text",
							text: `${resultText}${stderr ? `\n\nDebug output:\n${stderr}` : ""}`,
						},
					],
					details: { result: parsed.result, debug: stderr || undefined },
				};
			} catch (e: any) {
				try {
					unlinkSync(tmpFile);
				} catch {}
				if (e.name === "AbortError" || signal?.aborted) {
					throw new Error("Execution cancelled.");
				}
				if (e instanceof Error) {
					throw e;
				}
				throw new Error(`Execution failed: ${String(e)}`);
			}
		},
	});

	pi.on("session_start", async (_event, ctx) => {
		// Ensure temp dir exists
		mkdirSync(tmpDir, { recursive: true });
	});
}
