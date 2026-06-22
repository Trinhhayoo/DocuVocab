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

function normalizeText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function getSiteName(url: string) {
  return new URL(url).hostname.replace(/^www\./, "");
}

function getPageTitle(document: Document, url: string) {
  const h1 = document.querySelector("h1")?.textContent;
  const title = document.querySelector("title")?.textContent;

  return normalizeText(h1 || title || new URL(url).hostname);
}

function looksLikeMainContent(element: Element) {
  const text = normalizeText(element.textContent ?? "");

  if (text.length < 500) return false;

  const paragraphCount = element.querySelectorAll("p").length;
  const headingCount = element.querySelectorAll("h1, h2, h3").length;

  return paragraphCount >= 3 || headingCount >= 2;
}

function findBestContentRoot(document: Document) {
  const selectors = [
    // Best for documentation sites like Next.js
    "[data-docs='true']",
    "[data-docs=true]",

    // Common semantic containers
    "main article",
    "article",
    "main [role='main']",
    "[role='main'] article",
    "[role='main']",
    "main",

    // Common docs/blog content containers
    ".docs-content",
    ".doc-content",
    ".documentation",
    ".markdown",
    ".markdown-body",
    ".prose",
    ".content",
  ];

  for (const selector of selectors) {
    const candidates = Array.from(document.querySelectorAll(selector));

    for (const candidate of candidates) {
      if (looksLikeMainContent(candidate)) {
        return candidate;
      }
    }
  }

  return null;
}

function removeNoiseFromContent(root: Element) {
  root.querySelectorAll("script, style, noscript, template").forEach((el) => {
    el.remove();
  });

  // Remove common UI-only controls inside docs pages.
  root
    .querySelectorAll(
      [
        "button",
        "[role='button']",
        "[data-heading-link]",
        "[aria-label='Link to this section']",
        "[aria-hidden='true']",
      ].join(",")
    )
    .forEach((el) => {
      el.remove();
    });

  // Remove empty elements caused by cleanup.
  root.querySelectorAll("p, div, span").forEach((el) => {
    const hasMediaOrCode = Boolean(
      el.querySelector("img, video, iframe, pre, code, table, svg")
    );

    const text = normalizeText(el.textContent ?? "");

    if (!hasMediaOrCode && text.length === 0) {
      el.remove();
    }
  });
}

function ensurePreCodeShape(root: Element) {
  root.querySelectorAll("pre").forEach((pre) => {
    const existingCode = pre.querySelector("code");

    if (existingCode) return;

    const text = pre.textContent ?? "";

    pre.textContent = "";

    const code = pre.ownerDocument.createElement("code");
    code.textContent = text;

    pre.appendChild(code);
  });
}

function getExcerpt(textContent: string) {
  const text = normalizeText(textContent);

  if (text.length <= 180) return text;

  return `${text.slice(0, 180)}...`;
}

function extractFromRawContentRoot(document: Document, url: string) {
  const contentRoot = findBestContentRoot(document);

  if (!contentRoot) return null;

  const clonedRoot = contentRoot.cloneNode(true);

  if (!(clonedRoot instanceof document.defaultView!.Element)) {
    return null;
  }

  removeNoiseFromContent(clonedRoot);
  removeThemeDuplicateImages(clonedRoot);
  ensurePreCodeShape(clonedRoot);
  wrapPreBlocksWithFigure(clonedRoot);

  const htmlContent = clonedRoot.innerHTML;
  const textContent = normalizeText(clonedRoot.textContent ?? "");

  if (textContent.length < 500) {
    return null;
  }

  return {
    title: getPageTitle(document, url),
    htmlContent,
    textContent,
    excerpt: getExcerpt(textContent),
    siteName: getSiteName(url),
    wordCount: textContent.split(/\s+/).filter(Boolean).length,
  } satisfies ExtractedReadableContent;
}

