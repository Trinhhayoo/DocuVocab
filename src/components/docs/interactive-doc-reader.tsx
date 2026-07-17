"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { createHighlightedVocabularyHtml } from "@/lib/highlight-vocabulary-client";
import type { VocabularyItem } from "@/app/docs/view/client/vocab.types";
import { AnchorPosition } from "./doc-learning-workspace";

type TooltipState = {
  vocab: VocabularyItem;
  x: number;
  y: number;
};

type InteractiveDocReaderProps = {
  htmlContent: string;
  vocabularies: VocabularyItem[];
  onSelectText: (
    text: string,
    sentence: string,
    anchorPosition?: AnchorPosition
  ) => void;
};

export function InteractiveDocReader({
  htmlContent,
  vocabularies,
  onSelectText,
}: InteractiveDocReaderProps) {
  const isSelectingRef = useRef(false);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  const vocabularyById = useMemo(() => {
    return new Map(vocabularies.map((vocab) => [vocab.id, vocab]));
  }, [vocabularies]);

  useEffect(() => {
    const frameId = requestAnimationFrame(() => {
      setIsHydrated(true);
    });

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, []);

  const highlightedHtml = useMemo(() => {
    if (!isHydrated) return htmlContent;
    if (vocabularies.length === 0) return htmlContent;

    return createHighlightedVocabularyHtml(htmlContent, vocabularies);
  }, [htmlContent, vocabularies, isHydrated]);

  function handleMouseDown() {
    isSelectingRef.current = true;
    setTooltip(null);
  }

  function handleMouseUp() {
    isSelectingRef.current = false;

    const selection = window.getSelection();
    const selectedText = selection?.toString().trim();

    if (!selectedText) return;

    const cleanText = selectedText
      .replace(/\s+/g, " ")
      .replace(/[.,;:!?()[\]{}"'“”‘’]/g, "")
      .trim();

    if (!cleanText) return;
    if (cleanText.length > 80) return;

    const sentence = extractSentenceFromSelection(selection);
    const anchorPosition = getSelectionAnchorPosition(selection);

    onSelectText(cleanText, sentence, anchorPosition);
  }

  function getSelectionAnchorPosition(
    selection: Selection | null
  ): AnchorPosition | undefined {
    if (!selection) return undefined;

    const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
    if (!range) return undefined;

    const rect = range.getBoundingClientRect();
    if (!rect.width && !rect.height) return undefined;

    return {
      left: rect.left,
      right: rect.right,
      top: rect.top,
      bottom: rect.bottom,
    };
  }

  function extractSentenceFromSelection(selection: Selection | null): string {
    if (!selection?.anchorNode) return "";

    const blockParent =
      selection.anchorNode.nodeType === Node.TEXT_NODE
        ? selection.anchorNode.parentElement
        : selection.anchorNode instanceof HTMLElement
          ? selection.anchorNode
          : null;

    const fullText = blockParent?.textContent ?? "";
    const selected = selection.toString().trim();

    const idx = fullText.indexOf(selected);

    if (idx === -1) {
      return fullText.slice(0, 200).trim();
    }

    let start = idx;
    while (start > 0 && !/[.!?]/.test(fullText[start - 1])) {
      start--;
    }

    if (start > 0 && /[.!?]/.test(fullText[start - 1])) {
      start++;
    }

    let end = idx + selected.length;
    while (end < fullText.length && !/[.!?]/.test(fullText[end])) {
      end++;
    }

    if (end < fullText.length) {
      end++;
    }

    return fullText.slice(start, end).trim().slice(0, 500);
  }

  function handleMouseOver(event: React.MouseEvent<HTMLDivElement>) {
    if (isSelectingRef.current) return;

    const target = event.target;

    if (!(target instanceof HTMLElement)) return;

    const mark = target.closest("mark.vocab-highlight");

    if (!(mark instanceof HTMLElement)) return;

    const vocabId = mark.dataset.vocabId;
    if (!vocabId) return;

    const vocab = vocabularyById.get(vocabId);
    if (!vocab) return;

    const rect = mark.getBoundingClientRect();

    setTooltip({
      vocab,
      x: rect.left + rect.width / 2,
      y: rect.top,
    });
  }

  function handleMouseMove(event: React.MouseEvent<HTMLDivElement>) {
    if (isSelectingRef.current) return;

    const target = event.target;

    if (!(target instanceof HTMLElement)) {
      setTooltip(null);
      return;
    }

    const mark = target.closest("mark.vocab-highlight");

    if (!mark) {
      setTooltip(null);
    }
  }

  function handleMouseLeave() {
    isSelectingRef.current = false;
    setTooltip(null);
  }

  return (
    <div className="relative">
      <div
        className="doc-reader-content"
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseOver={handleMouseOver}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        dangerouslySetInnerHTML={{
          __html: highlightedHtml,
        }}
      />

      {tooltip && (
        <div
          className="pointer-events-none fixed z-50 max-w-xs -translate-x-1/2 -translate-y-full rounded-xl border bg-white px-3 py-2 text-sm shadow-lg"
          style={{
            left: tooltip.x,
            top: tooltip.y - 8,
          }}
        >
          <div className="font-semibold">{tooltip.vocab.word}</div>

          {tooltip.vocab.meaning && (
            <div className="mt-1 text-muted-foreground">
              {tooltip.vocab.meaning}
            </div>
          )}

          {tooltip.vocab.note && (
            <div className="mt-2 border-t pt-2 text-xs text-slate-500">
              {tooltip.vocab.note}
            </div>
          )}
        </div>
      )}
    </div>
  );
}