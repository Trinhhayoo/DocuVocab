import { afterEach, describe, expect, it, vi } from "vitest";

import createLlmProvider from "@/feature/support/llm/create-llm-provider";
import type { ExplainVocabularyResponse } from "@/feature/support/llm/llm-provider.interface";
import { handleExplainVocabulary } from "./explain-vocabulary.handler";

vi.mock("@/feature/support/llm/create-llm-provider", () => ({ default: vi.fn() }));

const EXPLANATION: ExplainVocabularyResponse = {
  meaning: "lũy đẳng",
  simpleExplanation: "Gọi nhiều lần vẫn cho cùng kết quả.",
  meaningEn: "producing the same result when repeated",
  simpleExplanationEn: "Calling it again does not change the result.",
  exampleSentence: "DELETE is idempotent in a well-designed API.",
  domain: "tech",
};

function explainRequest(body: unknown): Request {
  return new Request("http://localhost/api/vocabularies/explain", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.mocked(createLlmProvider).mockReset();
});

describe("handleExplainVocabulary", () => {
  it("returns both languages from the provider", async () => {
    const explainVocabulary = vi.fn().mockResolvedValue(EXPLANATION);
    vi.mocked(createLlmProvider).mockReturnValue({ explainVocabulary });

    const response = await handleExplainVocabulary(
      explainRequest({ text: "idempotent", meaningLanguage: "English" }),
    );

    expect(response.status).toBe(200);
    expect((await response.json()).data).toEqual(EXPLANATION);
    expect(explainVocabulary).toHaveBeenCalledWith({
      text: "idempotent",
      sentence: undefined,
      paragraph: undefined,
      sourceTitle: undefined,
      sourceUrl: undefined,
    });
  });

  it("rejects an empty selection", async () => {
    const response = await handleExplainVocabulary(explainRequest({ text: "   " }));

    expect(response.status).toBe(400);
    expect(createLlmProvider).not.toHaveBeenCalled();
  });

  it("returns 500 when the provider is not configured", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.mocked(createLlmProvider).mockImplementation(() => {
      throw new Error("ANTHROPIC_API_KEY is not set.");
    });

    const response = await handleExplainVocabulary(explainRequest({ text: "idempotent" }));

    expect(response.status).toBe(500);
    expect((await response.json()).message).toBe("AI explanations are not configured.");
  });

  it("returns 500 when the provider fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.mocked(createLlmProvider).mockReturnValue({
      explainVocabulary: vi.fn().mockRejectedValue(new Error("timeout")),
    });

    const response = await handleExplainVocabulary(explainRequest({ text: "idempotent" }));

    expect(response.status).toBe(500);
  });
});
