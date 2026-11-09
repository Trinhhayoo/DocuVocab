export type Settings = Readonly<{
  /** Whether to show all vocabulary matched with docs without considering docsId/sourceUrl. */
  allowGlobalVocabulary: boolean;
  /** Saved OpenRouter model slug (see @docuvocab/shared AI_MODELS); null means the default. */
  aiModel: string | null;
  /** Whether the user connected their own OpenRouter account. The key itself never leaves the server. */
  openRouterConnected: boolean;
}>;

export const DEFAULT_SETTINGS: Settings = {
  allowGlobalVocabulary: false,
  aiModel: null,
  openRouterConnected: false,
};
