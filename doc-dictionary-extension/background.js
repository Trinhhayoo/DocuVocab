import { UrlConfig } from "./urlConfig.js";

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

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  // Return true to indicate we will respond asynchronously.
  // Without this, the message channel closes before the fetch completes.
  handleMessage(message).then(sendResponse);
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
    default:
      return { success: false, message: `Unknown message type: ${message.type}` };
  }
}

// ---------------------------------------------------------------------------
// API calls
// ---------------------------------------------------------------------------

/**
 * Fetch vocabularies for a given page URL.
 * The API returns all vocabularies matching the URL or hostname,
 * so the content script can highlight them.
 */
async function getVocabularies({ url, hostname }) {
  try {
    const params = new URLSearchParams({ url, hostname });
    const response = await fetch(`${UrlConfig.API_BASE}/vocabularies?${params}`);
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

    const response = await fetch(`${UrlConfig.API_BASE}/vocabularies`, {
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

/**
 * Request an AI-generated explanation for a word/phrase in context.
 * Called before saving so the popup can pre-fill meaning and note fields.
 */
async function explainVocabulary(payload) {
  try {
    const response = await fetch(`${UrlConfig.API_BASE}/vocabularies/explain`, {
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
