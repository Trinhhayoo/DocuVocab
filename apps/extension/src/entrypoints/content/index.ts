import { cleanSelectedText, extractSentence } from "@docuvocab/shared";
import { browser, type Browser } from "wxt/browser";
import { defineContentScript } from "wxt/utils/define-content-script";

import { ACCESS_TOKEN_KEY } from "@/background/token-store";
import { createVocabularyMatcher } from "@/content/find-matches";
import { createHighlighter, isHighlightApiSupported } from "@/content/highlighter";
import { isText } from "@/content/text-nodes";
import { createOverlay } from "@/content/ui/overlay";
import { openPopover, type PopoverValues } from "@/content/ui/popover";
import { ok } from "@/lib/api-result";
import { sendToBackground, type TabMessage } from "@/lib/messages";
import type { Vocabulary } from "@/lib/vocabulary";

import "./highlight.css";

const MAX_SELECTION_LENGTH = 80;
const MAX_PAGE_TITLE_LENGTH = 255;
const MUTATION_DEBOUNCE_MS = 250;
const SENTENCE_CONTAINER = "p, li, td, th, dd, dt, blockquote, figcaption, h1, h2, h3, h4, h5, h6";

function optional(value: string) {
  return value || undefined;
}

function sentenceAround(range: Range, selectedText: string) {
  const start = range.startContainer;
  const element = isText(start) ? start.parentElement : start instanceof Element ? start : null;
  const container = element?.closest(SENTENCE_CONTAINER) ?? element;
  return extractSentence(container?.textContent ?? "", selectedText);
}

export default defineContentScript({
  matches: ["<all_urls>"],
  runAt: "document_idle",
  main(ctx) {
    const overlay = createOverlay();
    const highlighter = isHighlightApiSupported() ? createHighlighter(overlay.host) : null;
    let vocabularies: Vocabulary[] = [];
    let matcher = createVocabularyMatcher([]);
    let vocabularyById = new Map<string, Vocabulary>();
    let closePopover: (() => void) | null = null;

    function setVocabularies(next: Vocabulary[]) {
      vocabularies = next;
      matcher = createVocabularyMatcher(next);
      vocabularyById = new Map(next.map((vocabulary) => [vocabulary.id, vocabulary]));
      highlighter?.clear();
      highlighter?.scan(document.body, matcher);
    }

    async function loadVocabularies() {
      const result = await sendToBackground("GET_VOCABULARIES", { url: location.href });
      setVocabularies(result.success ? result.data.vocabularies : []);
    }

    function openSaveDialog(word: string, sentence: string, anchor: DOMRect) {
      closePopover?.();
      closePopover = openPopover(overlay.root, {
        word,
        sentence,
        anchor,
        saved: matcher.findVocabulary(word),
        explain: () =>
          sendToBackground("EXPLAIN_VOCABULARY", {
            text: word,
            sentence: optional(sentence),
            sourceTitle: optional(document.title.slice(0, MAX_PAGE_TITLE_LENGTH)),
            sourceUrl: location.href,
          }),
        save: (values: PopoverValues) =>
          sendToBackground("SAVE_VOCABULARY", {
            word,
            meaning: optional(values.meaning),
            meaningEn: optional(values.meaningEn),
            note: optional(values.note),
            noteEn: optional(values.noteEn),
            exampleSentence: optional(values.exampleSentence),
            originalSentence: optional(sentence),
            sourceUrl: location.href,
            sourceHostname: location.hostname,
            pageTitle: optional(document.title.slice(0, MAX_PAGE_TITLE_LENGTH)),
          }),
        login: () => sendToBackground("LOGIN", { returnTo: location.href }),
        onSaved: (vocabulary) => setVocabularies([...vocabularies, vocabulary]),
      });
    }

    function handleSelection() {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;

      const selectedText = selection.toString().trim();
      const word = cleanSelectedText(selectedText);
      if (!word || word.length > MAX_SELECTION_LENGTH) return;

      const range = selection.getRangeAt(0);
      const anchor = range.getBoundingClientRect();
      const sentence = sentenceAround(range, selectedText);

      overlay.showSaveButton(anchor, () => {
        overlay.hideSaveButton();
        openSaveDialog(word, sentence, anchor);
      });
    }

    // Selection -> floating "Save word" button.
    ctx.addEventListener(document, "mousedown", (event) => {
      if (!overlay.owns(event)) overlay.hideSaveButton();
    });
    ctx.addEventListener(document, "mouseup", (event) => {
      if (!overlay.owns(event)) ctx.setTimeout(handleSelection, 0);
    });

    // Hover -> tooltip, hit-tested once per frame because highlights are not DOM elements.
    let pointer: { x: number; y: number } | null = null;
    let frame = 0;

    function updateTooltip() {
      frame = 0;
      const entry = pointer && highlighter?.hitTest(pointer.x, pointer.y);
      const vocabulary = entry ? vocabularyById.get(entry.vocabId) : undefined;

      if (entry && vocabulary) {
        overlay.showTooltip(vocabulary, entry.range.getBoundingClientRect());
      } else {
        overlay.hideTooltip();
      }
    }

    ctx.addEventListener(document, "mousemove", (event) => {
      pointer = { x: event.clientX, y: event.clientY };
      frame ||= ctx.requestAnimationFrame(updateTooltip);
    });
    ctx.addEventListener(window, "scroll", () => overlay.hideTooltip(), { capture: true, passive: true });

    // New or changed page content is highlighted incrementally.
    const pendingRoots = new Set<Node>();
    let flushTimer: number | undefined;

    function flushMutations() {
      flushTimer = undefined;
      highlighter?.prune();
      for (const node of pendingRoots) {
        if (node.isConnected) highlighter?.scan(node, matcher);
      }
      pendingRoots.clear();
    }

    const observer = new MutationObserver((records) => {
      for (const record of records) {
        if (record.type === "characterData") pendingRoots.add(record.target);
        for (const node of record.addedNodes) pendingRoots.add(node);
      }
      flushTimer ??= ctx.setTimeout(flushMutations, MUTATION_DEBOUNCE_MS);
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });

    // Single-page apps change the URL without reloading the content script.
    ctx.addEventListener(window, "wxt:locationchange", () => void loadVocabularies());

    // Reload when the user signs in or out; a token refresh alone keeps the current highlights.
    function handleStorageChange(changes: Record<string, Browser.storage.StorageChange>, area: string) {
      const change = changes[ACCESS_TOKEN_KEY];
      if (area === "local" && change && Boolean(change.oldValue) !== Boolean(change.newValue)) {
        void loadVocabularies();
      }
    }

    function handleTabMessage(
      message: TabMessage,
      _sender: Browser.runtime.MessageSender,
      sendResponse: (response: unknown) => void,
    ) {
      switch (message.type) {
        case "GET_HIGHLIGHT_STATS":
          sendResponse(ok(highlighter?.stats() ?? { matchedWords: 0, occurrences: 0 }));
          return false;
        case "REHIGHLIGHT":
          void loadVocabularies().then(() => sendResponse(ok(null)));
          return true;
      }
    }

    browser.storage.onChanged.addListener(handleStorageChange);
    browser.runtime.onMessage.addListener(handleTabMessage);

    ctx.onInvalidated(() => {
      observer.disconnect();
      browser.storage.onChanged.removeListener(handleStorageChange);
      browser.runtime.onMessage.removeListener(handleTabMessage);
      closePopover?.();
      highlighter?.dispose();
      overlay.dispose();
    });

    void loadVocabularies();
  },
});
