import { describe, expect, it } from "vitest";

import { extractSentence } from "./extract-sentence";

describe("extractSentence", () => {
  it("returns the sentence around the selection", () => {
    expect(extractSentence("First one. Retries are idempotent here! Last?", "idempotent")).toBe(
      "Retries are idempotent here!",
    );
  });

  it("returns the whole text when there is no punctuation", () => {
    expect(extractSentence("just a fragment", "fragment")).toBe("just a fragment");
  });

  it("keeps the first letter when no space follows the previous sentence", () => {
    expect(extractSentence("Done.Next idea", "idea")).toBe("Next idea");
  });

  it("falls back to the first 200 characters when the selection is missing", () => {
    const text = "x".repeat(300);
    expect(extractSentence(text, "missing")).toBe("x".repeat(200));
  });

  it("caps the sentence at 500 characters", () => {
    const text = `${"word ".repeat(200)}target`;
    expect(extractSentence(text, "target")).toHaveLength(500);
  });
});
