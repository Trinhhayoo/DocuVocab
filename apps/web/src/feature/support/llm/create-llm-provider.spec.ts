import { describe, expect, it } from "vitest";

import AnthropicLLMProvider from "./anthropic-llm-provider";
import createLlmProvider from "./create-llm-provider";
import OllamaLLMProvider from "./ollama-llm-provider";

describe("createLlmProvider", () => {
  it("defaults to Anthropic", () => {
    expect(createLlmProvider({ ANTHROPIC_API_KEY: "test-key" })).toBeInstanceOf(
      AnthropicLLMProvider,
    );
  });

  it("uses Ollama when LLM_PROVIDER is ollama", () => {
    expect(
      createLlmProvider({ LLM_PROVIDER: "ollama", OLLAMA_API_KEY: "test-key" }),
    ).toBeInstanceOf(OllamaLLMProvider);
  });

  it.each([
    [{}, "ANTHROPIC_API_KEY is not set."],
    [{ LLM_PROVIDER: "ollama" }, "OLLAMA_API_KEY is not set."],
    [{ LLM_PROVIDER: "ollama", ANTHROPIC_API_KEY: "test-key" }, "OLLAMA_API_KEY is not set."],
    [{ LLM_PROVIDER: "gemini" }, 'Unknown LLM_PROVIDER "gemini"'],
  ])("rejects %j", (env, message) => {
    expect(() => createLlmProvider(env)).toThrow(message);
  });
});
