import { describe, expect, it } from "vitest";

import { buildVocabularyRegex } from "./vocabulary-pattern";

function matches(text: string, words: string[]) {
  const regex = buildVocabularyRegex(words);
  return regex ? [...text.matchAll(regex)].map((match) => match[0]) : [];
}

describe("buildVocabularyRegex", () => {
  it("returns null when there are no words", () => {
    expect(buildVocabularyRegex([])).toBeNull();
    expect(buildVocabularyRegex(["  ", ""])).toBeNull();
  });

  it("prefers the longest phrase", () => {
    expect(matches("machine learning and machine", ["machine", "machine learning"])).toEqual([
      "machine learning",
      "machine",
    ]);
  });

  it("matches case-insensitively", () => {
    expect(matches("Idempotent requests", ["idempotent"])).toEqual(["Idempotent"]);
  });

  it("treats curly and straight apostrophes as equal", () => {
    expect(matches("Claude’s behavior", ["Claude's behavior"])).toEqual(["Claude’s behavior"]);
  });

  it.each([
    ["C++", "Learn C++ first."],
    ["Node.js", "Run it on Node.js."],
    ["café", "Un café crème."],
    ["a(b)", "call a(b) now"],
  ])("escapes and matches %s", (word, text) => {
    expect(matches(text, [word])).toEqual([word]);
  });

  it.each([
    ["inside another word", "categories", "cat"],
    ["after an accented letter", "écat", "cat"],
    ["before a digit", "cat9", "cat"],
    ["after an underscore", "_cat", "cat"],
  ])("does not match %s", (_, text, word) => {
    expect(matches(text, [word])).toEqual([]);
  });
});
