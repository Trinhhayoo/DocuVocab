import { expect, test } from "@playwright/test";

import { SEEDED_DOC } from "./support/fixtures";
import {
  expectInsideViewport,
  expectNoHorizontalOverflow,
  openSeededDoc,
  savedHighlight,
} from "./support/page-helpers";

test("the home page fits a 375 px screen", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText(SEEDED_DOC.title)).toBeVisible();

  await expectNoHorizontalOverflow(page);
  await expectInsideViewport(page, page.getByRole("button", { name: "Import Doc" }));
});

test("the reader fits a 375 px screen and keeps the tooltip on screen", async ({ page }) => {
  await openSeededDoc(page);
  await expectNoHorizontalOverflow(page);

  await savedHighlight(page).click();

  const tooltip = page.getByRole("tooltip");
  await expect(tooltip).toContainText(SEEDED_DOC.savedMeaning);
  await expectInsideViewport(page, tooltip);
});
