"use client";

import { useMemo, useState } from "react";

import { InteractiveDocReader } from "@/components/docs/interactive-doc-reader";
import { VocabularyForm } from "@/components/vocab/vocabulary-form";
import { VocabularyList } from "@/components/vocab/vocabulary-list";
import type { VocabularyItem } from "@/features/vocab/types";
import { normalizeWord } from "@/lib/normalize-word";

type DocLearningWorkspaceProps = {
  docId: string;
  htmlContent: string;
  vocabularies: VocabularyItem[];
};

export function DocLearningWorkspace({
  docId,
  htmlContent,
  vocabularies,
}: DocLearningWorkspaceProps) {
  const [selectedWord, setSelectedWord] = useState("");

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
    window.getSelection()?.removeAllRanges();
  }

  return (
    <main className="mx-auto grid max-w-7xl gap-8 px-4 py-8 lg:grid-cols-[1fr_360px]">
      <section className="min-w-0">
        <article className="rounded-xl border bg-white p-6 shadow-sm">
          <InteractiveDocReader
            htmlContent={htmlContent}
            vocabularies={vocabularies}
            onSelectText={setSelectedWord}
          />
        </article>
      </section>

      <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
        <div>
          <h2 className="text-lg font-semibold">Vocabulary</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Select a word in the article to add or edit a note.
          </p>
        </div>

        {selectedWord ? (
          <VocabularyForm
            key={`${existingVocabulary?.id ?? "new"}-${selectedWord}`}
            docId={docId}
            selectedWord={selectedWord}
            existingVocabulary={existingVocabulary}
            onDone={clearSelection}
            onCancel={clearSelection}
          />
        ) : (
          <div className="rounded-xl border border-dashed bg-white p-4 text-sm text-muted-foreground">
            Select a word in the document to add a note.
          </div>
        )}

        <VocabularyList vocabularies={vocabularies} />
      </aside>
    </main>
  );
}