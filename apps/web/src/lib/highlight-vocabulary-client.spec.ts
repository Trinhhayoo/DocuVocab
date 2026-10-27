// @vitest-environment jsdom
import { describe, expect, it } from "vitest";

import { createHighlightedVocabularyHtml } from "./highlight-vocabulary-client";

function highlightedWords(html: string, words: string[]): string[] {
  const vocabularies = words.map((word, index) => ({ id: `vocab-${index}`, word }));
  const container = document.createElement("div");
  container.innerHTML = createHighlightedVocabularyHtml(html, vocabularies);

  return [...container.querySelectorAll("mark.vocab-highlight")].map((mark) => mark.textContent ?? "");
}

describe("createHighlightedVocabularyHtml", () => {
  it("highlights a phrase with an apostrophe", () => {
    expect(highlightedWords("<p>Read about Claude's behavior today.</p>", ["Claude's behavior"])).toEqual([
      "Claude's behavior",
    ]);
  });

  it("matches a curly apostrophe in the page against a straight one in the saved word", () => {
    expect(highlightedWords("<p>Claude’s behavior changed.</p>", ["Claude's behavior"])).toEqual([
      "Claude’s behavior",
    ]);
  });

  it("links the mark to its vocabulary even when the apostrophe differs", () => {
    const container = document.createElement("div");
    container.innerHTML = createHighlightedVocabularyHtml("<p>Claude’s behavior</p>", [
      { id: "vocab-1", word: "Claude's behavior" },
    ]);

    expect(container.querySelector("mark")?.getAttribute("data-vocab-id")).toBe("vocab-1");
  });

  it.each([
    ["C++", "<p>Learn C++ first.</p>", ["C++"]],
    ["Node.js", "<p>Run it on Node.js.</p>", ["Node.js"]],
    ["accented words", "<p>Un café crème.</p>", ["café"]],
  ])("highlights %s", (_, html, expected) => {
    expect(highlightedWords(html, expected)).toEqual(expected);
  });

  it.each([
    ["inside another word", "<p>categories</p>", "cat"],
    ["after an accented letter", "<p>écat</p>", "cat"],
  ])("does not highlight %s", (_, html, word) => {
    expect(highlightedWords(html, [word])).toEqual([]);
  });

  it("skips links and code", () => {
    expect(
      highlightedWords('<p><a href="#">token</a> <code>token</code> token</p>', ["token"]),
    ).toEqual(["token"]);
  });
});
