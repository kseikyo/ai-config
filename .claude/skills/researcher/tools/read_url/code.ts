import fetch_url from "../fetch_url/code.ts";
import extract_readable from "../extract_readable/code.ts";

interface Input {
  url: string;
  timeoutMs?: number;
}
interface Output {
  title: string;
  markdown: string;
  source: "jina" | "local";
  url: string;
}

async function tryJina(url: string, timeoutMs: number): Promise<Output | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`https://r.jina.ai/${url}`, {
      headers: { "x-return-format": "markdown", accept: "text/plain" },
      signal: ctrl.signal,
    });
    if (!res.ok) return null;
    const md = (await res.text()).trim();
    if (!md) return null;
    const firstLine = md.split("\n").find((l) => l.trim().length > 0) ?? "";
    const title = firstLine.replace(/^#+\s*/, "").slice(0, 240);
    return { title, markdown: md, source: "jina", url };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export default async function read_url(input: Input): Promise<Output> {
  const { url, timeoutMs = 15_000 } = input;
  const jina = await tryJina(url, timeoutMs);
  if (jina) return jina;

  const raw = await fetch_url({ url, timeoutMs });
  const { title, markdown } = await extract_readable({ html: raw.text, baseUrl: raw.url });
  return { title, markdown, source: "local", url: raw.url };
}
