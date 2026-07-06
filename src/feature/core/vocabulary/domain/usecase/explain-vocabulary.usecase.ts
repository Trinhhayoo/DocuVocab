import { Result, success, failure } from "@/feature/common/data/result";
import type LLMProvider from "@/feature/support/llm/llm-provider.interface";
import type { ExplainVocabularyResponse } from "@/feature/support/llm/llm-provider.interface";
import type { ExplainVocabularyInput } from "../params/explain-vocabulary.param";
import ExplainVocabularyFailure from "../failure/explain-vocabulary.failure";

export default async function explainVocabularyUsecase(
  llmProvider: LLMProvider,
  input: ExplainVocabularyInput,
): Promise<Result<ExplainVocabularyResponse>> {
  try {
    const explanation = await llmProvider.explainVocabulary({
      text: input.text,
      sentence: input.sentence,
      paragraph: input.paragraph,
      sourceTitle: input.sourceTitle,
      sourceUrl: input.sourceUrl,
      meaningLanguage: input.meaningLanguage,
    });

    return success(explanation);
  } catch (error) {
    return failure(new ExplainVocabularyFailure({ error }));
  }
}
