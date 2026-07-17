import type { Result } from "@/feature/common/data/result";

import type { Settings } from "../entity/settings.entity";
import type SettingsRepository from "../i-repo/settings.repository";

export default async function getSettingsUsecase(
  repo: SettingsRepository,
  userId: string,
): Promise<Result<Settings>> {
  return repo.get(userId);
}
