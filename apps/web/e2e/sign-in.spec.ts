import { type BrowserContext, expect, type Page, test } from "@playwright/test";

import { RETURN_PATH_COOKIE } from "../src/lib/sign-in-return-path";
import { E2E_BASE_URL } from "./support/fixtures";

// Signed out, and the app under test runs without NEXT_PUBLIC_APP_URL (e2e/support/local-supabase.ts).
test.use({ storageState: { cookies: [], origins: [] } });

/** Clicks a sign-in control and returns the callback URL that Supabase is asked to redirect to. */
async function oauthCallbackAfter(page: Page, click: () => Promise<void>) {
  // Google is not configured in local Supabase, so the flow stops at its authorize endpoint.
  const authorize = page.waitForRequest((request) => request.url().includes("/auth/v1/authorize"));
  await click();

  return new URL((await authorize).url()).searchParams.get("redirect_to");
}

async function savedReturnPath(context: BrowserContext) {
  const cookies = await context.cookies(`${E2E_BASE_URL}/auth/web/callback`);
  return cookies.find(({ name }) => name === RETURN_PATH_COOKIE)?.value;
}

// Supabase falls back to its Site URL when the callback does not exactly match its allow list,
// query string included, so the callback must be the same URL for every sign-in.
const EXACT_CALLBACK = `${E2E_BASE_URL}/auth/web/callback`;

test("the header Login button signs in and returns to the current page", async ({ page, context }) => {
  await page.goto("/privacy");

  const callback = await oauthCallbackAfter(page, () => page.getByRole("button", { name: "Login" }).click());

  expect(callback).toBe(EXACT_CALLBACK);
  expect(await savedReturnPath(context)).toBe(encodeURIComponent("/privacy"));
});

test("the login page uses the same sign-in route", async ({ page, context }) => {
  await page.goto("/login");

  const callback = await oauthCallbackAfter(page, () =>
    page.getByRole("button", { name: "Continue with Google" }).click(),
  );

  expect(callback).toBe(EXACT_CALLBACK);
  expect(await savedReturnPath(context)).toBe(encodeURIComponent("/"));
});
