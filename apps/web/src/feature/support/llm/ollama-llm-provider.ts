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
  type ExplanationOutput,
  toExplainVocabularyResponse,
} from "./explanation-prompt";

export const DEFAULT_OLLAMA_MODEL = "gpt-oss:120b";

const explanationJsonSchema = z.toJSONSchema(explanationOutputSchema);

// gpt-oss on Ollama Cloud does not enforce `format`, so the prompt has to ask for JSON as well.
const JSON_ONLY_INSTRUCTION = `Respond with only a JSON object, no markdown, using exactly these keys: ${Object.keys(
  explanationOutputSchema.shape,
).join(", ")}.`;

/** Extracts the JSON object from a model reply, tolerating code fences or surrounding prose. */
export function parseExplanationJson(text: string): ExplanationOutput {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");

  if (start === -1 || end <= start) {
    throw new Error("The model did not return a JSON object.");
  }

  return explanationOutputSchema.parse(JSON.parse(text.slice(start, end + 1)));
}

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
      system: `${EXPLANATION_SYSTEM_PROMPT}\n\n${JSON_ONLY_INSTRUCTION}`,
      prompt: buildExplanationUserPrompt(request),
      stream: false,
      format: explanationJsonSchema,
      options: { temperature: 0.3 },
    });

    return toExplainVocabularyResponse(parseExplanationJson(response.response));
  }
}
