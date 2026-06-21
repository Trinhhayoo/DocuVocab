import { JSDOM } from "jsdom";
import { createHighlighter } from "shiki";

const highlighterPromise = createHighlighter({
  themes: ["vitesse-dark"],
  langs: [
    "javascript",
    "typescript",
    "tsx",
    "jsx",
    "html",
    "css",
    "json",
    "bash",
    "shell",
    "markdown",
    "sql",
  ],
});

const SUPPORTED_LANGUAGES = new Set([
  "javascript",
  "js",
  "typescript",
  "ts",
  "tsx",
  "jsx",
  "html",
  "css",
  "json",
  "bash",
  "shell",
  "sh",
  "markdown",
  "md",
  "sql",
]);

function normalizeLanguage(language: string) {
  const normalized = language.toLowerCase();

  if (normalized === "js") return "javascript";
  if (normalized === "ts") return "typescript";
  if (normalized === "sh") return "bash";
  if (normalized === "md") return "markdown";

  return normalized;
}

function getLanguageFromClassName(className: string | null) {
  if (!className) return null;

  const match = className.match(/language-([a-zA-Z0-9_-]+)/);

  if (!match?.[1]) return null;

  const language = normalizeLanguage(match[1]);

  return SUPPORTED_LANGUAGES.has(language) ? language : null;
}

function stripExistingLineNumbers(code: string) {
  const lines = code.replace(/\r\n/g, "\n").split("\n");

  const cleanedLines: string[] = [];
  let removedOrStrippedCount = 0;

  for (const line of lines) {
    const trimmed = line.trim();

    /**
     * Case 1:
     * Line contains only a number.
     *
     * Example:
     * "1"
     * "2"
     * "   10   "
     *
     * These are fake line-number rows from imported HTML.
     * Remove the whole line.
     */
    if (/^\d+$/.test(trimmed)) {
      removedOrStrippedCount++;
      continue;
    }

    /**
     * Case 2:
     * Line starts with a number followed by code.
     *
     * Examples:
     * "10import OpenAI from \"openai\";"
     * "11 const client = new OpenAI();"
     * "14    model: \"gpt-5.5\","
     *
     * Remove the leading number, keep the code.
     */
    const lineWithNumberAndCode = line.match(/^(\s*)(\d+)(?=\D)(\s?)(.*)$/);

    if (lineWithNumberAndCode) {
      const indentation = lineWithNumberAndCode[1] ?? "";
      const codePart = lineWithNumberAndCode[4] ?? "";

      removedOrStrippedCount++;
      cleanedLines.push(`${indentation}${codePart}`);
      continue;
    }

    cleanedLines.push(line);
  }

  /**
   * Only apply the cleanup if we actually found several line-number artifacts.
   * This avoids damaging normal code that happens to start with a number.
   */
  if (removedOrStrippedCount < 3) {
    return code.trim();
  }

  return cleanedLines.join("\n").trim();
}

function isLineNumberOnlyBlock(code: string) {
  const lines = code
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) return true;

  return lines.every((line, index) => line === String(index + 1));
}

