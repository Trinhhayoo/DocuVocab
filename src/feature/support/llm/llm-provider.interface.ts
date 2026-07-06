export type ExplainVocabularyRequest = {
  text: string;
  sentence?: string;
  paragraph?: string;
  sourceTitle?: string;
  sourceUrl?: string;
};

export type ExplainVocabularyResponse = {
  meaning: string;
  simpleExplanation: string;
  exampleSentence: string;
  domain: "tech" | "finance" | "legal" | "general";
};

export default interface LLMProvider {
  explainVocabulary(
    request: ExplainVocabularyRequest,
  ): Promise<ExplainVocabularyResponse>;
}
