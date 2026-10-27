import { describe, expect, it } from "vitest";

import AnthropicLLMProvider from "./anthropic-llm-provider";
import createLlmProvider from "./create-llm-provider";
import OllamaLLMProvider from "./ollama-llm-provider";

describe("createLlmProvider", () => {
  it("defaults to Ollama", () => {
    expect(createLlmProvider({ OLLAMA_API_KEY: "test-key" })).toBeInstanceOf(
      OllamaLLMProvider,
    );
  });

  it("uses Anthropic when LLM_PROVIDER is anthropic", () => {
    expect(
      createLlmProvider({ LLM_PROVIDER: "anthropic", ANTHROPIC_API_KEY: "test-key" }),
    ).toBeInstanceOf(AnthropicLLMProvider);
  });

  it.each([
    [{}, "OLLAMA_API_KEY is not set."],
    [{ ANTHROPIC_API_KEY: "test-key" }, "OLLAMA_API_KEY is not set."],
    [{ LLM_PROVIDER: "anthropic" }, "ANTHROPIC_API_KEY is not set."],
    [{ LLM_PROVIDER: "gemini" }, 'Unknown LLM_PROVIDER "gemini"'],
  ])("rejects %j", (env, message) => {
    expect(() => createLlmProvider(env)).toThrow(message);
  });
});
