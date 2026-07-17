import type { Result } from "@/feature/common/data/result";

import type { Settings } from "../entity/settings.entity";
import type { UpdateSettings } from "../params/settings.params";

export default interface SettingsRepository {
  get(userId: string): Promise<Result<Settings>>;
  update(userId: string, input: UpdateSettings): Promise<Result<Settings>>;
}

export const settingsRepoKey = "settingsRepoKey";