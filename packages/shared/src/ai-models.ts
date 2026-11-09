export type AiModel = Readonly<{
  /** OpenRouter model slug. */
  id: string;
  label: string;
  /**
   * Paid models: only users who connected their own OpenRouter account (with credit) can pick them.
   * Free (`:free`) models work for everyone, on the app's key or the user's own.
   */
  requiresOwnKey: boolean;
}>;

/** Free on OpenRouter; accounts that never bought credit get 50 free requests a day. */
export const DEFAULT_AI_MODEL_ID = "nvidia/nemotron-3.5-super-vl:free";

/** Models checked to return the explanation JSON schema on OpenRouter (2026-11-09). */
export const AI_MODELS: readonly AiModel[] = [
  { id: DEFAULT_AI_MODEL_ID, label: "Nemotron 3.5 Super (free, default)", requiresOwnKey: false },
  { id: "dots-studio/dots-3-note-preview:free", label: "Dots 3 Note (free, preview)", requiresOwnKey: false },
  { id: "openai/gpt-oss-120b", label: "GPT-OSS 120B", requiresOwnKey: true },
  { id: "openai/gpt-oss-20b", label: "GPT-OSS 20B", requiresOwnKey: true },
  { id: "google/gemini-3.5-flash-lite", label: "Gemini 3.5 Flash Lite", requiresOwnKey: true },
  { id: "google/gemini-3.6-flash", label: "Gemini 3.6 Flash", requiresOwnKey: true },
  { id: "deepseek/deepseek-v4-flash", label: "DeepSeek V4 Flash", requiresOwnKey: true },
  { id: "anthropic/claude-haiku-5.5", label: "Claude Haiku 5.5", requiresOwnKey: true },
  { id: "meta-llama/llama-3.3-70b-instruct", label: "Llama 3.3 70B", requiresOwnKey: true },
  { id: "qwen/qwen3-235b-a22b-2507", label: "Qwen3 235B", requiresOwnKey: true },
];

export function findAiModel(id: string | null | undefined): AiModel | undefined {
  return AI_MODELS.find((model) => model.id === id);
}

/** The model to call: the saved choice when this user may use it, otherwise the default. */
export function resolveAiModelId(savedId: string | null | undefined, hasOwnKey: boolean): string {
  const model = findAiModel(savedId);

  return model && (hasOwnKey || !model.requiresOwnKey) ? model.id : DEFAULT_AI_MODEL_ID;
}
