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

/** Editable fields of a saved vocabulary; `null` clears a field. */
export type UpdateVocabularyInput = Readonly<{
  meaning: string | null;
  meaningEn: string | null;
  note: string | null;
  noteEn: string | null;
  exampleSentence: string | null;
}>;

export type Settings = Readonly<{
  allowGlobalVocabulary: boolean;
  /** OpenRouter model slug from @docuvocab/shared AI_MODELS; null means the default. */
  aiModel: string | null;
  /** Whether the user connected their own OpenRouter account on the web app. */
  openRouterConnected: boolean;
}>;

/** Each field is optional: the server changes only the ones sent. */
export type UpdateSettingsInput = Partial<Pick<Settings, "allowGlobalVocabulary" | "aiModel">>;
