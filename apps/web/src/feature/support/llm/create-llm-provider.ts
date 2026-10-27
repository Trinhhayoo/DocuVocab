import AnthropicLLMProvider from "./anthropic-llm-provider";
import type LLMProvider from "./llm-provider.interface";
import OllamaLLMProvider from "./ollama-llm-provider";

type LlmEnv = Readonly<Record<string, string | undefined>>;

/** Picks the LLM from `LLM_PROVIDER` (`anthropic` by default or `ollama`) and optional `LLM_MODEL`. */
export default function createLlmProvider(env: LlmEnv = process.env): LLMProvider {
  const provider = env.LLM_PROVIDER ?? "anthropic";
  const model = env.LLM_MODEL || undefined;

  switch (provider) {
    case "anthropic":
      return new AnthropicLLMProvider(requireEnv(env, "ANTHROPIC_API_KEY"), model);
    case "ollama":
      return new OllamaLLMProvider(requireEnv(env, "OLLAMA_API_KEY"), model);
    default:
      throw new Error(`Unknown LLM_PROVIDER "${provider}". Use "anthropic" or "ollama".`);
  }
}

function requireEnv(env: LlmEnv, name: string): string {
  const value = env[name];

  if (!value) {
    throw new Error(`${name} is not set.`);
  }

  return value;
}
