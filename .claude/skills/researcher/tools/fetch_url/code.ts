interface Input {
  url: string;
  headers?: Record<string, string>;
  timeoutMs?: number;
}
interface Output {
  status: number;
  contentType: string;
  text: string;
  truncated: boolean;
  url: string;
}

const MAX_BYTES = 500 * 1024;

export default async function fetch_url(input: Input): Promise<Output> {
  const { url, headers = {}, timeoutMs = 10_000 } = input;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers: {
        "user-agent": "researcher-skill/0.1 (+https://anthropic.com/claude-code)",
        ...headers,
      },
      signal: ctrl.signal,
      redirect: "follow",
    });
    const contentType = res.headers.get("content-type") ?? "";
    const buf = new Uint8Array(await res.arrayBuffer());
    const truncated = buf.byteLength > MAX_BYTES;
    const slice = truncated ? buf.subarray(0, MAX_BYTES) : buf;
    const text = new TextDecoder("utf-8", { fatal: false }).decode(slice);
    return { status: res.status, contentType, text, truncated, url: res.url };
  } finally {
    clearTimeout(timer);
  }
}
