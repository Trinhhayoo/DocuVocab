type VocabularyItem = {
  id: string;
  word: string;
  meaning: string | null;
  note: string | null;
  status: string;
};

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
        <div
          key={vocab.id}
          className="rounded-xl border bg-white p-4 shadow-sm"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-semibold">{vocab.word}</h3>
              {vocab.meaning && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {vocab.meaning}
                </p>
              )}
            </div>

            <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">
              {vocab.status}
            </span>
          </div>

          {vocab.note && (
            <p className="mt-3 text-sm text-slate-600">{vocab.note}</p>
          )}
        </div>
      ))}
    </div>
  );
}