import { browser } from "wxt/browser";
import { defineBackground } from "wxt/utils/define-background";

import { createApiClient } from "@/background/api-client";
import { createMessageHandler } from "@/background/handle-message";
import { browserTokenStore } from "@/background/token-store";
import { API_ORIGIN } from "@/lib/config";
import type { BackgroundMessage } from "@/lib/messages";

export default defineBackground(() => {
  const handleMessage = createMessageHandler({
    api: createApiClient({ origin: API_ORIGIN, tokens: browserTokenStore }),
    tokens: browserTokenStore,
    origin: API_ORIGIN,
  });

  // Network calls run here, under the extension origin, so page CSP cannot block them.
  browser.runtime.onMessage.addListener((message: BackgroundMessage, sender, sendResponse) => {
    if (sender.id !== browser.runtime.id) return false;

    // Chrome only keeps the channel open for `sendResponse` + `true`, not for a returned promise.
    void handleMessage(message).then(sendResponse);
    return true;
  });
});
