import { browser } from "wxt/browser";

import { type ApiResult, fail } from "./api-result";
import type {
  Explanation,
  ExplainVocabularyInput,
  SaveVocabularyInput,
  Settings,
  Vocabulary,
} from "./vocabulary";

/** Requests the background handles: payload sent and data returned for each type. */
export type BackgroundRequests = {
  GET_VOCABULARIES: { payload: { url: string }; data: { vocabularies: Vocabulary[] } };
  SAVE_VOCABULARY: { payload: SaveVocabularyInput; data: { vocabulary: Vocabulary } };
  EXPLAIN_VOCABULARY: { payload: ExplainVocabularyInput; data: Explanation };
  GET_SETTINGS: { payload: null; data: { settings: Settings } };
  UPDATE_SETTINGS: { payload: Settings; data: { settings: Settings } };
  LOGIN: { payload: { returnTo: string }; data: null };
  LOGOUT: { payload: null; data: null };
};

export type BackgroundRequestType = keyof BackgroundRequests;

export type BackgroundMessage = {
  [K in BackgroundRequestType]: { type: K; payload: BackgroundRequests[K]["payload"] };
}[BackgroundRequestType];

/** Requests a content script handles, sent by the popup to the active tab. */
export type TabRequests = {
  GET_HIGHLIGHT_STATS: { matchedWords: number; occurrences: number };
  REHIGHLIGHT: null;
};

export type TabMessage = { type: keyof TabRequests };

export async function sendToBackground<K extends BackgroundRequestType>(
  type: K,
  payload: BackgroundRequests[K]["payload"],
): Promise<ApiResult<BackgroundRequests[K]["data"]>> {
  try {
    const response: ApiResult<BackgroundRequests[K]["data"]> | undefined =
      await browser.runtime.sendMessage({ type, payload });
    return response ?? fail(500, "No response from the extension background.");
  } catch (error) {
    return fail(500, error instanceof Error ? error.message : "Cannot reach the extension background.");
  }
}

export async function sendToTab<K extends keyof TabRequests>(
  tabId: number,
  type: K,
): Promise<ApiResult<TabRequests[K]>> {
  try {
    const response: ApiResult<TabRequests[K]> | undefined = await browser.tabs.sendMessage(tabId, { type });
    return response ?? fail(500, "No response from the page.");
  } catch {
    return fail(500, "This page does not allow the extension.");
  }
}
