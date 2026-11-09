import type { Result } from "@/feature/common/data/result";

import type { Settings } from "../entity/settings.entity";
import type { UpdateSettings } from "../params/settings.params";

export default interface SettingsRepository {
  get(userId: string): Promise<Result<Settings>>;
  update(userId: string, input: UpdateSettings): Promise<Result<Settings>>;
  /** The encrypted OpenRouter key, or null when the user has not connected one. */
  getEncryptedOpenRouterKey(userId: string): Promise<Result<string | null>>;
  /** Saves an encrypted key, or clears it with null. */
  setEncryptedOpenRouterKey(userId: string, encryptedKey: string | null): Promise<Result<Settings>>;
}

export const settingsRepoKey = "settingsRepoKey";
