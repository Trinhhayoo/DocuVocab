import { canRefresh, expect, signInExtension, storedTokens, test } from "../support/extension";

test("logging out revokes the session on the server and clears it locally", async ({
  page,
  serviceWorker,
  extensionId,
}) => {
  const session = await signInExtension(serviceWorker);

  await page.goto(`chrome-extension://${extensionId}/popup.html`);
  await expect(page.getByText("Connected to DocuVocab")).toBeVisible();

  await page.getByRole("button", { name: "Logout" }).click();

  await expect(page.getByText("You are logged out.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Login with Google" })).toBeVisible();
  expect(await storedTokens(serviceWorker)).toEqual({});
  expect(await canRefresh(session.refreshToken)).toBe(false);
});
