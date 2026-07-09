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
const WEB_APP_URL = "https://docu-vocab-kappa.vercel.app";
const API_BASE = `${WEB_APP_URL}/api/extension`;

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
    default:
      return {
        success: false,
        message: `Unknown message type: ${message.type}`,
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

async function loginWithGoogleFromExtension(returnTo) {
  console.log("loginWithGoogleFromExtension called with returnTo:", returnTo);
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

        if (!accessToken || !refreshToken) {
          resolve({
            success: false,
            status: "401",
            message: "Login failed. Missing auth token.",
          });
          return;
        }

        await chrome.storage.local.set({
          supabaseAccessToken: accessToken,
          supabaseRefreshToken: refreshToken,
        });

        const [activeTab] = await chrome.tabs.query({
          active: true,
          currentWindow: true,
        });

        if (activeTab?.id) {
          await chrome.tabs.sendMessage(activeTab.id, {
            type: "AUTH_LOGIN_SUCCESS",
          });
        }

        resolve({ success: true });
      },
    );
  });
}

/**
 * Fetch vocabularies for a given page URL.
 * The API returns all vocabularies matching the URL or hostname,
 * so the content script can highlight them.
 */
async function getVocabularies({ url, hostname }) {
  try {
    const token = await getAuthToken();

    if (!token) {
      return {
        success: false,
        status: "401",
        message: "Please log in before saving vocabulary.",
      };
    }

    const params = new URLSearchParams({ url, hostname });
    const response = await fetch(`${API_BASE}/vocabularies?${params}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await response.json();
    return data;
  } catch (err) {
    return { success: false, message: err.message };
  }
}

/**
 * Save a new vocabulary word.
 * Called when the user selects text and clicks "Save" in the floating popup.
 */
async function saveVocabulary(payload) {
  try {
    const token = await getAuthToken();

    if (!token) {
      return {
        success: false,
        status: "401",
        message: "Please log in before saving vocabulary.",
      };
    }
    const response = await fetch(`${API_BASE}/vocabularies`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    return data;
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
    const data = await response.json();
    return data;
  } catch (err) {
    return { success: false, message: err.message };
  }
}
