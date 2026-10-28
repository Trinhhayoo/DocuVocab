import { type BrowserContext, chromium, type Page, test as base, type Worker } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

import { E2E_USER, EXTENSION_DIR } from "./fixtures";
import { readLocalSupabase } from "./local-supabase";

export type ExtensionSession = Readonly<{ accessToken: string; refreshToken: string }>;

type ExtensionFixtures = {
  context: BrowserContext;
  serviceWorker: Worker;
  extensionId: string;
};

/** The part of the extension API these helpers call inside the service worker. */
declare const chrome: {
  storage: {
    local: {
      set(items: Record<string, string>): Promise<void>;
      get(keys: readonly string[]): Promise<Record<string, unknown>>;
    };
  };
};

// Same keys as apps/extension/src/background/token-store.ts.
const ACCESS_TOKEN_KEY = "supabaseAccessToken";
const REFRESH_TOKEN_KEY = "supabaseRefreshToken";

// Fixture callbacks name their setter `provide`: the React Hooks lint rule treats `use` as a hook.
/** Runs each test in a fresh Chromium profile with the e2e build of the extension loaded. */
export const test = base.extend<ExtensionFixtures>({
  context: async ({}, provide) => {
    const context = await chromium.launchPersistentContext("", {
      // Playwright's own Chromium; branded Chrome refuses --load-extension.
      channel: "chromium",
      args: [`--disable-extensions-except=${EXTENSION_DIR}`, `--load-extension=${EXTENSION_DIR}`],
    });
    await provide(context);
    await context.close();
  },
  page: async ({ context }, provide) => {
    await provide(await context.newPage());
  },
  serviceWorker: async ({ context }, provide) => {
    const [worker] = context.serviceWorkers();
    await provide(worker ?? (await context.waitForEvent("serviceworker")));
  },
  extensionId: async ({ serviceWorker }, provide) => {
    await provide(new URL(serviceWorker.url()).host);
  },
});

export { expect } from "@playwright/test";

/**
 * Signs the extension in the way the Google flow ends: a fresh Supabase session whose tokens land in
 * `storage.local`. Each call is its own session, so revoking one does not sign out other tests.
 */
export async function signInExtension(serviceWorker: Worker): Promise<ExtensionSession> {
  const local = readLocalSupabase();
  const supabase = createClient(local.apiUrl, local.anonKey, { auth: { persistSession: false } });
  const { data, error } = await supabase.auth.signInWithPassword(E2E_USER);
  if (error || !data.session) throw error ?? new Error("Could not sign in the e2e user.");

  const session = { accessToken: data.session.access_token, refreshToken: data.session.refresh_token };
  await serviceWorker.evaluate(
    ([keys, tokens]) =>
      chrome.storage.local.set({ [keys.access]: tokens.accessToken, [keys.refresh]: tokens.refreshToken }),
    [{ access: ACCESS_TOKEN_KEY, refresh: REFRESH_TOKEN_KEY }, session] as const,
  );
  return session;
}

export async function storedTokens(serviceWorker: Worker) {
  return serviceWorker.evaluate(
    (keys) => chrome.storage.local.get(keys),
    [ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY],
  );
}

/** True when Supabase still accepts the refresh token. */
export async function canRefresh(refreshToken: string) {
  const local = readLocalSupabase();
  const supabase = createClient(local.apiUrl, local.anonKey, { auth: { persistSession: false } });
  const { error } = await supabase.auth.refreshSession({ refresh_token: refreshToken });
  return !error;
}

/** Serves the seeded article at its saved source URL, so the extension loads that page's vocabulary. */
export async function serveArticle(context: BrowserContext, html: string, url: string) {
  await context.route(url, (route) =>
    route.fulfill({
      contentType: "text/html; charset=utf-8",
      body: `<!doctype html><html lang="en"><head><title>E2E article</title></head><body>${html}</body></html>`,
    }),
  );
}

/** Text of every range the content script registered with the CSS Custom Highlight API. */
export function highlightedTexts(page: Page) {
  return page.evaluate(() => [...(CSS.highlights.get("docuvocab-vocabulary") ?? [])].map((range) => range.toString()));
}
