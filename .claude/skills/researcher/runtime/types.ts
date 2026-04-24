export interface ToolMeta {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  outputSchema: Record<string, unknown>;
  usageHints: string[];
  dependsOn: string[];
  createdAt: string;
  runs: number;
  successes: number;
}

export interface IndexEntry {
  name: string;
  description: string;
  hints: string[];
  runs: number;
  successes: number;
  createdAt: string;
}

export interface RunResult<T = unknown> {
  success: boolean;
  result?: T;
  logs?: string[];
  error?: { message: string; stack?: string };
}

export type ToolFn<I = unknown, O = unknown> = (input: I) => Promise<O>;
