import { describe, expect, it } from "vitest";

import { parseExplanationJson } from "./ollama-llm-provider";

const OUTPUT = {
  meaningVi: "lũy đẳng",
  meaningEn: "producing the same result when repeated",
  explanationVi: "Gọi nhiều lần vẫn cho cùng kết quả.",
  explanationEn: "Calling it again does not change the result.",
  exampleSentence: "DELETE is idempotent in a well-designed API.",
  domain: "tech",
};

describe("parseExplanationJson", () => {
  it.each([
    ["plain JSON", JSON.stringify(OUTPUT)],
    ["a fenced block", `\`\`\`json\n${JSON.stringify(OUTPUT, null, 2)}\n\`\`\``],
    ["surrounding prose", `Here is the explanation:\n${JSON.stringify(OUTPUT)}\nHope this helps.`],
  ])("parses %s", (_, text) => {
    expect(parseExplanationJson(text)).toEqual(OUTPUT);
  });

  it("rejects markdown without JSON", () => {
    expect(() => parseExplanationJson("**meaningVi**: lũy đẳng")).toThrow(
      "The model did not return a JSON object.",
    );
  });

  it("rejects JSON missing a field", () => {
    const { meaningEn: _meaningEn, ...withoutEnglish } = OUTPUT;

    expect(() => parseExplanationJson(JSON.stringify(withoutEnglish))).toThrow();
  });
});
