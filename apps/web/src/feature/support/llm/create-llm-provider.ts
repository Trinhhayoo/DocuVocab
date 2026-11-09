import AnthropicLLMProvider from "./anthropic-llm-provider";
import type LLMProvider from "./llm-provider.interface";
import OllamaLLMProvider from "./ollama-llm-provider";
import OpenRouterLLMProvider from "./openrouter-llm-provider";

type LlmEnv = Readonly<Record<string, string | undefined>>;

/**
 * Picks the app's LLM from `LLM_PROVIDER` (`ollama` by default, `anthropic`, or `openrouter`) and
 * optional `LLM_MODEL`. For `openrouter`, `model` (the user's allowed choice) wins over `LLM_MODEL`.
 */
export default function createLlmProvider(
  env: LlmEnv = process.env,
  model?: string,
): LLMProvider {
  const provider = env.LLM_PROVIDER ?? "ollama";
  const envModel = env.LLM_MODEL || undefined;

  switch (provider) {
    case "anthropic":
      return new AnthropicLLMProvider(requireEnv(env, "ANTHROPIC_API_KEY"), envModel);
    case "ollama":
      return new OllamaLLMProvider(requireEnv(env, "OLLAMA_API_KEY"), envModel);
    case "openrouter":
      return new OpenRouterLLMProvider(requireEnv(env, "OPENROUTER_API_KEY"), model ?? envModel);
    default:
      throw new Error(
        `Unknown LLM_PROVIDER "${provider}". Use "anthropic", "ollama", or "openrouter".`,
      );
  }
}

function requireEnv(env: LlmEnv, name: string): string {
  const value = env[name];

  if (!value) {
    throw new Error(`${name} is not set.`);
  }

  return value;
}
