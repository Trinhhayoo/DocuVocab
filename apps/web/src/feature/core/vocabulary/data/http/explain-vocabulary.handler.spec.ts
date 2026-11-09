import { afterEach, describe, expect, it, vi } from "vitest";

import { success } from "@/feature/common/data/result";
import { DEFAULT_SETTINGS } from "@/feature/core/settings/domain/entity/settings.entity";
import type SettingsRepository from "@/feature/core/settings/domain/i-repo/settings.repository";
import createLlmProvider from "@/feature/support/llm/create-llm-provider";
import type { ExplainVocabularyResponse } from "@/feature/support/llm/llm-provider.interface";
import { OpenRouterRequestError } from "@/feature/support/llm/openrouter-llm-provider";
import { handleExplainVocabulary } from "./explain-vocabulary.handler";

vi.mock("@/feature/support/llm/create-llm-provider", () => ({ default: vi.fn() }));
vi.mock("@/feature/core/settings/data/settings.repository", () => ({ default: vi.fn() }));

const USER_ID = "user-1";

/** A user who has not connected OpenRouter, so the app's provider answers. */
const settingsRepo: SettingsRepository = {
  get: vi.fn().mockResolvedValue(success(DEFAULT_SETTINGS)),
  update: vi.fn(),
  getEncryptedOpenRouterKey: vi.fn().mockResolvedValue(success(null)),
  setEncryptedOpenRouterKey: vi.fn(),
};

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
      USER_ID,
      settingsRepo,
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
    const response = await handleExplainVocabulary(
      explainRequest({ text: "   " }),
      USER_ID,
      settingsRepo,
    );

    expect(response.status).toBe(400);
    expect(createLlmProvider).not.toHaveBeenCalled();
  });

  it("returns 500 when the provider is not configured", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.mocked(createLlmProvider).mockImplementation(() => {
      throw new Error("ANTHROPIC_API_KEY is not set.");
    });

    const response = await handleExplainVocabulary(
      explainRequest({ text: "idempotent" }),
      USER_ID,
      settingsRepo,
    );

    expect(response.status).toBe(500);
    expect((await response.json()).message).toBe("AI explanations are not configured.");
  });

  it("returns 500 when the provider fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.mocked(createLlmProvider).mockReturnValue({
      explainVocabulary: vi.fn().mockRejectedValue(new Error("timeout")),
    });

    const response = await handleExplainVocabulary(
      explainRequest({ text: "idempotent" }),
      USER_ID,
      settingsRepo,
    );

    expect(response.status).toBe(500);
  });

  it.each([
    [402, "no credit"],
    [429, "free limit"],
  ])("explains an OpenRouter %i to the user", async (status, phrase) => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.mocked(createLlmProvider).mockReturnValue({
      explainVocabulary: vi.fn().mockRejectedValue(new OpenRouterRequestError(status, "upstream")),
    });

    const response = await handleExplainVocabulary(
      explainRequest({ text: "idempotent" }),
      USER_ID,
      settingsRepo,
    );

    expect(response.status).toBe(status);
    expect((await response.json()).message).toContain(phrase);
  });
});
