import { collectTextNodes, isText } from "./text-nodes";
import type { VocabularyMatcher } from "./find-matches";

/** Must match the `::highlight()` name in highlight.css. */
const HIGHLIGHT_NAME = "docuvocab-vocabulary";

export type HighlightEntry = Readonly<{ range: Range; vocabId: string }>;

export type HighlightStats = Readonly<{ matchedWords: number; occurrences: number }>;

export type Highlighter = Readonly<{
  /** Re-matches every text node under `root` against `matcher`. */
  scan(root: Node, matcher: VocabularyMatcher): void;
  /** Drops ranges whose text node left the document. */
  prune(): void;
  clear(): void;
  hitTest(x: number, y: number): HighlightEntry | null;
  stats(): HighlightStats;
  dispose(): void;
}>;

export function isHighlightApiSupported() {
  return typeof CSS !== "undefined" && "highlights" in CSS && typeof Highlight === "function";
}

function caretAt(x: number, y: number): { node: Node; offset: number } | null {
  if (typeof document.caretPositionFromPoint === "function") {
    const position = document.caretPositionFromPoint(x, y);
    return position ? { node: position.offsetNode, offset: position.offset } : null;
  }

  const range = document.caretRangeFromPoint?.(x, y);
  return range ? { node: range.startContainer, offset: range.startOffset } : null;
}

function rectContains(rect: DOMRect, x: number, y: number) {
  return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
}

/**
 * Highlights through the CSS Custom Highlight API, so the page DOM is never modified and
 * frameworks such as React or Vue on the page keep working.
 */
export function createHighlighter(ownHost: Element): Highlighter {
  const highlight = new Highlight();
  const entriesByNode = new Map<Text, HighlightEntry[]>();
  CSS.highlights.set(HIGHLIGHT_NAME, highlight);

  function forget(node: Text) {
    for (const entry of entriesByNode.get(node) ?? []) highlight.delete(entry.range);
    entriesByNode.delete(node);
  }

  function scanNode(node: Text, matcher: VocabularyMatcher) {
    forget(node);

    const entries = matcher.find(node.data).map(({ start, end, vocabId }) => {
      const range = document.createRange();
      range.setStart(node, start);
      range.setEnd(node, end);
      highlight.add(range);
      return { range, vocabId };
    });

    if (entries.length > 0) entriesByNode.set(node, entries);
  }

  return {
    scan(root, matcher) {
      for (const node of collectTextNodes(root, ownHost)) scanNode(node, matcher);
    },
    prune() {
      for (const node of entriesByNode.keys()) {
        if (!node.isConnected) forget(node);
      }
    },
    clear() {
      highlight.clear();
      entriesByNode.clear();
    },
    hitTest(x, y) {
      const caret = caretAt(x, y);
      if (!caret || !isText(caret.node)) return null;

      const entry = entriesByNode.get(caret.node)?.find(
        ({ range }) => caret.offset >= range.startOffset && caret.offset <= range.endOffset,
      );

      // The caret snaps to the nearest character, so confirm the pointer is really over the word.
      return entry && [...entry.range.getClientRects()].some((rect) => rectContains(rect, x, y)) ? entry : null;
    },
    stats() {
      const vocabIds = new Set<string>();
      let occurrences = 0;
      for (const entries of entriesByNode.values()) {
        occurrences += entries.length;
        for (const entry of entries) vocabIds.add(entry.vocabId);
      }
      return { matchedWords: vocabIds.size, occurrences };
    },
    dispose() {
      CSS.highlights.delete(HIGHLIGHT_NAME);
      entriesByNode.clear();
    },
  };
}
