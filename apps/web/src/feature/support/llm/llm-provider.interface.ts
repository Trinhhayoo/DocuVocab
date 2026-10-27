export type ExplainVocabularyRequest = {
  text: string;
  sentence?: string;
  paragraph?: string;
  sourceTitle?: string;
  sourceUrl?: string;
};

export type VocabularyDomain = "tech" | "finance" | "legal" | "general";

/** `meaning` and `simpleExplanation` are Vietnamese; the `*En` fields are English. */
export type ExplainVocabularyResponse = {
  meaning: string;
  simpleExplanation: string;
  meaningEn: string;
  simpleExplanationEn: string;
  exampleSentence: string;
  domain: VocabularyDomain;
};

export default interface LLMProvider {
  explainVocabulary(
    request: ExplainVocabularyRequest,
  ): Promise<ExplainVocabularyResponse>;
}
