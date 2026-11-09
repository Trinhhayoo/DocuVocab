import { describe, expect, it, vi } from "vitest";

import OpenRouterLLMProvider, { OPENROUTER_API_URL } from "./openrouter-llm-provider";

const OUTPUT = {
  meaningVi: "lũy đẳng",
  meaningEn: "producing the same result when repeated",
  explanationVi: "Gọi nhiều lần vẫn cho cùng kết quả.",
  explanationEn: "Calling it again does not change the result.",
  exampleSentence: "DELETE is idempotent in a well-designed API.",
  domain: "tech",
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("OpenRouterLLMProvider", () => {
  it("sends the chosen model with a JSON schema and maps the reply", async () => {
    const fetchFn = vi.fn<typeof fetch>().mockResolvedValue(
      jsonResponse({ choices: [{ message: { content: JSON.stringify(OUTPUT) } }] }),
    );
    const provider = new OpenRouterLLMProvider("test-key", "google/gemini-3.6-flash", fetchFn);

    const result = await provider.explainVocabulary({ text: "idempotent" });

    expect(result).toEqual({
      meaning: OUTPUT.meaningVi,
      simpleExplanation: OUTPUT.explanationVi,
      meaningEn: OUTPUT.meaningEn,
      simpleExplanationEn: OUTPUT.explanationEn,
      exampleSentence: OUTPUT.exampleSentence,
      domain: "tech",
    });

    const [url, init] = fetchFn.mock.calls[0];
    const body = JSON.parse(String(init?.body));

    expect(url).toBe(`${OPENROUTER_API_URL}/chat/completions`);
    expect(new Headers(init?.headers).get("Authorization")).toBe("Bearer test-key");
    expect(body.model).toBe("google/gemini-3.6-flash");
    expect(body.response_format.type).toBe("json_schema");
    expect(body.provider).toEqual({ require_parameters: true });
  });

  it("reports OpenRouter's error message", async () => {
    const fetchFn = vi
      .fn<typeof fetch>()
      .mockResolvedValue(jsonResponse({ error: { message: "Insufficient credits" } }, 402));
    const provider = new OpenRouterLLMProvider("test-key", undefined, fetchFn);

    await expect(provider.explainVocabulary({ text: "idempotent" })).rejects.toThrow(
      "OpenRouter request failed (402): Insufficient credits",
    );
  });

  it("rejects an empty reply", async () => {
    const fetchFn = vi
      .fn<typeof fetch>()
      .mockResolvedValue(jsonResponse({ choices: [{ message: { content: null } }] }));
    const provider = new OpenRouterLLMProvider("test-key", undefined, fetchFn);

    await expect(provider.explainVocabulary({ text: "idempotent" })).rejects.toThrow(
      "The model returned no explanation.",
    );
  });
});
