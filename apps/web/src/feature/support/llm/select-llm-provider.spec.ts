import { DEFAULT_AI_MODEL_ID } from "@docuvocab/shared";
import { afterEach, describe, expect, it, vi } from "vitest";

import createLlmProvider from "./create-llm-provider";
import OpenRouterLLMProvider from "./openrouter-llm-provider";
import selectLlmProvider from "./select-llm-provider";

vi.mock("./create-llm-provider", () => ({ default: vi.fn(() => ({ explainVocabulary: vi.fn() })) }));

const ENV = { LLM_PROVIDER: "openrouter", OPENROUTER_API_KEY: "app-key" };

afterEach(() => {
  vi.restoreAllMocks();
  vi.mocked(createLlmProvider).mockClear();
});

describe("selectLlmProvider", () => {
  it("uses the user's own key with their chosen model", () => {
    const decrypt = vi.fn().mockReturnValue("user-key");

    const provider = selectLlmProvider(
      { aiModel: "google/gemini-3.6-flash", encryptedOpenRouterKey: "encrypted" },
      { env: ENV, decrypt },
    );

    expect(provider).toBeInstanceOf(OpenRouterLLMProvider);
    expect(decrypt).toHaveBeenCalledWith("encrypted");
    expect(createLlmProvider).not.toHaveBeenCalled();
  });

  it("gives users without their own key the app provider and the default model", () => {
    selectLlmProvider(
      { aiModel: "google/gemini-3.6-flash", encryptedOpenRouterKey: null },
      { env: ENV },
    );

    expect(createLlmProvider).toHaveBeenCalledWith(ENV, DEFAULT_AI_MODEL_ID);
  });

  it("falls back to the app provider when the stored key cannot be decrypted", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    selectLlmProvider(
      { aiModel: null, encryptedOpenRouterKey: "encrypted" },
      {
        env: ENV,
        decrypt: () => {
          throw new Error("bad key");
        },
      },
    );

    expect(createLlmProvider).toHaveBeenCalledWith(ENV, DEFAULT_AI_MODEL_ID);
  });
});