function extractWithReadability(document: Document, url: string) {
  const reader = new Readability(document, {
    keepClasses: true,
  });

  const article = reader.parse();

  if (!article?.textContent) {
    return null;
  }

  const articleDom = new JSDOM(article.content || "");
  const articleDocument = articleDom.window.document;

  ensurePreCodeShape(articleDocument.body);

  const htmlContent = articleDocument.body.innerHTML;
  const textContent = normalizeText(articleDocument.body.textContent ?? "");

  if (!textContent) {
    return null;
  }

  return {
    title: article.title || getPageTitle(document, url),
    htmlContent,
    textContent,
    excerpt: article.excerpt || getExcerpt(textContent),
    siteName: article.siteName || getSiteName(url),
    wordCount: textContent.split(/\s+/).filter(Boolean).length,
  } satisfies ExtractedReadableContent;
}

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

  const rawDom = new JSDOM(html, {
    url,
  });

  const rawDocument = rawDom.window.document;

  const rawContentResult = extractFromRawContentRoot(rawDocument, url);

  if (rawContentResult) {
    const resultDom = new JSDOM(rawContentResult.htmlContent);

    console.log("[EXTRACT] strategy: raw content root");
    console.log(
      "[EXTRACT] final pre count:",
      resultDom.window.document.querySelectorAll("pre").length
    );

    return rawContentResult;
  }

  const readabilityDom = new JSDOM(html, {
    url,
  });

  const readabilityResult = extractWithReadability(
    readabilityDom.window.document,
    url
  );

  if (readabilityResult) {
    const resultDom = new JSDOM(readabilityResult.htmlContent);

    console.log("[EXTRACT] strategy: readability fallback");
    console.log(
      "[EXTRACT] final pre count:",
      resultDom.window.document.querySelectorAll("pre").length
    );

    return readabilityResult;
  }

  throw new Error("Could not extract readable content from this page.");
}

type CodeCaptionParts = {
  filename: string;
  language: string | null;
};

const LANGUAGE_LABELS = [
  "TypeScript",
  "JavaScript",
  "TSX",
  "JSX",
  "HTML",
  "CSS",
  "JSON",
  "Bash",
  "Shell",
  "Terminal",
  "SQL",
  "Markdown",
];

function extractLanguageFromCaptionSuffix(suffix: string) {
  const value = normalizeText(suffix)
    .replace(/[-–—|•·:]/g, " ")
    .trim();

  if (!value) return null;

  const matches = LANGUAGE_LABELS.filter((language) =>
    new RegExp(language, "i").test(value)
  );

  if (matches.length === 0) return null;

  return matches[matches.length - 1];
}

function getLanguageFromFilename(filename: string) {
  const lower = filename.toLowerCase();

  if (lower.endsWith(".tsx")) return "TypeScript";
  if (lower.endsWith(".ts")) return "TypeScript";
  if (lower.endsWith(".jsx")) return "JavaScript";
  if (lower.endsWith(".js")) return "JavaScript";
  if (lower.endsWith(".json")) return "JSON";
  if (lower.endsWith(".css")) return "CSS";
  if (lower.endsWith(".scss")) return "CSS";
  if (lower.endsWith(".html")) return "HTML";
  if (lower.endsWith(".md") || lower.endsWith(".mdx")) return "Markdown";
  if (lower.endsWith(".sql")) return "SQL";
  if (lower.endsWith(".yml") || lower.endsWith(".yaml")) return "YAML";
  if (lower.endsWith(".prisma")) return "Prisma";

  return null;
}

