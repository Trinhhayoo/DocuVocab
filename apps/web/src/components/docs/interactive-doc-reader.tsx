"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import {
  createHighlightedVocabularyHtml,
  stabilizeMathMarkupHtml,
} from "@/lib/highlight-vocabulary-client";
import type { VocabularyItem } from "@/app/docs/view/client/vocab.types";
import {
  type Box,
  cleanSelectedText,
  extractSentence,
  placeNear,
} from "@docuvocab/shared";
import { AnchorPosition } from "./doc-learning-workspace";

type TooltipState = Readonly<{
  vocab: VocabularyItem;
  anchor: Box;
}>;

/** Shows above the word, or below it near the top, and never past a screen edge. */
function VocabularyTooltip({ vocab, anchor }: TooltipState) {
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Position from the rendered size before paint, so the tooltip never flashes off-screen.
  useLayoutEffect(() => {
    const tooltip = tooltipRef.current;
    if (!tooltip) return;

    const { width, height } = tooltip.getBoundingClientRect();
    const { left, top } = placeNear(
      anchor,
      { width, height },
      { width: window.innerWidth, height: window.innerHeight },
      "above"
    );

    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
    tooltip.style.visibility = "visible";
  }, [anchor, vocab]);

  return (
    <div
      ref={tooltipRef}
      role="tooltip"
      className="pointer-events-none fixed top-0 left-0 z-50 max-w-xs rounded-xl border bg-popover px-3 py-2 text-sm text-popover-foreground shadow-lg"
      style={{ visibility: "hidden" }}
    >
      <div className="font-semibold">{vocab.word}</div>

      {vocab.meaning && (
        <div className="mt-1 text-muted-foreground">{vocab.meaning}</div>
      )}

      {vocab.meaningEn && (
        <div lang="en" className="mt-1 text-muted-foreground">
          {vocab.meaningEn}
        </div>
      )}

      {vocab.note && (
        <div className="mt-2 border-t pt-2 text-xs text-muted-foreground">
          {vocab.note}
        </div>
      )}
    </div>
  );
}

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

    const stabilizedHtml = stabilizeMathMarkupHtml(htmlContent);

    if (vocabularies.length === 0) return stabilizedHtml;

    return createHighlightedVocabularyHtml(stabilizedHtml, vocabularies);
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

    const cleanText = cleanSelectedText(selectedText);

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

    return extractSentence(
      blockParent?.textContent ?? "",
      selection.toString().trim()
    );
  }

  function getHighlightMark(
    target: EventTarget | null
  ): HTMLElement | null {
    if (!(target instanceof HTMLElement)) return null;

    const mark = target.closest("mark.vocab-highlight");
    return mark instanceof HTMLElement ? mark : null;
  }

  function showTooltipForMark(mark: HTMLElement) {
    const vocabId = mark.dataset.vocabId;
    if (!vocabId) return;

    const vocab = vocabularyById.get(vocabId);
    if (!vocab) return;

    const { top, bottom, left, right } = mark.getBoundingClientRect();

    setTooltip({ vocab, anchor: { top, bottom, left, right } });
  }

  function activateHighlightMark(mark: HTMLElement) {
    if (isSelectingRef.current) return;
    showTooltipForMark(mark);
  }

  function handleMouseOver(event: React.MouseEvent<HTMLDivElement>) {
    const mark = getHighlightMark(event.target);
    if (!mark) return;

    activateHighlightMark(mark);
  }

  function handleClick(event: React.MouseEvent<HTMLDivElement>) {
    const mark = getHighlightMark(event.target);
    if (!mark) return;

    activateHighlightMark(mark);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Enter" && event.key !== " ") return;

    const mark = getHighlightMark(event.target);
    if (!mark) return;

    // Prevent page scroll when Space is used to activate a highlight.
    event.preventDefault();
    activateHighlightMark(mark);
  }

  function handleFocus(event: React.FocusEvent<HTMLDivElement>) {
    const mark = getHighlightMark(event.target);
    if (!mark) return;

    activateHighlightMark(mark);
  }

  function handleBlur(event: React.FocusEvent<HTMLDivElement>) {
    const mark = getHighlightMark(event.target);
    if (!mark) return;

    setTooltip(null);
  }

  function handleMouseMove(event: React.MouseEvent<HTMLDivElement>) {
    if (isSelectingRef.current) return;

    const mark = getHighlightMark(event.target);

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
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        dangerouslySetInnerHTML={{
          __html: highlightedHtml,
        }}
      />

      {tooltip && <VocabularyTooltip vocab={tooltip.vocab} anchor={tooltip.anchor} />}
    </div>
  );
}