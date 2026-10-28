import { expect, test } from "@playwright/test";

import { SEEDED_DOC } from "./support/fixtures";
import { luminanceOf, openSeededDoc, savedHighlight } from "./support/page-helpers";

// Luminance runs from 0 (black) to 1 (white); these bounds only separate dark from light surfaces.
const DARK = 0.2;
const LIGHT = 0.5;

test("the app follows a dark system theme", async ({ page }) => {
  await page.goto("/");

  expect(await luminanceOf(page.locator("body"), "background-color")).toBeLessThan(DARK);
  expect(await luminanceOf(page.getByRole("heading", { level: 1 }), "color")).toBeGreaterThan(LIGHT);
});

test("the reader, its highlights, and the tooltip are dark and readable", async ({ page }) => {
  await openSeededDoc(page);

  const paragraph = page.locator(".doc-reader-content p").first();
  expect(await luminanceOf(paragraph, "color")).toBeGreaterThan(LIGHT);

  const highlight = savedHighlight(page);
  expect(await luminanceOf(highlight, "background-color")).toBeLessThan(DARK);

  await highlight.hover();
  const tooltip = page.getByRole("tooltip");
  await expect(tooltip).toContainText(SEEDED_DOC.savedMeaning);
  expect(await luminanceOf(tooltip, "background-color")).toBeLessThan(DARK);
  expect(await luminanceOf(tooltip, "color")).toBeGreaterThan(LIGHT);
});
