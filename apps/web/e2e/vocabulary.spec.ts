import { expect, test } from "@playwright/test";

import { readSeededIds, SEEDED_DOC } from "./support/fixtures";
import { readLocalSupabase } from "./support/local-supabase";
import {
  expectInsideViewport,
  MOCK_EXPLANATION,
  mockExplanations,
  openSeededDoc,
  savedHighlight,
  selectWordInReader,
} from "./support/page-helpers";
import { deleteVocabulary } from "./support/seed";

test.beforeEach(async ({ page }) => {
  await deleteVocabulary(readLocalSupabase().dbUrl, readSeededIds().userId, SEEDED_DOC.unsavedWord);
  await mockExplanations(page);
});

test("selecting a word fills both languages and saving highlights it", async ({ page }) => {
  await openSeededDoc(page);

  await selectWordInReader(page, SEEDED_DOC.unsavedWord);

  const editor = page.getByRole("dialog", { name: "Vocabulary editor" });
  await expect(editor.getByLabel("Meaning (Tiếng Việt)")).toHaveValue(MOCK_EXPLANATION.meaning);
  await expect(editor.getByLabel("Meaning (English)")).toHaveValue(MOCK_EXPLANATION.meaningEn);
  await expect(editor.getByLabel("Explanation (Tiếng Việt)")).toHaveValue(MOCK_EXPLANATION.simpleExplanation);
  await expect(editor.getByLabel("Explanation (English)")).toHaveValue(MOCK_EXPLANATION.simpleExplanationEn);

  await editor.getByRole("button", { name: "Save", exact: true }).click();

  await expect(editor).toBeHidden();
  await expect(page.locator("mark.vocab-highlight", { hasText: SEEDED_DOC.unsavedWord })).toBeVisible();
});

test("the tooltip stays on screen for a word at the start of a line", async ({ page }) => {
  await openSeededDoc(page);

  await savedHighlight(page).hover();

  const tooltip = page.getByRole("tooltip");
  await expect(tooltip).toContainText(SEEDED_DOC.savedMeaning);
  await expectInsideViewport(page, tooltip);
});
