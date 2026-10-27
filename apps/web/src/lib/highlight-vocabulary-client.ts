import { buildVocabularyRegex, normalizeWord } from "@docuvocab/shared";

export type HighlightVocabularyItem = {
  id: string;
  word: string;
};

const SKIP_TAG_SELECTOR = [
  "script",
  "style",
  "pre",
  "code",
  "a",
  "button",
  "textarea",
  "input",
  "select",
  "mark",
].join(",");

const SKIP_CONTAINER_SELECTOR = [
  "[data-math-format]",
  ".katex",
  "math",
  "mjx-container",
].join(",");

function shouldSkipTextNode(node: Text) {
  const parentElement = node.parentElement;

  if (!parentElement) return true;

  if (parentElement.closest(SKIP_CONTAINER_SELECTOR)) {
    return true;
  }

  return Boolean(parentElement.closest(SKIP_TAG_SELECTOR));
}

export function stabilizeMathMarkupHtml(html: string) {
  if (typeof DOMParser === "undefined") {
    return html;
  }

  const parser = new DOMParser();
  const document = parser.parseFromString(html, "text/html");

  // Legacy imports may include KaTeX dual-layer markup that can break when
  // CSS from the source page is missing. Keep the MathML layer as stable output.
  document.querySelectorAll(".katex-html").forEach((element) => {
    element.remove();
  });

  document.querySelectorAll(".katex-mathml").forEach((element) => {
    const mathElement = element.querySelector("math");

    if (mathElement) {
      element.replaceWith(mathElement.cloneNode(true));
      return;
    }

    element.removeAttribute("style");
  });

  return document.body.innerHTML;
}

export function createHighlightedVocabularyHtml(
  html: string,
  vocabularies: HighlightVocabularyItem[]
) {
  const regex = buildVocabularyRegex(vocabularies.map((vocab) => vocab.word));

  if (!regex) return html;

  const vocabularyIdByWord = new Map(
    vocabularies.map((vocab) => [
      normalizeWord(vocab.word),
      vocab.id,
    ])
  );

  const parser = new DOMParser();
  const document = parser.parseFromString(html, "text/html");

  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node) {
        const textNode = node as Text;

        if (shouldSkipTextNode(textNode)) {
          return NodeFilter.FILTER_REJECT;
        }

        if (!textNode.textContent?.trim()) {
          return NodeFilter.FILTER_REJECT;
        }

        return NodeFilter.FILTER_ACCEPT;
      },
    }
  );

  const textNodes: Text[] = [];

  while (walker.nextNode()) {
    textNodes.push(walker.currentNode as Text);
  }

  for (const textNode of textNodes) {
    const text = textNode.textContent ?? "";

    regex.lastIndex = 0;

    if (!regex.test(text)) continue;

    regex.lastIndex = 0;

    const fragment = document.createDocumentFragment();
    let lastIndex = 0;

    for (const match of text.matchAll(regex)) {
      const matchedText = match[0];
      const matchIndex = match.index ?? 0;

      fragment.append(
        document.createTextNode(text.slice(lastIndex, matchIndex))
      );

      const mark = document.createElement("mark");
      mark.className = "vocab-highlight";
      mark.textContent = matchedText;

      const vocabId = vocabularyIdByWord.get(
        normalizeWord(matchedText)
      );

      if (vocabId) {
        mark.dataset.vocabId = vocabId;
        mark.tabIndex = 0;
        mark.setAttribute("role", "button");
        mark.setAttribute(
          "aria-label",
          `Show vocabulary details for ${matchedText}`
        );
      }

      fragment.append(mark);

      lastIndex = matchIndex + matchedText.length;
    }

    fragment.append(document.createTextNode(text.slice(lastIndex)));

    textNode.replaceWith(fragment);
  }

  return document.body.innerHTML;
}