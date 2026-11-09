import type { NextResponse } from "next/server";

import {
  nextApiFailure,
  nextApiSuccess,
  nextApiValidationError,
} from "@/feature/common/data/http/next-api-response";
import { encryptSecret } from "@/feature/support/crypto/secret-box";
import { exchangeOpenRouterCode } from "@/feature/support/llm/openrouter-auth";

import type SettingsRepository from "../../domain/i-repo/settings.repository";
import { connectOpenRouterSchema } from "../../domain/params/settings.params";
import connectOpenRouterUsecase from "../../domain/usecase/connect-openrouter.usecase";
import disconnectOpenRouterUsecase from "../../domain/usecase/disconnect-openrouter.usecase";
import PrismaSettingsRepository from "../settings.repository";

const defaultSettingsRepo = new PrismaSettingsRepository();

/**
 * Shared body of the web and extension "Connect OpenRouter" routes; callers check auth first.
 * Trades the OAuth PKCE code for the user's own key and stores it encrypted.
 */
export async function handleConnectOpenRouter(
  request: Request,
  userId: string,
  repo: SettingsRepository = defaultSettingsRepo,
): Promise<NextResponse> {
  const parsed = connectOpenRouterSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return nextApiValidationError(parsed.error.flatten());
  }

  const result = await connectOpenRouterUsecase(
    { repo, exchangeCode: exchangeOpenRouterCode, encrypt: (plaintext) => encryptSecret(plaintext) },
    userId,
    parsed.data,
  );

  if (!result.success) {
    console.error("OpenRouter connect failed:", result.failure.message);
    return nextApiFailure(result.failure, 502);
  }

  return nextApiSuccess({ settings: result.data });
}

/** Shared body of the web and extension "Disconnect OpenRouter" routes; callers check auth first. */
export async function handleDisconnectOpenRouter(
  userId: string,
  repo: SettingsRepository = defaultSettingsRepo,
): Promise<NextResponse> {
  const result = await disconnectOpenRouterUsecase(repo, userId);

  if (!result.success) {
    return nextApiFailure(result.failure, 500);
  }

  return nextApiSuccess({ settings: result.data });
}
