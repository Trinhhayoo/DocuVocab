import { failure, type Result } from "@/feature/common/data/result";
import BaseFailure from "@/feature/common/failures/base.failure";

import type { Settings } from "../entity/settings.entity";
import type SettingsRepository from "../i-repo/settings.repository";
import type { ConnectOpenRouterInput } from "../params/settings.params";

export class ConnectOpenRouterFailure extends BaseFailure<{ error: unknown }> {
  constructor(metadata?: { error: unknown }) {
    super("Cannot connect your OpenRouter account. Please try again.", metadata);
  }
}

type ConnectOpenRouterDeps = Readonly<{
  repo: SettingsRepository;
  exchangeCode: (code: string, codeVerifier: string) => Promise<string>;
  encrypt: (plaintext: string) => string;
}>;

/** Exchanges the OAuth code for the user's own key and stores it encrypted. */
export default async function connectOpenRouterUsecase(
  { repo, exchangeCode, encrypt }: ConnectOpenRouterDeps,
  userId: string,
  input: ConnectOpenRouterInput,
): Promise<Result<Settings>> {
  let encryptedKey: string;

  try {
    encryptedKey = encrypt(await exchangeCode(input.code, input.codeVerifier));
  } catch (error) {
    return failure(new ConnectOpenRouterFailure({ error }));
  }

  return repo.setEncryptedOpenRouterKey(userId, encryptedKey);
}
