import { describe, expect, it } from "vitest";

import type { Vocabulary } from "@/lib/vocabulary";

import { createVocabularyMatcher } from "./find-matches";

function vocabulary(id: string, word: string): Vocabulary {
  return { id, word, meaning: null, meaningEn: null, note: null, noteEn: null, exampleSentence: null };
}

describe("createVocabularyMatcher", () => {
  it("returns offsets and the matching vocabulary id", () => {
    const matcher = createVocabularyMatcher([vocabulary("1", "idempotent"), vocabulary("2", "race condition")]);

    expect(matcher.find("An idempotent fix for a Race Condition.")).toEqual([
      { start: 3, end: 13, vocabId: "1" },
      { start: 24, end: 38, vocabId: "2" },
    ]);
  });

  it("links a curly apostrophe on the page to the saved straight one", () => {
    const matcher = createVocabularyMatcher([vocabulary("1", "Claude's behavior")]);

    expect(matcher.find("Claude’s behavior")).toEqual([{ start: 0, end: 17, vocabId: "1" }]);
  });

  it("keeps the first vocabulary when two normalize to the same word", () => {
    const matcher = createVocabularyMatcher([vocabulary("1", "Token"), vocabulary("2", "token.")]);

    expect(matcher.find("token")).toEqual([{ start: 0, end: 5, vocabId: "1" }]);
  });

  it("finds a saved vocabulary by its selected text", () => {
    const matcher = createVocabularyMatcher([vocabulary("1", "idempotent")]);

    expect(matcher.findVocabulary("Idempotent,")?.id).toBe("1");
    expect(matcher.findVocabulary("other")).toBeUndefined();
  });

  it("matches nothing without vocabulary", () => {
    expect(createVocabularyMatcher([]).find("anything")).toEqual([]);
  });
});
