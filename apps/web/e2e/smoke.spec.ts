import { expect, test } from "@playwright/test";

import { readSeededIds, SEEDED_DOC } from "./support/fixtures";

test("a signed-in user sees their documents", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("button", { name: "Logout" })).toBeVisible();
  await expect(page.getByText(SEEDED_DOC.title)).toBeVisible();
});

test("the reader highlights saved vocabulary and shows its meaning", async ({ page }) => {
  await page.goto(`/docs/${readSeededIds().docId}`);

  const highlight = page.locator("mark.vocab-highlight", { hasText: SEEDED_DOC.savedWord }).first();
  await expect(highlight).toBeVisible();

  await highlight.hover();
  const tooltip = page.getByRole("tooltip");
  await expect(tooltip).toContainText(SEEDED_DOC.savedMeaning);
  await expect(tooltip).toContainText(SEEDED_DOC.savedMeaningEn);
});
