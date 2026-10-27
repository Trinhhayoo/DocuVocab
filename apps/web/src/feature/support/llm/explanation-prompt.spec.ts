import { describe, expect, it } from "vitest";

import {
  buildExplanationUserPrompt,
  detectExplanationMode,
  explanationOutputSchema,
  toExplainVocabularyResponse,
} from "./explanation-prompt";

describe("detectExplanationMode", () => {
  it.each(["vulnerability", "take into account", "  race condition  ", "a b c d e"])(
    "treats %j as a term",
    (text) => {
      expect(detectExplanationMode(text)).toBe("term");
    },
  );

  it.each([
    "The patch fixes a critical vulnerability in the parser",
    "It works.",
    'He said "no!"',
    "Why does this fail?",
  ])("treats %j as a sentence", (text) => {
    expect(detectExplanationMode(text)).toBe("sentence");
  });
});

describe("buildExplanationUserPrompt", () => {
  it("wraps the selection and context in tags", () => {
    const prompt = buildExplanationUserPrompt({
      text: "idempotent",
      sentence: "PUT requests should be idempotent.",
      sourceTitle: "HTTP basics",
    });

    expect(prompt).toContain("<selection>idempotent</selection>");
    expect(prompt).toContain("Sentence: PUT requests should be idempotent.");
    expect(prompt).toContain("Article title: HTTP basics");
    expect(prompt).toContain("word or phrase");
  });

  it("omits the context block when there is no context", () => {
    expect(buildExplanationUserPrompt({ text: "idempotent" })).not.toContain("<context>");
  });

  it("asks for a translation when the selection is a sentence", () => {
    expect(
      buildExplanationUserPrompt({ text: "The cache is warmed before traffic arrives." }),
    ).toContain("full sentence");
  });
});

describe("toExplainVocabularyResponse", () => {
  it("maps Vietnamese to the legacy fields and English to the *En fields", () => {
    const output = explanationOutputSchema.parse({
      meaningVi: "lũy đẳng",
      meaningEn: "producing the same result when repeated",
      explanationVi: "Gọi nhiều lần vẫn cho cùng kết quả.",
      explanationEn: "Calling it again does not change the result.",
      exampleSentence: "DELETE is idempotent in a well-designed API.",
      domain: "tech",
    });

    expect(toExplainVocabularyResponse(output)).toEqual({
      meaning: "lũy đẳng",
      simpleExplanation: "Gọi nhiều lần vẫn cho cùng kết quả.",
      meaningEn: "producing the same result when repeated",
      simpleExplanationEn: "Calling it again does not change the result.",
      exampleSentence: "DELETE is idempotent in a well-designed API.",
      domain: "tech",
    });
  });

  it("rejects an unknown domain", () => {
    expect(
      explanationOutputSchema.safeParse({
        meaningVi: "a",
        meaningEn: "b",
        explanationVi: "c",
        explanationEn: "d",
        exampleSentence: "e",
        domain: "medical",
      }).success,
    ).toBe(false);
  });
});
