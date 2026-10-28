import { expect, type Locator, type Page } from "@playwright/test";

import { readSeededIds, SEEDED_DOC } from "./fixtures";

/** A fixed explanation, so tests never depend on the LLM. */
export const MOCK_EXPLANATION = {
  meaning: "thông lượng",
  meaningEn: "amount of work done per unit of time",
  simpleExplanation: "Lượng công việc xử lý được mỗi giây.",
  simpleExplanationEn: "How much work gets done each second.",
  exampleSentence: "Batching doubled our throughput.",
  domain: "tech",
} as const;

export async function mockExplanations(page: Page) {
  await page.route("**/api/vocabularies/explain", (route) =>
    route.fulfill({ json: { success: true, status: "200", message: "OK", data: MOCK_EXPLANATION } }),
  );
}

export async function openSeededDoc(page: Page) {
  await page.goto(`/docs/${readSeededIds().docId}`);
  await expect(savedHighlight(page)).toBeVisible();
}

/** The first highlight of the saved word, which opens a paragraph. */
export function savedHighlight(page: Page): Locator {
  return page.locator("mark.vocab-highlight", { hasText: SEEDED_DOC.savedWord }).first();
}

/** Double-clicks a word inside the reader, which selects it like a user would. */
export async function selectWordInReader(page: Page, word: string) {
  const point = await page.locator(".doc-reader-content").evaluate((reader, target) => {
    const walker = document.createTreeWalker(reader, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      const index = node.textContent?.indexOf(target) ?? -1;
      if (index === -1) continue;

      const range = document.createRange();
      range.setStart(node, index);
      range.setEnd(node, index + target.length);
      const rect = range.getBoundingClientRect();
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    }
    return null;
  }, word);

  if (!point) throw new Error(`"${word}" is not in the reader.`);
  await page.mouse.dblclick(point.x, point.y);
}

/** Asserts the element lies fully inside the viewport. */
export async function expectInsideViewport(page: Page, locator: Locator) {
  const box = await locator.boundingBox();
  const viewport = page.viewportSize();
  if (!box || !viewport) throw new Error("The element or the viewport has no size.");

  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
  expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);
}

/** Fails when the page scrolls sideways. */
export async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
}

/** Relative luminance (0 dark to 1 light) of a computed color, read through a canvas so any CSS color format works. */
export async function luminanceOf(locator: Locator, property: "color" | "background-color") {
  return locator.evaluate((element, cssProperty) => {
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("No 2D canvas context.");

    context.fillStyle = getComputedStyle(element).getPropertyValue(cssProperty);
    context.fillRect(0, 0, 1, 1);
    const [r = 0, g = 0, b = 0] = context.getImageData(0, 0, 1, 1).data;
    const channel = (value: number) => {
      const c = value / 255;
      return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
  }, property);
}
