interface Result {
  title: string;
  url: string;
  snippet: string;
}
type Provider = "ddg" | "jina" | "tavily" | "exa" | "brave" | "perplexity" | "firecrawl";
interface Input {
  query: string;
  n?: number;
  provider?: Provider;
}
interface Output {
  provider: Provider;
  results: Result[];
  answer?: string;
}

function pickProvider(): Provider {
  if (process.env.TAVILY_API_KEY) return "tavily";
  if (process.env.EXA_API_KEY) return "exa";
  if (process.env.BRAVE_API_KEY) return "brave";
  if (process.env.PERPLEXITY_API_KEY) return "perplexity";
  if (process.env.FIRECRAWL_API_KEY) return "firecrawl";
  if (process.env.JINA_API_KEY) return "jina";
  return "ddg";
}

// DuckDuckGo HTML scrape — true keyless fallback
async function ddg(q: string, n: number): Promise<Output> {
  const res = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(q)}`, {
    headers: {
      "user-agent": "researcher-skill/0.1 (+https://anthropic.com/claude-code)",
    },
  });
  if (!res.ok) throw new Error(`ddg ${res.status}`);
  const html = await res.text();
  const results: Result[] = [];
  // Parse result blocks: <a class="result__a" href="...">title</a> + <a class="result__snippet">...</a>
  const linkRe = /<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  const snippetRe = /<a[^>]+class="result__snippet"[^>]*>([\s\S]*?)<\/a>/gi;
  const links = [...html.matchAll(linkRe)];
  const snippets = [...html.matchAll(snippetRe)];
  for (let i = 0; i < Math.min(links.length, n); i++) {
    const href = links[i]![1]!;
    // DDG wraps URLs in a redirect; extract the actual URL
    const urlMatch = href.match(/uddg=([^&]+)/);
    const url = urlMatch ? decodeURIComponent(urlMatch[1]!) : href;
    const title = links[i]![2]!.replace(/<[^>]+>/g, "").trim();
    const snippet = (snippets[i]?.[1] ?? "").replace(/<[^>]+>/g, "").trim();
    results.push({ title, url, snippet });
  }
  return { provider: "ddg", results };
}

// Jina Search — requires JINA_API_KEY (free tier available at jina.ai)
async function jina(q: string, n: number): Promise<Output> {
  const headers: Record<string, string> = {
    accept: "application/json",
    "x-return-format": "json",
  };
  if (process.env.JINA_API_KEY) {
    headers["authorization"] = `Bearer ${process.env.JINA_API_KEY}`;
  }
  const res = await fetch(`https://s.jina.ai/?q=${encodeURIComponent(q)}`, { headers });
  if (!res.ok) throw new Error(`jina ${res.status}`);
  const body = (await res.json()) as { data?: Array<{ title?: string; url?: string; description?: string; content?: string }> };
  const results = (body.data ?? []).slice(0, n).map((d) => ({
    title: d.title ?? "",
    url: d.url ?? "",
    snippet: (d.description ?? d.content ?? "").slice(0, 400),
  }));
  return { provider: "jina", results };
}

async function tavily(q: string, n: number): Promise<Output> {
  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      api_key: process.env.TAVILY_API_KEY,
      query: q,
      max_results: n,
      include_answer: true,
    }),
  });
  if (!res.ok) throw new Error(`tavily ${res.status}: ${await res.text()}`);
  const body = (await res.json()) as { answer?: string; results?: Array<{ title: string; url: string; content: string }> };
  return {
    provider: "tavily",
    answer: body.answer,
    results: (body.results ?? []).map((r) => ({ title: r.title, url: r.url, snippet: r.content })),
  };
}

async function exa(q: string, n: number): Promise<Output> {
  const res = await fetch("https://api.exa.ai/search", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": process.env.EXA_API_KEY ?? "",
    },
    body: JSON.stringify({ query: q, numResults: n, contents: { text: true } }),
  });
  if (!res.ok) throw new Error(`exa ${res.status}: ${await res.text()}`);
  const body = (await res.json()) as { results?: Array<{ title?: string; url: string; text?: string }> };
  return {
    provider: "exa",
    results: (body.results ?? []).map((r) => ({
      title: r.title ?? "",
      url: r.url,
      snippet: (r.text ?? "").slice(0, 400),
    })),
  };
}

async function brave(q: string, n: number): Promise<Output> {
  const res = await fetch(
    `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(q)}&count=${n}`,
    {
      headers: {
        accept: "application/json",
        "x-subscription-token": process.env.BRAVE_API_KEY ?? "",
      },
    },
  );
  if (!res.ok) throw new Error(`brave ${res.status}: ${await res.text()}`);
  const body = (await res.json()) as { web?: { results?: Array<{ title: string; url: string; description: string }> } };
  return {
    provider: "brave",
    results: (body.web?.results ?? []).map((r) => ({
      title: r.title,
      url: r.url,
      snippet: r.description,
    })),
  };
}

async function perplexity(q: string, _n: number): Promise<Output> {
  const res = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${process.env.PERPLEXITY_API_KEY ?? ""}`,
    },
    body: JSON.stringify({
      model: "sonar",
      messages: [{ role: "user", content: q }],
    }),
  });
  if (!res.ok) throw new Error(`perplexity ${res.status}: ${await res.text()}`);
  const body = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    citations?: string[];
  };
  const answer = body.choices?.[0]?.message?.content ?? "";
  const citations = body.citations ?? [];
  return {
    provider: "perplexity",
    answer,
    results: citations.map((url) => ({ title: url, url, snippet: "" })),
  };
}

async function firecrawl(q: string, n: number): Promise<Output> {
  const res = await fetch("https://api.firecrawl.dev/v1/search", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${process.env.FIRECRAWL_API_KEY ?? ""}`,
    },
    body: JSON.stringify({ query: q, limit: n }),
  });
  if (!res.ok) throw new Error(`firecrawl ${res.status}: ${await res.text()}`);
  const body = (await res.json()) as { data?: Array<{ title?: string; url: string; description?: string }> };
  return {
    provider: "firecrawl",
    results: (body.data ?? []).map((r) => ({
      title: r.title ?? "",
      url: r.url,
      snippet: r.description ?? "",
    })),
  };
}

export default async function search_web(input: Input): Promise<Output> {
  const { query, n = 8, provider } = input;
  const chosen: Provider = provider ?? pickProvider();
  switch (chosen) {
    case "tavily": return tavily(query, n);
    case "exa": return exa(query, n);
    case "brave": return brave(query, n);
    case "perplexity": return perplexity(query, n);
    case "firecrawl": return firecrawl(query, n);
    case "jina": return jina(query, n);
    case "ddg":
    default: return ddg(query, n);
  }
}