function parseCodeCaption(text: string): CodeCaptionParts | null {
  const value = normalizeText(text)
    .replace(/\bcopy\b/gi, "")
    .replace(/\bcopied\b/gi, "")
    .trim();

  if (value.length < 3 || value.length > 240) {
    return null;
  }

  const fileMatch = value.match(
    /^(.*?\.(?:tsx|ts|jsx|js|json|css|scss|html|md|mdx|sql|env|yml|yaml|toml|prisma))([\s\S]*)$/i
  );

  let filename: string | null = null;
  let suffix = "";

  if (fileMatch?.[1]) {
    filename = normalizeText(fileMatch[1]);
    suffix = normalizeText(fileMatch[2] ?? "");
  } else {
    const specialFileMatch = value.match(
      /^(package\.json|tsconfig\.json|next\.config\.(?:js|ts|mjs)|middleware\.(?:ts|js))([\s\S]*)$/i
    );

    if (specialFileMatch?.[1]) {
      filename = normalizeText(specialFileMatch[1]);
      suffix = normalizeText(specialFileMatch[2] ?? "");
    }
  }

  if (!filename) {
    return null;
  }

const language =
  getLanguageFromFilename(filename) ??
  extractLanguageFromCaptionSuffix(suffix);
  
  return {
    filename,
    language,
  };
}

function findCodeFilenameElement(pre: Element) {
  let sibling = pre.previousElementSibling;

  while (sibling) {
    const text = normalizeText(sibling.textContent ?? "");

    if (!text) {
      sibling = sibling.previousElementSibling;
      continue;
    }

    const caption = parseCodeCaption(text);

    if (caption) {
      return {
        element: sibling,
        caption,
      };
    }

    break;
  }

  return null;
}

function wrapPreBlocksWithFigure(root: Element) {
  root.querySelectorAll("pre").forEach((pre) => {
    if (pre.closest("figure.code-figure")) return;

    const filenameResult = findCodeFilenameElement(pre);
    const document = pre.ownerDocument;

    const figure = document.createElement("figure");
    figure.className = "code-figure";

    if (filenameResult) {
      console.log("[CODE CAPTION]", filenameResult.caption);
      const figcaption = document.createElement("figcaption");
      figcaption.className = "code-filename";

      const filenameSpan = document.createElement("span");
      filenameSpan.className = "code-filename-path";
      filenameSpan.textContent = filenameResult.caption.filename;

      figcaption.appendChild(filenameSpan);

      if (filenameResult.caption.language) {
        const languageSpan = document.createElement("span");
        languageSpan.className = "code-filename-language";
        languageSpan.textContent = filenameResult.caption.language;

        figcaption.appendChild(languageSpan);
      }

      figure.appendChild(figcaption);
      filenameResult.element.remove();
    }

    pre.parentElement?.insertBefore(figure, pre);
    figure.appendChild(pre);
  });
}

function isDarkOnlyElement(element: Element) {
  const className = element.getAttribute("class") ?? "";

  return (
    className.includes("dark:block") ||
    className.includes("dark:inline") ||
    className.includes("dark:flex") ||
    className.includes("dark:grid") ||
    className.includes("dark:contents")
  );
}

function removeThemeDuplicateImages(root: Element) {
  const mediaElements = Array.from(root.querySelectorAll("picture, img"));

  for (const element of mediaElements) {
    if (!(element instanceof root.ownerDocument.defaultView!.HTMLElement)) {
      continue;
    }

    /**
     * Most docs sites render both light and dark images.
     * We keep the light/default image for the reader.
     */
    if (isDarkOnlyElement(element)) {
      element.remove();
    }
  }

  /**
   * Sometimes the theme class is on a parent wrapper:
   *
   * <div class="hidden dark:block">
   *   <img ... />
   * </div>
   */
  root.querySelectorAll("div, span, figure").forEach((element) => {
    if (!element.querySelector("img, picture")) return;

    if (isDarkOnlyElement(element)) {
      element.remove();
    }
  });

  /**
   * If two images with the same alt appear next to each other,
   * keep the first one.
   */
  const seenImageKeys = new Set<string>();

  root.querySelectorAll("img").forEach((img) => {
    const alt = img.getAttribute("alt") ?? "";
    const src = img.getAttribute("src") ?? "";
    const key = `${alt.trim().toLowerCase()}::${src.split("?")[0]}`;

    if (!alt && !src) return;

    if (seenImageKeys.has(key)) {
      img.remove();
      return;
    }

    seenImageKeys.add(key);
  });
}