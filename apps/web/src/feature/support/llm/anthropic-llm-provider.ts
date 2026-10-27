import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";

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

export const DEFAULT_ANTHROPIC_MODEL = "claude-haiku-5-5";

export default class AnthropicLLMProvider implements LLMProvider {
  private readonly client: Anthropic;

  constructor(
    apiKey: string,
    private readonly model: string = DEFAULT_ANTHROPIC_MODEL,
  ) {
    this.client = new Anthropic({ apiKey });
  }

  async explainVocabulary(
    request: ExplainVocabularyRequest,
  ): Promise<ExplainVocabularyResponse> {
    const response = await this.client.messages.parse({
      model: this.model,
      max_tokens: 4096,
      system: EXPLANATION_SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildExplanationUserPrompt(request) }],
      output_config: {
        effort: "low",
        format: zodOutputFormat(explanationOutputSchema),
      },
    });

    if (response.stop_reason === "refusal") {
      throw new Error("The model declined to explain this text.");
    }

    if (!response.parsed_output) {
      throw new Error(`The model returned no explanation (stop reason: ${response.stop_reason}).`);
    }

    return toExplainVocabularyResponse(response.parsed_output);
  }
}