function looksLikeCode(code: string) {
  const trimmed = code.trim();

  if (trimmed.length === 0) return false;

  if (isLineNumberOnlyBlock(trimmed)) {
    return false;
  }

  const codeSignals = [
    /import\s+.+\s+from\s+["']/,
    /export\s+(default\s+)?/,
    /\bconst\s+\w+\s*=/,
    /\blet\s+\w+\s*=/,
    /\bvar\s+\w+\s*=/,
    /\bfunction\s+\w+\s*\(/,
    /=>/,
    /\bawait\b/,
    /\basync\b/,
    /console\.log/,
    /<\/?[a-z][\s\S]*>/i,
    /\{[\s\S]*\}/,
    /\[[\s\S]*\]/,
    /;\s*$/,
    /^\s*[\w-]+\s*:\s*.+/m,
    /^\s*\$\s+/m,
    /^\s*npm\s+/m,
    /^\s*pnpm\s+/m,
    /^\s*npx\s+/m,
    /^\s*yarn\s+/m,
    /^\s*SELECT\s+/im,
  ];

  return codeSignals.some((pattern) => pattern.test(trimmed));
}

function inferLanguageFromCode(code: string) {
  const trimmed = code.trim();

  if (
    /import\s+.+\s+from\s+["']/.test(trimmed) ||
    /\bconst\s+\w+\s*=/.test(trimmed) ||
    /\blet\s+\w+\s*=/.test(trimmed) ||
    /\bawait\b/.test(trimmed) ||
    /console\.log/.test(trimmed) ||
    /=>/.test(trimmed)
  ) {
    return "typescript";
  }

  if (
    trimmed.startsWith("{") ||
    trimmed.startsWith("[")
  ) {
    return "json";
  }

  if (
    trimmed.startsWith("<") &&
    trimmed.includes(">")
  ) {
    return "html";
  }

  if (
    /^\s*(npm|pnpm|yarn|npx)\s+/m.test(trimmed)
  ) {
    return "bash";
  }

  if (
    /^\s*SELECT\s+/im.test(trimmed)
  ) {
    return "sql";
  }

  return "text";
}

export async function highlightCodeBlocks(html: string) {
  console.log("check into");
  const highlighter = await highlighterPromise;

  const dom = new JSDOM(html);
  const document = dom.window.document;

  const preElements = Array.from(document.querySelectorAll("pre"));

  console.log("[HIGHLIGHT] pre count:", preElements.length);

  for (const preElement of preElements) {
    const codeElement = preElement.querySelector("code");

    const originalCode =
      codeElement?.textContent ?? preElement.textContent ?? "";

    const detectedLanguage = getLanguageFromClassName(
      codeElement?.getAttribute("class") ?? preElement.getAttribute("class")
    );

    const shouldHighlight =
      detectedLanguage !== null || looksLikeCode(originalCode);

    if (!shouldHighlight) {
      preElement.classList.add("plain-text-block");
      continue;
    }

    const cleanedCode = stripExistingLineNumbers(originalCode);

    if (!looksLikeCode(cleanedCode) && detectedLanguage === null) {
      preElement.classList.add("plain-text-block");
      continue;
    }

    const language = detectedLanguage ?? inferLanguageFromCode(cleanedCode);

    console.log("[HIGHLIGHT] highlighting block:", {
      detectedLanguage,
      language,
      preview: cleanedCode.slice(0, 160),
    });

    const highlightedHtml = highlighter.codeToHtml(cleanedCode, {
      lang: language,
      theme: "vitesse-dark",
      transformers: [
        {
          line(node, line) {
            const originalChildren = node.children;

            node.children = [
              {
                type: "element",
                tagName: "span",
                properties: {
                  class: "line-number",
                  "aria-hidden": "true",
                },
                children: [
                  {
                    type: "text",
                    value: String(line),
                  },
                ],
              },
              {
                type: "element",
                tagName: "span",
                properties: {
                  class: "line-code",
                },
                children: originalChildren,
              },
            ];

            node.properties["data-line"] = String(line);
          },
        },
      ],
    });

    const highlightedDom = new JSDOM(highlightedHtml);
    const highlightedPre = highlightedDom.window.document.querySelector("pre");

    if (!highlightedPre) continue;

    highlightedPre.setAttribute("data-language", language);
    highlightedPre.className = "shiki-code-block";

    preElement.replaceWith(highlightedPre);
  }

  const result = document.body.innerHTML;

  console.log("[HIGHLIGHT] result has shiki:", result.includes("shiki-code-block"));
  console.log("[HIGHLIGHT] result has line-number:", result.includes("line-number"));
  console.log("[HIGHLIGHT] result has style:", result.includes("style="));

  return result;
}