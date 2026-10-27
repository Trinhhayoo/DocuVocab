import { failure, success, type Result } from "@/feature/common/data/result";
import ServerFailure from "@/feature/common/failures/server.failure";

import type { Settings } from "../domain/entity/settings.entity";
import type SettingsRepository from "../domain/i-repo/settings.repository";
import type { UpdateSettings } from "../domain/params/settings.params";
import {
	getSettingsByUserIdQuery,
	upsertSettingsByUserIdQuery,
} from "./queries/settings.query";

function toSettingsEntity(record: {
	allowGlobalVocabulary: boolean;
}): Settings {
	return {
		allowGlobalVocabulary: record.allowGlobalVocabulary,
	};
}

export default class PrismaSettingsRepository implements SettingsRepository {
	async get(userId: string): Promise<Result<Settings>> {
		try {
			const record = await getSettingsByUserIdQuery(userId);

			if (!record) {
				return success({
					allowGlobalVocabulary: false,
				});
			}

			return success(toSettingsEntity(record));
		} catch (error) {
			return failure(new ServerFailure({ error }));
		}
	}

	async update(
		userId: string,
		input: UpdateSettings,
	): Promise<Result<Settings>> {
		try {
			const record = await upsertSettingsByUserIdQuery(userId, input);
			return success(toSettingsEntity(record));
		} catch (error) {
			return failure(new ServerFailure({ error }));
		}
	}
}