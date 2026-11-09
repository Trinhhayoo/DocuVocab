import { failure, success, type Result } from "@/feature/common/data/result";
import ServerFailure from "@/feature/common/failures/server.failure";

import { DEFAULT_SETTINGS, type Settings } from "../domain/entity/settings.entity";
import type SettingsRepository from "../domain/i-repo/settings.repository";
import type { UpdateSettings } from "../domain/params/settings.params";
import {
	getSettingsByUserIdQuery,
	upsertSettingsByUserIdQuery,
} from "./queries/settings.query";

function toSettingsEntity(record: {
	allowGlobalVocabulary: boolean;
	aiModel: string | null;
	openRouterKeyEncrypted: string | null;
}): Settings {
	return {
		allowGlobalVocabulary: record.allowGlobalVocabulary,
		aiModel: record.aiModel,
		openRouterConnected: record.openRouterKeyEncrypted !== null,
	};
}

export default class PrismaSettingsRepository implements SettingsRepository {
	async get(userId: string): Promise<Result<Settings>> {
		try {
			const record = await getSettingsByUserIdQuery(userId);
			return success(record ? toSettingsEntity(record) : DEFAULT_SETTINGS);
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

	async getEncryptedOpenRouterKey(userId: string): Promise<Result<string | null>> {
		try {
			const record = await getSettingsByUserIdQuery(userId);
			return success(record?.openRouterKeyEncrypted ?? null);
		} catch (error) {
			return failure(new ServerFailure({ error }));
		}
	}

	async setEncryptedOpenRouterKey(
		userId: string,
		encryptedKey: string | null,
	): Promise<Result<Settings>> {
		try {
			const record = await upsertSettingsByUserIdQuery(userId, {
				openRouterKeyEncrypted: encryptedKey,
			});
			return success(toSettingsEntity(record));
		} catch (error) {
			return failure(new ServerFailure({ error }));
		}
	}
}
