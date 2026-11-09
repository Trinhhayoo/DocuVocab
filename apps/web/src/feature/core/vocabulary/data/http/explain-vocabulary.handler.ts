import { NextResponse } from "next/server";

import type IBaseHttpResponse from "@/feature/common/data/http/i-base-http-response";
import {
  nextApiFailure,
  nextApiSuccess,
  nextApiValidationError,
} from "@/feature/common/data/http/next-api-response";
import PrismaSettingsRepository from "@/feature/core/settings/data/settings.repository";
import type SettingsRepository from "@/feature/core/settings/domain/i-repo/settings.repository";
import type LLMProvider from "@/feature/support/llm/llm-provider.interface";
import { OpenRouterRequestError } from "@/feature/support/llm/openrouter-llm-provider";
import selectLlmProvider from "@/feature/support/llm/select-llm-provider";
import { explainVocabularySchema } from "../../domain/params/explain-vocabulary.param";
import explainVocabularyUsecase from "../../domain/usecase/explain-vocabulary.usecase";

const defaultSettingsRepo = new PrismaSettingsRepository();

/** Reads the user's model choice and own key; a lookup failure falls back to the app's default. */
async function loadUserAiSettings(repo: SettingsRepository, userId: string) {
  const [settings, encryptedKey] = await Promise.all([
    repo.get(userId),
    repo.getEncryptedOpenRouterKey(userId),
  ]);

  return {
    aiModel: settings.success ? settings.data.aiModel : null,
    encryptedOpenRouterKey: encryptedKey.success ? encryptedKey.data : null,
  };
}

/** User-facing messages for OpenRouter errors the user can act on; others stay a generic 500. */
const OPENROUTER_ERROR_MESSAGES: Readonly<Record<number, string>> = {
  402: "Your OpenRouter account has no credit for this model. Pick a free model in Settings or add credit on openrouter.ai.",
  429: "The free AI model is busy or today's free limit is used up. Try again later or pick another model in Settings.",
};

/** Shared body of the web and extension explain routes; callers check auth first. */
export async function handleExplainVocabulary(
  request: Request,
  userId: string,
  settingsRepo: SettingsRepository = defaultSettingsRepo,
): Promise<NextResponse> {
  const body = await request.json().catch(() => null);
  const parsed = explainVocabularySchema.safeParse(body);

  if (!parsed.success) {
    return nextApiValidationError(parsed.error.flatten());
  }

  let llmProvider: LLMProvider;

  try {
    llmProvider = selectLlmProvider(await loadUserAiSettings(settingsRepo, userId));
  } catch (error) {
    console.error("LLM provider is not configured:", error);

    const responseBody: IBaseHttpResponse = {
      success: false,
      status: "500",
      message: "AI explanations are not configured.",
    };

    return NextResponse.json(responseBody, { status: 500 });
  }

  const result = await explainVocabularyUsecase(llmProvider, parsed.data);

  if (!result.success) {
    console.error("Explain failed:", result.failure);

    const cause = result.failure.metadata;
    const error = typeof cause === "object" && cause !== null && "error" in cause ? cause.error : null;

    if (error instanceof OpenRouterRequestError && OPENROUTER_ERROR_MESSAGES[error.status]) {
      return nextApiFailure(result.failure, error.status, OPENROUTER_ERROR_MESSAGES[error.status]);
    }

    return nextApiFailure(result.failure, 500);
  }

  return nextApiSuccess(result.data);
}
