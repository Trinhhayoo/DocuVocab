import { SEEDED_DOC } from "../support/fixtures";
import { expect, highlightedTexts, serveArticle, signInExtension, test } from "../support/extension";
import { wordCenter } from "../support/page-helpers";
import { ARTICLE_HTML } from "../support/seed";

test("highlights saved words without touching the page and shows both meanings", async ({
  context,
  page,
  serviceWorker,
}) => {
  await signInExtension(serviceWorker);
  await serveArticle(context, ARTICLE_HTML, SEEDED_DOC.sourceUrl);

  await page.goto(SEEDED_DOC.sourceUrl);

  // Two matches in the first paragraph and one in the second; the `code` block is skipped.
  await expect.poll(() => highlightedTexts(page)).toHaveLength(3);
  await expect(page.locator("mark")).toHaveCount(0);

  const { x, y } = await wordCenter(page, "body", SEEDED_DOC.savedWord);
  await page.mouse.move(x, y);

  const tooltip = page.getByRole("tooltip");
  await expect(tooltip).toContainText(SEEDED_DOC.savedMeaning);
  await expect(tooltip).toContainText(SEEDED_DOC.savedMeaningEn);
});
