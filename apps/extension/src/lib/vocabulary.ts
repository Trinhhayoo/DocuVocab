/** Vocabulary as returned by `/api/extension/vocabularies`; `meaning` and `note` are Vietnamese. */
export type Vocabulary = Readonly<{
  id: string;
  word: string;
  meaning: string | null;
  meaningEn: string | null;
  note: string | null;
  noteEn: string | null;
  exampleSentence: string | null;
}>;

export type Explanation = Readonly<{
  meaning: string;
  meaningEn: string;
  simpleExplanation: string;
  simpleExplanationEn: string;
  exampleSentence: string;
}>;

export type ExplainVocabularyInput = Readonly<{
  text: string;
  sentence?: string;
  sourceTitle?: string;
  sourceUrl?: string;
}>;

export type SaveVocabularyInput = Readonly<{
  word: string;
  meaning?: string;
  meaningEn?: string;
  note?: string;
  noteEn?: string;
  originalSentence?: string;
  exampleSentence?: string;
  sourceUrl: string;
  sourceHostname: string;
  pageTitle?: string;
}>;

export type Settings = Readonly<{ allowGlobalVocabulary: boolean }>;
