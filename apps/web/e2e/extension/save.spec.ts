import { readSeededIds, SEEDED_DOC } from "../support/fixtures";
import { expect, highlightedTexts, serveArticle, signInExtension, test } from "../support/extension";
import { readLocalSupabase } from "../support/local-supabase";
import { wordCenter } from "../support/page-helpers";
import { ARTICLE_HTML, deleteVocabulary } from "../support/seed";

const MEANING = "thông lượng";
const MEANING_EN = "work done per unit of time";

test.beforeEach(async () => {
  await deleteVocabulary(readLocalSupabase().dbUrl, readSeededIds().userId, SEEDED_DOC.unsavedWord);
});

test("saves a selected word and highlights it right away", async ({ context, page, serviceWorker }) => {
  await signInExtension(serviceWorker);
  await serveArticle(context, ARTICLE_HTML, SEEDED_DOC.sourceUrl);
  await page.goto(SEEDED_DOC.sourceUrl);
  await expect.poll(() => highlightedTexts(page)).toHaveLength(3);

  const { x, y } = await wordCenter(page, "body", SEEDED_DOC.unsavedWord);
  await page.mouse.dblclick(x, y);
  await page.getByRole("button", { name: /Save word/ }).click();

  const dialog = page.getByRole("dialog", { name: `Save ${SEEDED_DOC.unsavedWord}` });
  // AI is disabled in e2e, so the dialog falls back to manual entry.
  await expect(dialog.getByRole("status")).toContainText("Could not generate an explanation");

  await dialog.getByLabel("Meaning (Vietnamese)").fill(MEANING);
  await dialog.getByLabel("Meaning (English)").fill(MEANING_EN);
  await dialog.getByRole("button", { name: "Save", exact: true }).click();

  await expect(dialog).toContainText("Saved!");
  await expect.poll(() => highlightedTexts(page)).toContain(SEEDED_DOC.unsavedWord);

  // The new word is also shown with both meanings.
  const saved = await wordCenter(page, "body", SEEDED_DOC.unsavedWord);
  await page.mouse.move(saved.x, saved.y);
  await expect(page.getByRole("tooltip")).toContainText(MEANING);
  await expect(page.getByRole("tooltip")).toContainText(MEANING_EN);
});
