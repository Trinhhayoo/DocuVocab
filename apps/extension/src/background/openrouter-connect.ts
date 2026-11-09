import { buildOpenRouterAuthUrl, createOpenRouterPkce } from "@docuvocab/shared";
import { browser } from "wxt/browser";

import { type ApiResult, fail } from "@/lib/api-result";
import type { Settings } from "@/lib/vocabulary";

import type { ApiClient } from "./api-client";

type Identity = Pick<typeof browser.identity, "getRedirectURL" | "launchWebAuthFlow">;

type SettingsData = { settings: Settings };

const CONNECT_PATH = "/api/extension/settings/openrouter";

/** Returns the OAuth code when the callback carries the `state` this flow sent, otherwise null. */
export function parseOpenRouterCallback(callbackUrl: string, expectedState: string): string | null {
  let url: URL;
  try {
    url = new URL(callbackUrl);
  } catch {
    return null;
  }

  const code = url.searchParams.get("code");
  return code && url.searchParams.get("state") === expectedState ? code : null;
}

/**
 * Runs OpenRouter's OAuth PKCE flow in a browser auth window. The browser intercepts the redirect to
 * `identity.getRedirectURL()`, so the code reaches only this extension. The verifier lives only in this
 * function's memory and goes to the DocuVocab server, which trades it with the code for the user's key.
 */
export async function connectOpenRouter(
  api: ApiClient,
  identity: Identity = browser.identity,
): Promise<ApiResult<SettingsData>> {
  const pkce = await createOpenRouterPkce();
  const authUrl = buildOpenRouterAuthUrl(identity.getRedirectURL("openrouter"), pkce);

  let callbackUrl: string | undefined;
  try {
    callbackUrl = await identity.launchWebAuthFlow({ url: authUrl, interactive: true });
  } catch (error) {
    return fail(400, error instanceof Error ? error.message : "OpenRouter connection was cancelled.");
  }

  const code = callbackUrl ? parseOpenRouterCallback(callbackUrl, pkce.state) : null;
  if (!code) return fail(400, "OpenRouter did not return a valid code. Please try again.");

  return api.request<SettingsData>(
    CONNECT_PATH,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, codeVerifier: pkce.codeVerifier }),
    },
    "Cannot connect your OpenRouter account.",
  );
}

/** Forgets the user's OpenRouter key on the server; it stays valid at OpenRouter until revoked there. */
export function disconnectOpenRouter(api: ApiClient): Promise<ApiResult<SettingsData>> {
  return api.request<SettingsData>(CONNECT_PATH, { method: "DELETE" }, "Cannot disconnect OpenRouter.");
}
