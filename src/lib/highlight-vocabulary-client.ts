export type HighlightVocabularyItem = {
  id: string;
  word: string;
};

const SKIP_TAGS = new Set([
  "SCRIPT",
  "STYLE",
  "PRE",
  "CODE",
  "A",
  "BUTTON",
  "TEXTAREA",
  "INPUT",
  "SELECT",
  "MARK",
]);

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeVocabularyKey(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function buildVocabularyRegex(vocabularies: HighlightVocabularyItem[]) {
  const words = vocabularies
    .map((vocab) => vocab.word.trim())
    .filter(Boolean)
    .sort((a, b) => b.length - a.length)
    .map(escapeRegExp);

  if (words.length === 0) return null;

  return new RegExp(`\\b(${words.join("|")})\\b`, "gi");
}

function shouldSkipTextNode(node: Text) {
  const parentElement = node.parentElement;

  if (!parentElement) return true;

  return Boolean(parentElement.closest([...SKIP_TAGS].join(",")));
}

export function createHighlightedVocabularyHtml(
  html: string,
  vocabularies: HighlightVocabularyItem[]
) {
  const regex = buildVocabularyRegex(vocabularies);

  if (!regex) return html;

  const vocabularyIdByWord = new Map(
    vocabularies.map((vocab) => [
      normalizeVocabularyKey(vocab.word),
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
        normalizeVocabularyKey(matchedText)
      );

      if (vocabId) {
        mark.dataset.vocabId = vocabId;
      }

      fragment.append(mark);

      lastIndex = matchIndex + matchedText.length;
    }

    fragment.append(document.createTextNode(text.slice(lastIndex)));

    textNode.replaceWith(fragment);
  }

  return document.body.innerHTML;
}