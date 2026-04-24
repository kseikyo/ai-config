import * as cheerio from "cheerio";
import TurndownService from "turndown";

interface Input {
  html: string;
  baseUrl?: string;
}
interface LinkRef {
  href: string;
  text: string;
}
interface Output {
  title: string;
  markdown: string;
  links: LinkRef[];
}

const STRIP_SELECTORS = [
  "script",
  "style",
  "noscript",
  "iframe",
  "nav",
  "footer",
  "header",
  "aside",
  "form",
  "[role=navigation]",
  "[role=banner]",
  "[role=contentinfo]",
  ".advertisement",
  ".ads",
  ".nav",
  ".sidebar",
];

function resolveUrl(href: string, base?: string): string {
  if (!base) return href;
  try {
    return new URL(href, base).toString();
  } catch {
    return href;
  }
}

export default async function extract_readable(input: Input): Promise<Output> {
  const { html, baseUrl } = input;
  const $ = cheerio.load(html);
  for (const sel of STRIP_SELECTORS) $(sel).remove();

  const title = ($("title").first().text() || $("h1").first().text() || "").trim();

  const links: LinkRef[] = [];
  $("a[href]").each((_i, el) => {
    const $el = $(el);
    const href = $el.attr("href");
    const text = $el.text().trim();
    if (!href || !text) return;
    if (href.startsWith("#") || href.startsWith("javascript:")) return;
    links.push({ href: resolveUrl(href, baseUrl), text });
  });

  const main =
    $("article").first().html() ??
    $("main").first().html() ??
    $("body").html() ??
    "";

  const td = new TurndownService({ headingStyle: "atx", codeBlockStyle: "fenced" });
  td.remove(["script", "style"]);
  const markdown = td.turndown(main).trim();

  return { title, markdown, links };
}
