import type { VocabularyItem } from "@/features/vocab/types";
import { VocabularyCard } from "@/components/vocab/vocabulary-card";

type VocabularyListProps = {
  vocabularies: VocabularyItem[];
};

export function VocabularyList({ vocabularies }: VocabularyListProps) {
  if (vocabularies.length === 0) {
    return (
      <div className="rounded-xl border border-dashed bg-white p-4 text-sm text-muted-foreground">
        No vocabulary saved yet.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {vocabularies.map((vocab) => (
        <VocabularyCard key={vocab.id} vocabulary={vocab} />
      ))}
    </div>
  );
}