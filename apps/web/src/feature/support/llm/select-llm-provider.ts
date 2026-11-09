import { resolveAiModelId } from "@docuvocab/shared";

import { decryptSecret } from "@/feature/support/crypto/secret-box";

import createLlmProvider from "./create-llm-provider";
import type LLMProvider from "./llm-provider.interface";
import OpenRouterLLMProvider from "./openrouter-llm-provider";

type UserAiSettings = Readonly<{
  aiModel: string | null;
  /** The user's encrypted OpenRouter key, or null when they have not connected one. */
  encryptedOpenRouterKey: string | null;
}>;

type SelectDeps = Readonly<{
  env?: Readonly<Record<string, string | undefined>>;
  decrypt?: (encrypted: string) => string;
}>;

/**
 * Users who connected OpenRouter pay for their own calls with any model in the list; everyone else
 * gets the app's provider, which serves only the default model. Throws when the app's provider is
 * not configured.
 */
export default function selectLlmProvider(
  settings: UserAiSettings,
  { env = process.env, decrypt = decryptSecret }: SelectDeps = {},
): LLMProvider {
  if (settings.encryptedOpenRouterKey) {
    try {
      return new OpenRouterLLMProvider(
        decrypt(settings.encryptedOpenRouterKey),
        resolveAiModelId(settings.aiModel, true),
      );
    } catch (error) {
      // A rotated AI_KEY_ENCRYPTION_SECRET makes stored keys unreadable; the user must reconnect.
      console.error("Cannot decrypt the user's OpenRouter key; using the app provider.", error);
    }
  }

  return createLlmProvider(env, resolveAiModelId(settings.aiModel, false));
}
