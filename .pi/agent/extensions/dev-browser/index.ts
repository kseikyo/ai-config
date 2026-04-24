import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";
import { mkdirSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { randomUUID } from "node:crypto";

const TMP_DIR = join(tmpdir(), "pi-dev-browser");
const DEFAULT_TIMEOUT_SECONDS = 30;
const MAX_VISIBLE_OUTPUT_CHARS = 12_000;

function truncate(text: string, max = MAX_VISIBLE_OUTPUT_CHARS): string {
	if (text.length <= max) return text;
	return `${text.slice(0, max)}\n\n...[truncated ${text.length - max} more chars]`;
}

function formatOutput(stdout: string, stderr: string): string {
	const parts: string[] = [];
	if (stdout.trim()) parts.push(stdout.trim());
	if (stderr.trim()) parts.push(`Debug output:\n${stderr.trim()}`);
	return parts.join("\n\n").trim();
}

function buildArgs(params: {
	browser?: string;
	connect?: boolean;
	connectUrl?: string;
	headless?: boolean;
	ignoreHttpsErrors?: boolean;
	timeout?: number;
	scriptPath: string;
}): string[] {
	const args: string[] = [];
	if (params.browser) args.push("--browser", params.browser);
	if (params.connectUrl) args.push("--connect", params.connectUrl);
	else if (params.connect) args.push("--connect");
	if (params.headless) args.push("--headless");
	if (params.ignoreHttpsErrors) args.push("--ignore-https-errors");
	args.push("--timeout", String(params.timeout ?? DEFAULT_TIMEOUT_SECONDS));
	args.push("run", params.scriptPath);
	return args;
}

export default function devBrowserExtension(pi: ExtensionAPI) {
	let availabilityChecked = false;
	let isAvailable = false;
	let availabilityMessage = "Not checked";

	mkdirSync(TMP_DIR, { recursive: true });

	async function checkAvailability() {
		if (availabilityChecked) {
			return { isAvailable, availabilityMessage };
		}

		try {
			const result = await pi.exec("dev-browser", ["--help"], { timeout: 5000 });
			isAvailable = result.code === 0;
			availabilityMessage = isAvailable
				? "dev-browser CLI available"
				: (result.stderr || result.stdout || `dev-browser exited with code ${result.code}`).trim();
		} catch (error) {
			isAvailable = false;
			availabilityMessage = error instanceof Error ? error.message : String(error);
		}

		availabilityChecked = true;
		return { isAvailable, availabilityMessage };
	}

	function setStatus(ctx: { hasUI: boolean; ui: { setStatus: (id: string, text: string) => void } }) {
		if (!ctx.hasUI) return;
		ctx.ui.setStatus(
			"dev-browser",
			isAvailable ? "🌐 dev-browser: ready" : "🌐 dev-browser: unavailable",
		);
	}

	pi.registerTool({
		name: "dev_browser",
		label: "Dev Browser",
		description: `Run a small JavaScript script through the installed dev-browser CLI.

Use this tool when you need browser automation, page inspection, screenshots, or interaction with a local/external browser.

Important constraints:
- The script runs in dev-browser's sandboxed QuickJS runtime, not Node.js
- Do not use require(), import(), process, fs, path, fetch, or WebSocket in the script
- Available globals include browser, console, setTimeout, clearTimeout, saveScreenshot, writeFile, readFile
- Use browser.getPage("name") for stable named pages across runs
- Use page.snapshotForAI() first when the page structure is unknown
- End scripts by logging the state needed for the next step, ideally as JSON via console.log(JSON.stringify(...))
- Keep scripts small and focused; each call should do one thing well`,
		promptSnippet: "Control a browser via the installed dev-browser CLI using small JavaScript scripts",
		promptGuidelines: [
			"Use dev_browser when the user wants browser automation, page inspection, navigation, clicking, form filling, screenshots, or connecting to an existing Chrome session",
			"The script passed to dev_browser runs in dev-browser's QuickJS sandbox, not Node.js; do not use require(), import(), process, fs, path, os, fetch, or WebSocket",
			"Use browser.getPage(\"name\") with stable names so browser state can persist across multiple dev_browser calls",
			"Use page.snapshotForAI() when the page is unknown, then choose Playwright actions based on the snapshot",
			"Keep each dev_browser script small and focused, and end it by logging the exact state needed for the next decision",
		],
		parameters: Type.Object({
			script: Type.String({
				description: "JavaScript to run with dev-browser. This runs in dev-browser's QuickJS sandbox, not Node.js.",
			}),
			browser: Type.Optional(
				Type.String({
					description: "Managed browser instance name. Use for persistent named browser state. Mutually exclusive with connect/connectUrl.",
				}),
			),
			connect: Type.Optional(
				Type.Boolean({
					description: "Attach to an existing Chrome session via auto-discovery. Mutually exclusive with browser.",
				}),
			),
			connectUrl: Type.Optional(
				Type.String({
					description: "Explicit CDP endpoint to pass to --connect, e.g. http://localhost:9222. Mutually exclusive with browser.",
				}),
			),
			headless: Type.Optional(
				Type.Boolean({
					description: "Launch managed Chromium headlessly. Ignored for external browser connections.",
					default: false,
				}),
			),
			ignoreHttpsErrors: Type.Optional(
				Type.Boolean({
					description: "Ignore HTTPS certificate errors for managed Chromium.",
					default: false,
				}),
			),
			timeout: Type.Optional(
				Type.Number({
					description: "Maximum dev-browser script execution time in seconds. Default: 30.",
					default: DEFAULT_TIMEOUT_SECONDS,
				}),
			),
			saveArtifacts: Type.Optional(
				Type.Boolean({
					description: "Keep the temporary script file path in result details for debugging.",
					default: false,
				}),
			),
		}),
		async execute(_toolCallId, params, signal) {
			const availability = await checkAvailability();
			if (!availability.isAvailable) {
				throw new Error(`dev-browser CLI is not available: ${availability.availabilityMessage}`);
			}

			const usingConnect = Boolean(params.connect) || Boolean(params.connectUrl);
			if (params.browser && usingConnect) {
				throw new Error("dev_browser: browser is mutually exclusive with connect/connectUrl.");
			}

			const timeoutSeconds = Math.max(1, Math.floor(params.timeout ?? DEFAULT_TIMEOUT_SECONDS));
			const timeoutMs = timeoutSeconds * 1000 + 5000;
			const id = randomUUID().slice(0, 8);
			const scriptPath = join(TMP_DIR, `script-${id}.js`);

			writeFileSync(scriptPath, `${params.script.trim()}\n`, "utf-8");

			const args = buildArgs({
				browser: params.browser,
				connect: params.connect,
				connectUrl: params.connectUrl,
				headless: params.headless,
				ignoreHttpsErrors: params.ignoreHttpsErrors,
				timeout: timeoutSeconds,
				scriptPath,
			});

			try {
				const result = await pi.exec("dev-browser", args, {
					signal,
					timeout: timeoutMs,
				});

				const combinedOutput = formatOutput(result.stdout, result.stderr);
				const contentText = combinedOutput || "dev-browser finished with no output.";
				const details = {
					command: "dev-browser",
					args,
					stdout: result.stdout,
					stderr: result.stderr,
					code: result.code,
					killed: result.killed,
					mode: params.connectUrl ? "connect-url" : params.connect ? "connect-auto" : "managed-browser",
					browser: params.browser ?? null,
					connectUrl: params.connectUrl ?? null,
					timeoutSeconds,
					...(params.saveArtifacts ? { scriptPath } : {}),
				};

				if (result.code !== 0) {
					throw new Error(truncate(contentText));
				}

				return {
					content: [{ type: "text", text: truncate(contentText) }],
					details,
				};
			} catch (error) {
				if (error instanceof Error && (signal?.aborted || error.name === "AbortError")) {
					throw new Error("dev-browser execution cancelled.");
				}
				throw error instanceof Error
					? error
					: new Error(`dev-browser execution failed: ${String(error)}`);
			} finally {
				if (!params.saveArtifacts) {
					try {
						unlinkSync(scriptPath);
					} catch {}
				}
			}
		},
	});

	pi.registerCommand("dev-browser", {
		description: "Inspect dev-browser status or run basic dev-browser CLI subcommands",
		handler: async (args, ctx) => {
			const subcommand = args.trim() || "status";
			const availability = await checkAvailability();
			setStatus(ctx);

			if (subcommand === "status") {
				const message = [
					"🌐 dev-browser",
					"",
					`available: ${availability.isAvailable ? "yes" : "no"}`,
					`details: ${availability.availabilityMessage}`,
					`temp dir: ${TMP_DIR}`,
				].join("\n");
				ctx.ui.notify(message, availability.isAvailable ? "info" : "warning");
				return;
			}

			if (!availability.isAvailable) {
				ctx.ui.notify(`dev-browser unavailable: ${availability.availabilityMessage}`, "error");
				return;
			}

			const allowedSubcommands = new Set(["browsers", "stop", "help"]);
			if (!allowedSubcommands.has(subcommand)) {
				ctx.ui.notify("Usage: /dev-browser [status|browsers|stop|help]", "info");
				return;
			}

			const cliArgs = subcommand === "help" ? ["--help"] : [subcommand];
			const result = await pi.exec("dev-browser", cliArgs, { timeout: 15_000 });
			const output = truncate(formatOutput(result.stdout, result.stderr) || "No output.");
			ctx.ui.notify(output, result.code === 0 ? "info" : "error");
		},
	});

	pi.on("session_start", async (_event, ctx) => {
		await checkAvailability();
		setStatus(ctx);
	});
}
