import type { Result } from "@/feature/common/data/result";
import type { Settings } from "../entity/settings.entity";
import type SettingsRepository from "../i-repo/settings.repository";
import type { UpdateSettings } from "../params/settings.params";

export default async function updateSettingsUsecase(
  repo: SettingsRepository,
  userId: string,
  input: UpdateSettings,
): Promise<Result<Settings>> {
  return repo.update(userId, input);
}