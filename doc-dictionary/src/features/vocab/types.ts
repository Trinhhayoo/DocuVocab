export type VocabularyStatus = "new" | "learning" | "reviewing" | "mastered";

export type VocabularyItem = {
  id: string;
  word: string;
  meaning: string | null;
  note: string | null;
  originalSentence: string | null;
  exampleSentence: string | null;
  status: string;
};

export type SelectedVocabularyDraft = {
  word: string;
  existingVocabulary: VocabularyItem | null;
};