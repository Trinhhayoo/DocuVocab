import { buildOpenRouterAuthUrl, createOpenRouterPkce } from "@docuvocab/shared";

import { safeNextPath } from "./safe-next-path";

export const OPENROUTER_CALLBACK_PATH = "/settings/openrouter/callback";

const STORAGE_KEY = "docuvocab.openrouterConnect";

/** Opens the settings modal when the app loads with this query parameter. */
export const OPEN_SETTINGS_PARAM = "settings";

type PendingConnect = Readonly<{ codeVerifier: string; state: string; returnTo: string }>;

/** Builds OpenRouter's consent URL and remembers the verifier for the callback page. */
export async function buildOpenRouterConnectUrl(
  origin: string,
  returnTo: string,
  storage: Storage = sessionStorage,
): Promise<string> {
  const pkce = await createOpenRouterPkce();
  const pending: PendingConnect = {
    codeVerifier: pkce.codeVerifier,
    state: pkce.state,
    returnTo: safeNextPath(returnTo),
  };
  storage.setItem(STORAGE_KEY, JSON.stringify(pending));

  return buildOpenRouterAuthUrl(new URL(OPENROUTER_CALLBACK_PATH, origin).href, pkce);
}

/** Returns the saved verifier when `state` matches, and forgets it so a code is used once. */
export function takePendingConnect(
  state: string | null,
  storage: Storage = sessionStorage,
): PendingConnect | null {
  const raw = storage.getItem(STORAGE_KEY);
  storage.removeItem(STORAGE_KEY);

  if (!raw || !state) return null;

  try {
    const pending = JSON.parse(raw) as PendingConnect;
    return pending.state === state ? pending : null;
  } catch {
    return null;
  }
}

/** The page to go back to, with the settings modal open. */
export function settingsReturnPath(returnTo: string): string {
  const url = new URL(safeNextPath(returnTo), "http://app.invalid");
  url.searchParams.set(OPEN_SETTINGS_PARAM, "open");
  return `${url.pathname}${url.search}${url.hash}`;
}
