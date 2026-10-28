import { expect, test } from "@playwright/test";

test("the logo link has an accessible name", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("link", { name: "DocuVocab home" })).toBeVisible();
});

test.describe("header dialogs load on demand and open", () => {
  for (const { button, title } of [
    { button: "Feedback", title: "Feedback" },
    { button: "Open settings", title: "Settings" },
  ]) {
    test(title, async ({ page }) => {
      await page.goto("/");

      await page.getByRole("button", { name: button }).click();
      const dialog = page.getByRole("dialog", { name: title });
      await expect(dialog).toBeVisible();

      await page.keyboard.press("Escape");
      await expect(dialog).toBeHidden();
    });
  }
});
