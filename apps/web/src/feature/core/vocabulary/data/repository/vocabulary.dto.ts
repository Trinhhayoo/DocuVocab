export type VocabularyDto = {
  id: string;
  userId?: string;
  docId: string | null;

  sourceUrl: string | null;
  sourceHostname: string | null;
  pageTitle: string | null;

  word: string;
  meaning: string | null;
  note: string | null;
  originalSentence: string | null;
  exampleSentence: string | null;
  status: string;

  createdAt: string;
  updatedAt: string;
};

export type CreateVocabularyDto = {
  userId?: string;
  docId?: string | null;

  sourceUrl?: string | null;
  sourceHostname?: string | null;
  pageTitle?: string | null;

  word: string;
  meaning?: string | null;
  note?: string | null;
  originalSentence?: string | null;
  exampleSentence?: string | null;
};

export type CreateExtensionVocabularyDto = {
  sourceUrl: string;
  pageTitle?: string | null;

  word: string;
  meaning?: string | null;
  note?: string | null;
  originalSentence?: string | null;
  exampleSentence?: string | null;
};