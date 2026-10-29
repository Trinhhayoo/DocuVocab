import { expect, test } from "@playwright/test";

import { CHROME_EXTENSION_ID, EXTENSION_REDIRECT_COOKIE } from "../src/lib/extension-redirect";
import { E2E_BASE_URL } from "./support/fixtures";

test.use({ storageState: { cookies: [], origins: [] } });

const REDIRECT_URI = `https://${CHROME_EXTENSION_ID}.chromiumapp.org/`;

// Supabase falls back to its Site URL when the callback does not exactly match its allow list,
// query string included, so the extension callback must be one fixed URL.
test("extension sign-in sends Supabase one exact callback and keeps the redirect in a cookie", async ({
  request,
}) => {
  const response = await request.get(`/auth/extension/login?redirect_uri=${encodeURIComponent(REDIRECT_URI)}`, {
    maxRedirects: 0,
  });

  expect(response.status()).toBe(307);
  const authorize = new URL(response.headers().location ?? "");
  expect(authorize.pathname).toBe("/auth/v1/authorize");
  expect(authorize.searchParams.get("redirect_to")).toBe(`${E2E_BASE_URL}/auth/extension/callback`);

  const setCookie = response.headersArray().filter(({ name }) => name.toLowerCase() === "set-cookie");
  const redirectCookie = setCookie.find(({ value }) => value.startsWith(`${EXTENSION_REDIRECT_COOKIE}=`));
  expect(redirectCookie?.value).toContain(encodeURIComponent(REDIRECT_URI));
  expect(redirectCookie?.value).toMatch(/Path=\/auth\/extension\/callback/i);
  expect(redirectCookie?.value).toMatch(/HttpOnly/i);
});

test("the extension callback refuses to finish without the cookie from sign-in", async ({ request }) => {
  const response = await request.get(
    `/auth/extension/callback?code=forged&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`,
    { maxRedirects: 0 },
  );

  expect(response.status()).toBe(307);
  expect(response.headers().location).toBe(`${E2E_BASE_URL}/`);
});
