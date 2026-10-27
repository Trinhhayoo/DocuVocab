import { browser } from "wxt/browser";

import { type ApiResult, fail, ok } from "@/lib/api-result";

import type { AuthTokens, TokenStore } from "./token-store";

/** Reads the tokens the web app appends to the identity redirect URL. */
export function parseAuthCallback(callbackUrl: string): AuthTokens | null {
  let url: URL;
  try {
    url = new URL(callbackUrl);
  } catch {
    return null;
  }

  const accessToken = url.searchParams.get("access_token");
  const refreshToken = url.searchParams.get("refresh_token");

  return accessToken && refreshToken ? { accessToken, refreshToken } : null;
}

/**
 * Signs in with Google through the web app. The browser intercepts the final redirect to
 * `identity.getRedirectURL()`, so the tokens reach only this extension.
 */
export async function loginWithGoogle(origin: string, tokens: TokenStore, returnTo: string): Promise<ApiResult<null>> {
  const loginUrl = new URL("/auth/extension/login", origin);
  loginUrl.searchParams.set("next", returnTo);
  loginUrl.searchParams.set("redirect_uri", browser.identity.getRedirectURL());

  let callbackUrl: string | undefined;
  try {
    callbackUrl = await browser.identity.launchWebAuthFlow({ url: loginUrl.href, interactive: true });
  } catch (error) {
    return fail(401, error instanceof Error ? error.message : "Sign-in was cancelled.");
  }

  const session = callbackUrl ? parseAuthCallback(callbackUrl) : null;
  if (!session) return fail(401, "Sign-in failed. Please try again.");

  await tokens.set(session);
  return ok(null);
}
