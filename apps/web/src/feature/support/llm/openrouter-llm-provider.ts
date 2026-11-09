import { DEFAULT_AI_MODEL_ID } from "@docuvocab/shared";
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
import { parseExplanationJson } from "./ollama-llm-provider";

export const OPENROUTER_API_URL = "https://openrouter.ai/api/v1";

const explanationJsonSchema = z.toJSONSchema(explanationOutputSchema);

const completionSchema = z.object({
  choices: z
    .array(z.object({ message: z.object({ content: z.string().nullable() }) }))
    .min(1),
});

/** A non-2xx reply from OpenRouter; `status` tells callers whether it is credit (402) or rate (429). */
export class OpenRouterRequestError extends Error {
  constructor(
    readonly status: number,
    detail: string,
  ) {
    super(`OpenRouter request failed (${status}): ${detail}`);
    this.name = "OpenRouterRequestError";
  }
}

/** Pulls OpenRouter's `{ error: { message } }` out of a failed response, if present. */
async function readErrorMessage(response: Response): Promise<string> {
  const body: unknown = await response.json().catch(() => null);
  const parsed = z.object({ error: z.object({ message: z.string() }) }).safeParse(body);

  return parsed.success ? parsed.data.error.message : response.statusText;
}

export default class OpenRouterLLMProvider implements LLMProvider {
  constructor(
    private readonly apiKey: string,
    private readonly model: string = DEFAULT_AI_MODEL_ID,
    private readonly fetchFn: typeof fetch = fetch,
  ) {}

  async explainVocabulary(
    request: ExplainVocabularyRequest,
  ): Promise<ExplainVocabularyResponse> {
    const response = await this.fetchFn(`${OPENROUTER_API_URL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        "X-Title": "DocuVocab",
      },
      body: JSON.stringify({
        model: this.model,
        temperature: 0.3,
        messages: [
          { role: "system", content: EXPLANATION_SYSTEM_PROMPT },
          { role: "user", content: buildExplanationUserPrompt(request) },
        ],
        response_format: {
          type: "json_schema",
          json_schema: { name: "explanation", strict: true, schema: explanationJsonSchema },
        },
        // Route only to providers that honour `response_format`.
        provider: { require_parameters: true },
      }),
    });

    if (!response.ok) {
      throw new OpenRouterRequestError(response.status, await readErrorMessage(response));
    }

    const completion = completionSchema.parse(await response.json());
    const content = completion.choices[0].message.content;

    if (!content) {
      throw new Error("The model returned no explanation.");
    }

    return toExplainVocabularyResponse(parseExplanationJson(content));
  }
}
