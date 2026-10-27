import { describe, expect, it } from "vitest";

import { cleanSelectedText, normalizeWord } from "./normalize-word";

describe("cleanSelectedText", () => {
  it.each([
    ["Claude's behavior", "Claude's behavior"],
    ["Claude’s behavior.", "Claude’s behavior"],
    ['"idempotent",', "idempotent"],
    ["  race\n  condition  ", "race condition"],
    ["(Node.js)", "Node.js"],
    ["state-of-the-art", "state-of-the-art"],
    ["...", ""],
  ])("cleans %j to %j", (input, expected) => {
    expect(cleanSelectedText(input)).toBe(expected);
  });
});

describe("normalizeWord", () => {
  it("treats curly and straight apostrophes as the same word", () => {
    expect(normalizeWord("Claude’s Behavior")).toBe(normalizeWord("claude's behavior"));
  });

  it("lowercases and trims edge punctuation", () => {
    expect(normalizeWord("  Idempotent. ")).toBe("idempotent");
  });
});
