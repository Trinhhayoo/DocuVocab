import { expect, type Page, test } from "@playwright/test";

import { E2E_BASE_URL } from "./support/fixtures";

// Signed out, and the app under test runs without NEXT_PUBLIC_APP_URL (e2e/support/local-supabase.ts).
test.use({ storageState: { cookies: [], origins: [] } });

/** Clicks a sign-in control and returns the callback URL that Supabase is asked to redirect to. */
async function oauthCallbackAfter(page: Page, click: () => Promise<void>) {
  // Google is not configured in local Supabase, so the flow stops at its authorize endpoint.
  const authorize = page.waitForRequest((request) => request.url().includes("/auth/v1/authorize"));
  await click();

  const redirectTo = new URL((await authorize).url()).searchParams.get("redirect_to");
  expect(redirectTo).not.toBeNull();
  return new URL(redirectTo ?? "");
}

test("the header Login button signs in and returns to the current page", async ({ page }) => {
  await page.goto("/privacy");

  const callback = await oauthCallbackAfter(page, () => page.getByRole("button", { name: "Login" }).click());

  expect(callback.origin).toBe(E2E_BASE_URL);
  expect(callback.pathname).toBe("/auth/web/callback");
  expect(callback.searchParams.get("next")).toBe("/privacy");
});

test("the login page uses the same sign-in route", async ({ page }) => {
  await page.goto("/login");

  const callback = await oauthCallbackAfter(page, () =>
    page.getByRole("button", { name: "Continue with Google" }).click(),
  );

  expect(callback.origin).toBe(E2E_BASE_URL);
  expect(callback.pathname).toBe("/auth/web/callback");
  expect(callback.searchParams.get("next")).toBe("/");
});
