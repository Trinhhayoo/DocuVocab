"use client";

import { useMemo, useState } from "react";
import { BookOpen } from "lucide-react";

import { InteractiveDocReader } from "@/components/docs/interactive-doc-reader";
import { VocabularyEditorModal } from "@/components/docs/vocabulary-editor-modal";
import { Button } from "@/components/ui/button";
import { VocabularyForm } from "@/components/vocab/vocabulary-form";
import type { VocabularyItem } from "@/app/docs/view/client/vocab.types";
import { normalizeWord } from "@/bootstrap/helpers/normalize-word.helper";

export type AnchorPosition = {
  left: number;
  right: number;
  top: number;
  bottom: number;
};

type DocLearningWorkspaceProps = {
  docId: string;
  docTitle: string;
  sourceUrl: string;
  htmlContent: string;
  vocabularies: VocabularyItem[];
};

export function DocLearningWorkspace({
  docId,
  docTitle,
  sourceUrl,
  htmlContent,
  vocabularies,
}: DocLearningWorkspaceProps) {
  const [selectedWord, setSelectedWord] = useState("");
  const [selectedSentence, setSelectedSentence] = useState("");
  const [anchorPosition, setAnchorPosition] = useState<AnchorPosition | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const vocabularyByWord = useMemo(() => {
    return new Map(
      vocabularies.map((vocab) => [normalizeWord(vocab.word), vocab])
    );
  }, [vocabularies]);

  const existingVocabulary = selectedWord
    ? vocabularyByWord.get(normalizeWord(selectedWord)) ?? null
    : null;

  function clearSelection() {
    setSelectedWord("");
    setSelectedSentence("");
    setAnchorPosition(null);
    setIsModalOpen(false);
    window.getSelection()?.removeAllRanges();
  }

  function handleSelectText(
    text: string,
    sentence: string,
    nextAnchorPosition?: AnchorPosition
  ) {
    setSelectedWord(text);
    setSelectedSentence(sentence);
    setAnchorPosition(nextAnchorPosition ?? null);
    setIsModalOpen(Boolean(text));
  }

  function openModal() {
    if (!selectedWord) return;
    setIsModalOpen(true);
  }

  function closeModal() {
    clearSelection();
  }

  return (
    <main className="mx-auto grid max-w-7xl gap-8 px-4 py-8">
      <section className="min-w-0">
        <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border bg-white px-4 py-3 shadow-sm lg:hidden">
          <div>
            <p className="text-sm font-semibold">Vocabulary</p>
            <p className="text-xs text-muted-foreground">
              Open the editor for selected words and saved notes.
            </p>
          </div>
          {selectedWord ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={openModal}
            >
              <BookOpen className="size-4" />
              Open
            </Button>
          ) : null}
        </div>

        <article className="rounded-xl border bg-white p-6 shadow-sm">
          <InteractiveDocReader
            htmlContent={htmlContent}
            vocabularies={vocabularies}
            onSelectText={handleSelectText}
          />
        </article>
      </section>

      {isModalOpen && selectedWord ? (
        <VocabularyEditorModal
          isOpen={isModalOpen}
          title="Vocabulary editor"
          description={
            selectedWord
              ? `Editing “${selectedWord}”`
              : "Select a word to save or edit it."
          }
          anchorPosition={anchorPosition}
          onClose={closeModal}
        >
        {selectedWord ? (
          <VocabularyForm
            key={`${existingVocabulary?.id ?? "new"}-${selectedWord}`}
            docId={docId}
            selectedWord={selectedWord}
            selectedSentence={selectedSentence}
            sourceTitle={docTitle}
            sourceUrl={sourceUrl}
            existingVocabulary={existingVocabulary}
            onDone={clearSelection}
            onCancel={closeModal}
          />
        ) : (
          <div className="rounded-xl border border-dashed bg-slate-50 p-4 text-sm text-muted-foreground">
            Select a word in the article to add or edit a note.
          </div>
        )}
        </VocabularyEditorModal>
      ) : null}
    </main>
  );
}