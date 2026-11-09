import { describe, expect, it } from "vitest";

import { AI_MODELS, DEFAULT_AI_MODEL_ID, findAiModel, resolveAiModelId } from "./ai-models";

describe("AI_MODELS", () => {
  it("has unique ids and a default the app key can serve", () => {
    expect(new Set(AI_MODELS.map((model) => model.id)).size).toBe(AI_MODELS.length);
    expect(findAiModel(DEFAULT_AI_MODEL_ID)?.requiresOwnKey).toBe(false);
  });
});

describe("resolveAiModelId", () => {
  it("lets users without their own key pick a free model", () => {
    expect(resolveAiModelId("dots-studio/dots-3-note-preview:free", false)).toBe(
      "dots-studio/dots-3-note-preview:free",
    );
  });

  it("keeps a saved model the user may use", () => {
    expect(resolveAiModelId("google/gemini-3.6-flash", true)).toBe("google/gemini-3.6-flash");
  });

  it("falls back to the default when the model needs the user's own key", () => {
    expect(resolveAiModelId("google/gemini-3.6-flash", false)).toBe(DEFAULT_AI_MODEL_ID);
  });

  it.each([null, undefined, "unknown/model"])("falls back to the default for %j", (savedId) => {
    expect(resolveAiModelId(savedId, true)).toBe(DEFAULT_AI_MODEL_ID);
  });
});
