import { browser } from "wxt/browser";

export type AuthTokens = Readonly<{ accessToken: string; refreshToken: string }>;

export type TokenStore = Readonly<{
  get(): Promise<AuthTokens | null>;
  set(tokens: AuthTokens): Promise<void>;
  clear(): Promise<void>;
}>;

export const ACCESS_TOKEN_KEY = "supabaseAccessToken";
const REFRESH_TOKEN_KEY = "supabaseRefreshToken";

/** Tokens live in `storage.local` so every extension context, and a browser restart, sees the same session. */
export const browserTokenStore: TokenStore = {
  async get() {
    const stored = await browser.storage.local.get([ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY]);
    const accessToken = stored[ACCESS_TOKEN_KEY];
    const refreshToken = stored[REFRESH_TOKEN_KEY];

    return typeof accessToken === "string" && typeof refreshToken === "string"
      ? { accessToken, refreshToken }
      : null;
  },
  async set({ accessToken, refreshToken }) {
    await browser.storage.local.set({ [ACCESS_TOKEN_KEY]: accessToken, [REFRESH_TOKEN_KEY]: refreshToken });
  },
  async clear() {
    await browser.storage.local.remove([ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY]);
  },
};
