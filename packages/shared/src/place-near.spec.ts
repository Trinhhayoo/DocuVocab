import { describe, expect, it } from "vitest";

import { placeNear } from "./place-near";

const VIEWPORT = { width: 400, height: 800 };
const TOOLTIP = { width: 320, height: 100 };

function wordAt(left: number, top: number) {
  return { left, right: left + 60, top, bottom: top + 20 };
}

describe("placeNear", () => {
  it("centers on a word in the middle of the screen", () => {
    expect(placeNear({ left: 170, right: 230, top: 400, bottom: 420 }, { width: 100, height: 50 }, VIEWPORT).left).toBe(150);
  });

  it.each([
    ["the left edge", wordAt(0, 400), 8],
    ["the right edge", wordAt(340, 400), 72],
  ])("keeps the element inside the viewport for a word at %s", (_, anchor, left) => {
    const position = placeNear(anchor, TOOLTIP, VIEWPORT);
    expect(position.left).toBe(left);
    expect(position.left + TOOLTIP.width).toBeLessThanOrEqual(VIEWPORT.width - 8);
  });

  it("goes below by default and above when asked", () => {
    expect(placeNear(wordAt(100, 400), TOOLTIP, VIEWPORT).top).toBe(428);
    expect(placeNear(wordAt(100, 400), TOOLTIP, VIEWPORT, "above").top).toBe(292);
  });

  it("flips below when there is no room above", () => {
    expect(placeNear(wordAt(100, 20), TOOLTIP, VIEWPORT, "above").top).toBe(48);
  });

  it("flips above when there is no room below", () => {
    expect(placeNear(wordAt(100, 750), TOOLTIP, VIEWPORT).top).toBe(642);
  });

  it("pins to the margin when the element is wider than the viewport", () => {
    expect(placeNear(wordAt(100, 400), { width: 500, height: 100 }, VIEWPORT).left).toBe(8);
  });
});
