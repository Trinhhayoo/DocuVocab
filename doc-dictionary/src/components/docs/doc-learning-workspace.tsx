"use client";

import { useState } from "react";

import { InteractiveDocReader } from "@/components/docs/interactive-doc-reader";
import { VocabularyForm } from "@/components/vocab/vocabulary-form";
import { VocabularyList } from "@/components/vocab/vocabulary-list";

type VocabularyItem = {
  id: string;
  word: string;
  meaning: string | null;
  note: string | null;
  status: string;
};

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
  const [selectedText, setSelectedText] = useState("");

  return (
    <main className="mx-auto grid max-w-7xl gap-8 px-4 py-8 lg:grid-cols-[1fr_360px]">
      <section className="min-w-0">
        <article className="rounded-xl border bg-white p-6 shadow-sm">
          <InteractiveDocReader
            htmlContent={htmlContent}
            onSelectText={setSelectedText}
          />
        </article>
      </section>

      <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
        <div>
          <h2 className="text-lg font-semibold">Vocabulary</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Select a word in the article or type manually.
          </p>
        </div>

        {selectedText && (
          <div className="rounded-xl border bg-blue-50 p-3 text-sm text-blue-700">
            Selected: <span className="font-semibold">{selectedText}</span>
          </div>
        )}

        <VocabularyForm docId={docId} selectedWord={selectedText} />

        <VocabularyList vocabularies={vocabularies} />
      </aside>
    </main>
  );
}