import { Ollama } from "ollama";
import { z } from "zod";

import type LLMProvider from "./llm-provider.interface";
import type {
  ExplainVocabularyRequest,
  ExplainVocabularyResponse,
} from "./llm-provider.interface";
import {
  buildExplanationUserPrompt,
  EXPLANATION_SYSTEM_PROMPT,
  explanationOutputSchema,
  toExplainVocabularyResponse,
} from "./explanation-prompt";

export const DEFAULT_OLLAMA_MODEL = "gpt-oss:120b";

const explanationJsonSchema = z.toJSONSchema(explanationOutputSchema);

export default class OllamaLLMProvider implements LLMProvider {
  private readonly ollama: Ollama;

  constructor(
    apiKey: string,
    private readonly model: string = DEFAULT_OLLAMA_MODEL,
  ) {
    this.ollama = new Ollama({
      host: "https://ollama.com",
      headers: { Authorization: `Bearer ${apiKey}` },
    });
  }

  async explainVocabulary(
    request: ExplainVocabularyRequest,
  ): Promise<ExplainVocabularyResponse> {
    const response = await this.ollama.generate({
      model: this.model,
      system: EXPLANATION_SYSTEM_PROMPT,
      prompt: buildExplanationUserPrompt(request),
      stream: false,
      format: explanationJsonSchema,
      options: { temperature: 0.3 },
    });

    return toExplainVocabularyResponse(
      explanationOutputSchema.parse(JSON.parse(response.response)),
    );
  }
}
