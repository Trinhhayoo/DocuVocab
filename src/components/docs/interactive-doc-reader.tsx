"use client";

import { useEffect, useMemo, useState } from "react";

import {
  createHighlightedVocabularyHtml,
  type HighlightVocabularyItem,
} from "@/lib/highlight-vocabulary-client";
import type { VocabularyItem } from "@/app/docs/view/client/vocab.types";

type TooltipState = {
  vocab: VocabularyItem;
  x: number;
  y: number;
};

type InteractiveDocReaderProps = {
  htmlContent: string;
  vocabularies: VocabularyItem[];
  onSelectText: (text: string) => void;
};

export function InteractiveDocReader({
  htmlContent,
  vocabularies,
  onSelectText,
}: InteractiveDocReaderProps) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  const vocabularyById = useMemo(() => {
    return new Map(vocabularies.map((vocab) => [vocab.id, vocab]));
  }, [vocabularies]);

  const highlightItems = useMemo<HighlightVocabularyItem[]>(() => {
    return vocabularies.map((vocab) => ({
      id: vocab.id,
      word: vocab.word,
    }));
  }, [vocabularies]);

  const [isHydrated, setIsHydrated] = useState(false);

useEffect(() => {
  const frameId = requestAnimationFrame(() => {
    setIsHydrated(true);
  });

  return () => {
    cancelAnimationFrame(frameId);
  };
}, []);

const highlightedHtml = useMemo(() => {
  if (!isHydrated) {
    return htmlContent;
  }

  return createHighlightedVocabularyHtml(htmlContent, vocabularies);
}, [htmlContent, vocabularies, isHydrated]);



  // const highlightedHtml = useMemo(() => {
  //   if (typeof window === "undefined") {
  //     return htmlContent;
  //   }

  //   return createHighlightedVocabularyHtml(htmlContent, highlightItems);
  // }, [htmlContent, highlightItems]);

  function handleMouseUp() {
    const selectedText = window.getSelection()?.toString().trim();

    if (!selectedText) return;

    const cleanText = selectedText
      .replace(/\s+/g, " ")
      .replace(/[.,;:!?()[\]{}"'“”‘’]/g, "")
      .trim();

    if (!cleanText) return;
    if (cleanText.length > 80) return;

    onSelectText(cleanText);
  }

  function handleMouseOver(event: React.MouseEvent<HTMLDivElement>) {
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
    setTooltip(null);
  }

  return (
    <div className="relative">
      <div
        className="doc-reader-content"
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