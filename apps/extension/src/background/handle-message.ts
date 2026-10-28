import type { ApiResult } from "@/lib/api-result";
import type { BackgroundMessage, BackgroundRequests } from "@/lib/messages";

import type { ApiClient } from "./api-client";
import { loginWithGoogle, logout } from "./auth";
import type { TokenStore } from "./token-store";

type HandlerDeps = Readonly<{ api: ApiClient; tokens: TokenStore; origin: string }>;

type Result<K extends keyof BackgroundRequests> = Promise<ApiResult<BackgroundRequests[K]["data"]>>;

function jsonInit(method: string, body?: unknown): RequestInit {
  return {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  };
}

export function createMessageHandler({ api, tokens, origin }: HandlerDeps) {
  return function handleMessage(message: BackgroundMessage): Result<typeof message.type> {
    switch (message.type) {
      case "GET_VOCABULARIES": {
        const query = new URLSearchParams({ url: message.payload.url });
        return api.request(`/api/extension/vocabularies?${query}`, jsonInit("GET"), "Cannot load your vocabulary.");
      }
      case "SAVE_VOCABULARY":
        return api.request(
          "/api/extension/vocabularies",
          jsonInit("POST", message.payload),
          "Cannot save vocabulary.",
        );
      case "EXPLAIN_VOCABULARY":
        return api.request(
          "/api/extension/vocabularies/explain",
          jsonInit("POST", message.payload),
          "Cannot generate an explanation right now.",
        );
      case "GET_SETTINGS":
        return api.request("/api/extension/settings", jsonInit("GET"), "Cannot load settings.");
      case "UPDATE_SETTINGS":
        return api.request("/api/extension/settings", jsonInit("PATCH", message.payload), "Cannot save settings.");
      case "LOGIN":
        return loginWithGoogle(origin, tokens, message.payload.returnTo);
      case "LOGOUT":
        return logout(api, tokens);
    }
  };
}
