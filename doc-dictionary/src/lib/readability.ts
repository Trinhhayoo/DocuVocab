import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";

export type ExtractedReadableContent = {
  title: string;
  htmlContent: string;
  textContent: string;
  excerpt: string;
  siteName: string | null;
  wordCount: number;
};

export async function extractReadableContent(
  url: string
): Promise<ExtractedReadableContent> {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "DocDictionaryBot/1.0",
      Accept: "text/html",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch URL. Status: ${response.status}`);
  }

  const contentType = response.headers.get("content-type");

  if (!contentType?.includes("text/html")) {
    throw new Error("This URL does not return an HTML page.");
  }

  const html = await response.text();

  const dom = new JSDOM(html, {
    url,
  });

  const reader = new Readability(dom.window.document);
  const article = reader.parse();

  if (!article?.textContent) {
    throw new Error("Could not extract readable content from this page.");
  }

  const textContent = article.textContent.trim();

  return {
    title: article.title || new URL(url).hostname,
    htmlContent: article.content || "",
    textContent,
    excerpt: article.excerpt || "",
    siteName: article.siteName || new URL(url).hostname,
    wordCount: textContent.split(/\s+/).filter(Boolean).length,
  };
}