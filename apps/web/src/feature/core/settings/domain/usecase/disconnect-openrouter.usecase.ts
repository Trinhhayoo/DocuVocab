import type { Result } from "@/feature/common/data/result";

import type { Settings } from "../entity/settings.entity";
import type SettingsRepository from "../i-repo/settings.repository";

/**
 * Forgets the user's OpenRouter key. The key stays valid at OpenRouter until the user deletes it
 * there, at openrouter.ai/settings/keys.
 */
export default async function disconnectOpenRouterUsecase(
  repo: SettingsRepository,
  userId: string,
): Promise<Result<Settings>> {
  return repo.setEncryptedOpenRouterKey(userId, null);
}
