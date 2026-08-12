/* ============================================================
   Doc Dictionary — Background Service Worker
   ============================================================
   Runs in the extension's isolated context (not in any webpage).
   
   Why a service worker?
     • Content scripts run inside the webpage's origin. They inherit
       the page's Content Security Policy, which may block requests
       to our API (localhost:3000).
     • The background service worker runs under the extension's own
       origin (chrome-extension://...) and has the host_permissions
       declared in manifest.json — so it can call any allowed URL.
     • This is the standard Chrome MV3 pattern: content script
       sends a message → background makes the fetch → returns result.
   
   Responsibilities:
     1. Relay API requests (GET vocabularies, POST new vocabulary).
     2. Store auth token (future — currently using mock_user).
     3. Route messages between content script and popup.
   ============================================================ */

// ---------------------------------------------------------------------------
// Message handler
// ---------------------------------------------------------------------------
const WEB_APP_URL = "http://localhost:3000";
const API_BASE = `${WEB_APP_URL}/api/extension`;
let refreshSessionPromise = null;

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  console.log("Received message:", message);

  // Return true to indicate we will respond asynchronously.
  // Without this, the message channel closes before the fetch completes.
  // handleMessage(message).then(sendResponse);
  handleMessage(message)
    .then(sendResponse)
    .catch((error) => {
      console.error("Background error:", error);
      sendResponse({
        success: false,
        status: "500",
        message: error.message,
      });
    });
  return true;
});

async function handleMessage(message) {
  switch (message.type) {
    case "GET_VOCABULARIES":
      return getVocabularies(message.payload);
    case "REHIGHLIGHT_PAGE":
      return rehighlightPage(message.payload);
    case "GET_SETTINGS":
      return getSettings();
    case "UPDATE_SETTINGS":
      return updateSettings(message.payload);
    case "SAVE_VOCABULARY":
      return saveVocabulary(message.payload);
    case "EXPLAIN_VOCABULARY":
      return explainVocabulary(message.payload);
    case "HEALTH_CHECK":
      return { success: true, status: "ok" };

    case "OPEN_LOGIN_PAGE":
      console.log(
        "OPEN_LOGIN_PAGE message received with payload:",
        message.payload,
      );
      return loginWithGoogleFromExtension(message.payload?.returnTo);
    case "LOGOUT":
      return logoutFromExtension();
    default:
      return {
        success: false,
        message: `Unknown message type: ${message.type}`,
      };
  }
}

async function rehighlightPage(payload = {}) {
  try {
    const tabId = payload?.tabId;

    if (typeof tabId === "number") {
      await chrome.tabs.sendMessage(tabId, { type: "REHIGHLIGHT" });
      return { success: true };
    }

    const [activeTab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (!activeTab?.id) {
      return {
        success: false,
        status: "400",
        message: "No active tab found for rehighlight.",
      };
    }

    await chrome.tabs.sendMessage(activeTab.id, { type: "REHIGHLIGHT" });
    return { success: true };
  } catch (error) {
    return {
      success: false,
      status: "500",
      message: error.message,
    };
  }
}

// ---------------------------------------------------------------------------
// API calls
// ---------------------------------------------------------------------------

async function getAuthToken() {
  const result = await chrome.storage.local.get(["supabaseAccessToken"]);
  return result.supabaseAccessToken ?? null;
}

async function getRefreshToken() {
  const result = await chrome.storage.local.get(["supabaseRefreshToken"]);
  return result.supabaseRefreshToken ?? null;
}

async function saveAuthTokens({ accessToken, refreshToken }) {
  await chrome.storage.local.set({
    supabaseAccessToken: accessToken,
    supabaseRefreshToken: refreshToken,
  });
}

async function clearAuthTokens() {
  await chrome.storage.local.remove([
    "supabaseAccessToken",
    "supabaseRefreshToken",
  ]);
}

function withAuthorizationHeader(init, token) {
  const headers = new Headers(init?.headers ?? {});

  headers.set("Authorization", `Bearer ${token}`);

  return {
    ...(init ?? {}),
    headers,
  };
}

async function refreshAuthSession() {
  if (refreshSessionPromise) {
    return refreshSessionPromise;
  }

  refreshSessionPromise = (async () => {
    const refreshToken = await getRefreshToken();

    if (!refreshToken) {
      return null;
    }

    try {
      const response = await fetch(`${API_BASE}/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken }),
      });

      const data = await parseApiResponse(
        response,
        "Cannot refresh session. Please sign in again.",
      );

      const accessToken = data?.data?.accessToken;
      const nextRefreshToken = data?.data?.refreshToken;

      if (!response.ok || !accessToken || !nextRefreshToken) {
        if (response.status === 401) {
          await clearAuthTokens();
        }

        return null;
      }

      await saveAuthTokens({
        accessToken,
        refreshToken: nextRefreshToken,
      });

      return accessToken;
    } catch {
      return null;
    }
  })();

  try {
    return await refreshSessionPromise;
  } finally {
    refreshSessionPromise = null;
  }
}

async function fetchWithAutoRefresh(url, init) {
  const accessToken = await getAuthToken();

  if (!accessToken) {
    return { response: null, unauthorized: true };
  }

  let response = await fetch(url, withAuthorizationHeader(init, accessToken));

  if (response.status !== 401) {
    return { response, unauthorized: false };
  }

  const refreshedAccessToken = await refreshAuthSession();

  if (!refreshedAccessToken) {
    return { response: null, unauthorized: true };
  }

  response = await fetch(
    url,
    withAuthorizationHeader(init, refreshedAccessToken),
  );

  return {
    response,
    unauthorized: response.status === 401,
  };
}

async function parseApiResponse(response, fallbackMessage) {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();
  const isHtmlResponse = text.trim().startsWith("<!DOCTYPE") || text.includes("<html");

  return {
    success: false,
    status: String(response.status || 500),
    message: isHtmlResponse ? fallbackMessage : text || fallbackMessage,
  };
}

async function loginWithGoogleFromExtension(returnTo) {
  const redirectUrl = chrome.identity.getRedirectURL();

  const loginUrl = new URL(`${WEB_APP_URL}/auth/extension/login`);
  loginUrl.searchParams.set("next", returnTo || WEB_APP_URL);
  loginUrl.searchParams.set("redirect_uri", redirectUrl);

  return new Promise((resolve) => {
    chrome.identity.launchWebAuthFlow(
      {
        url: loginUrl.toString(),
        interactive: true,
      },
      async (callbackUrl) => {
        if (chrome.runtime.lastError || !callbackUrl) {
          resolve({
            success: false,
            status: "401",
            message:
              chrome.runtime.lastError?.message ?? "Login was cancelled.",
          });
          return;
        }

        const url = new URL(callbackUrl);
        const accessToken = url.searchParams.get("access_token");
        const refreshToken = url.searchParams.get("refresh_token");
        console.log(accessToken);
        console.log(refreshToken);

        if (!accessToken || !refreshToken) {
          resolve({
            success: false,
            status: "401",
            message: "Login failed. Missing auth token.",
          });
          return;
        }

        await saveAuthTokens({ accessToken, refreshToken });

        chrome.tabs
          .query({ active: true, currentWindow: true })
          .then(([activeTab]) => {
            if (activeTab?.id) {
              chrome.tabs.sendMessage(activeTab.id, {
                type: "AUTH_LOGIN_SUCCESS",
              });
            }
          })
          .catch(() => {});

        resolve({ success: true });
      },
    );
  });
}

async function logoutFromExtension() {
  try {
    await clearAuthTokens();

    chrome.tabs
      .query({ active: true, currentWindow: true })
      .then(([activeTab]) => {
        if (activeTab?.id) {
          chrome.tabs.sendMessage(activeTab.id, {
            type: "AUTH_LOGOUT_SUCCESS",
          });
        }
      })
      .catch(() => {});

    return { success: true };
  } catch (error) {
    return {
      success: false,
      status: "500",
      message: error.message,
    };
  }
}

/**
 * Fetch vocabularies for a given page URL.
 * The API returns all vocabularies matching the URL or hostname,
 * so the content script can highlight them.
 */
async function getVocabularies({ url, hostname }) {
  try {
    const params = new URLSearchParams({ url, hostname });
    const { response, unauthorized } = await fetchWithAutoRefresh(
      `${API_BASE}/vocabularies?${params}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    if (unauthorized || !response) {
      return {
        success: false,
        status: "401",
        message: "Please log in before saving vocabulary.",
      };
    }

    return parseApiResponse(
      response,
      "Cannot fetch vocabularies. Please sign in again.",
    );
  } catch (err) {
    return { success: false, message: err.message };
  }
}

async function getSettings() {
  try {
    let requestResult = await fetchWithAutoRefresh(`${API_BASE}/settings`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (requestResult.unauthorized || !requestResult.response) {
      return {
        success: false,
        status: "401",
        message: "Please sign in first.",
      };
    }

    let response = requestResult.response;

    if (response.status === 404) {
      requestResult = await fetchWithAutoRefresh(`${WEB_APP_URL}/api/settings`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (requestResult.unauthorized || !requestResult.response) {
        return {
          success: false,
          status: "401",
          message: "Please sign in first.",
        };
      }

      response = requestResult.response;
    }

    return parseApiResponse(
      response,
      "Cannot load settings. Please sign in again.",
    );
  } catch (err) {
    return { success: false, status: "500", message: err.message };
  }
}

async function updateSettings(payload) {
  try {
    let requestResult = await fetchWithAutoRefresh(`${API_BASE}/settings`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (requestResult.unauthorized || !requestResult.response) {
      return {
        success: false,
        status: "401",
        message: "Please sign in first.",
      };
    }

    let response = requestResult.response;

    if (response.status === 404) {
      requestResult = await fetchWithAutoRefresh(`${WEB_APP_URL}/api/settings`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (requestResult.unauthorized || !requestResult.response) {
        return {
          success: false,
          status: "401",
          message: "Please sign in first.",
        };
      }

      response = requestResult.response;
    }

    return parseApiResponse(
      response,
      "Cannot save settings. Please sign in again.",
    );
  } catch (err) {
    return { success: false, status: "500", message: err.message };
  }
}

/**
 * Save a new vocabulary word.
 * Called when the user selects text and clicks "Save" in the floating popup.
 */
async function saveVocabulary(payload) {
  try {
    const { response, unauthorized } = await fetchWithAutoRefresh(
      `${API_BASE}/vocabularies`,
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      },
    );

    if (unauthorized || !response) {
      return {
        success: false,
        status: "401",
        message: "Please log in before saving vocabulary.",
      };
    }

    return parseApiResponse(
      response,
      "Cannot save vocabulary. Please sign in again.",
    );
  } catch (err) {
    return { success: false, message: err.message };
  }
}

/**
 * Request an AI-generated explanation for a word/phrase in context.
 * Called before saving so the popup can pre-fill meaning and note fields.
 */
async function explainVocabulary(payload) {
  try {
    const response = await fetch(`${API_BASE}/vocabularies/explain`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    return parseApiResponse(
      response,
      "Cannot generate explanation right now.",
    );
  } catch (err) {
    return { success: false, message: err.message };
  }
}
