const WEB_APP_URL = "http://localhost:3000"; // "https://docu-vocab-kappa.vercel.app";

const settingsState = {
  allowGlobalVocabulary: false,
  loading: false,
};

function sendBackgroundMessage(message) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        resolve({
          success: false,
          status: "500",
          message: chrome.runtime.lastError.message,
        });
        return;
      }

      resolve(
        response || {
          success: false,
          status: "500",
          message: "No response from extension background.",
        },
      );
    });
  });
}

function setSettingsStatus(message, type = "") {
  const settingsStatus = document.getElementById("settings-status");
  settingsStatus.textContent = message;
  settingsStatus.className = `settings-status ${type}`.trim();
}

function renderSettingsToggle() {
  const toggle = document.getElementById("settings-global-toggle");
  toggle.classList.toggle("on", settingsState.allowGlobalVocabulary);
  toggle.setAttribute("aria-pressed", String(settingsState.allowGlobalVocabulary));
  toggle.disabled = settingsState.loading;
}

function setSettingsPanelOpen(isOpen) {
  const overlay = document.getElementById("settings-overlay");
  const panel = document.getElementById("settings-panel");

  overlay.classList.toggle("open", isOpen);
  panel.classList.toggle("open", isOpen);

  overlay.setAttribute("aria-hidden", String(!isOpen));
  panel.setAttribute("aria-hidden", String(!isOpen));

  if (!isOpen) {
    setSettingsStatus("");
  }
}

async function getSettings() {
  return sendBackgroundMessage({ type: "GET_SETTINGS" });
}

async function updateSettings(payload) {
  return sendBackgroundMessage({
    type: "UPDATE_SETTINGS",
    payload,
  });
}

async function loadSettingsAndOpenPanel() {
  setSettingsPanelOpen(true);
  settingsState.loading = true;
  renderSettingsToggle();
  setSettingsStatus("Loading settings...");

  try {
    const data = await getSettings();

    if (!data?.success) {
      setSettingsStatus(data?.message || "Cannot load settings.", "error");
      return;
    }

    settingsState.allowGlobalVocabulary = Boolean(
      data.data?.settings?.allowGlobalVocabulary,
    );
    renderSettingsToggle();
    setSettingsStatus("");
  } catch {
    setSettingsStatus("Cannot load settings.", "error");
  } finally {
    settingsState.loading = false;
    renderSettingsToggle();
  }
}

async function handleToggleGlobalVocabulary(tabId) {
  if (settingsState.loading) return;

  settingsState.loading = true;
  const nextValue = !settingsState.allowGlobalVocabulary;
  settingsState.allowGlobalVocabulary = nextValue;
  renderSettingsToggle();
  setSettingsStatus("Saving settings...");

  try {
    const data = await updateSettings({
      allowGlobalVocabulary: nextValue,
    });

    if (!data?.success) {
      settingsState.allowGlobalVocabulary = !nextValue;
      renderSettingsToggle();
      setSettingsStatus(data?.message || "Cannot save settings.", "error");
      return;
    }

    setSettingsStatus("Saved.", "success");

    await sendBackgroundMessage({
      type: "REHIGHLIGHT_PAGE",
      payload: {
        tabId: tabId ?? null,
      },
    });

    setSettingsPanelOpen(false);
  } catch {
    settingsState.allowGlobalVocabulary = !nextValue;
    renderSettingsToggle();
    setSettingsStatus("Cannot save settings.", "error");
  } finally {
    settingsState.loading = false;
    renderSettingsToggle();
  }
}
/* ============================================================
   Doc Dictionary — Popup Script
   ============================================================
   Small UI that appears when clicking the extension icon.
   Shows: API connection status, word count for current page,
   page URL, and action buttons.
   ============================================================ */
async function init() {
  // 1. Show current page URL
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const pageUrl = tab?.url ?? "";
  document.getElementById("page-url").textContent = pageUrl;

  // 2. Health check — is the API reachable?
  const apiDot = document.getElementById("api-dot");
  const apiStatus = document.getElementById("api-status");
  const loginButton = document.getElementById("btn-login");

  function setLoggedOutState(message) {
    apiDot.classList.remove("ok");
    apiDot.classList.add("err");
    apiStatus.textContent = message;
    document.getElementById("word-count").textContent = "0";
    loginButton.style.display = "block";
  }

  function setLoggedInState(wordCount) {
    apiDot.classList.add("ok");
    apiDot.classList.remove("err");
    apiStatus.textContent = "API connected";
    document.getElementById("word-count").textContent = String(wordCount);
    loginButton.style.display = "none";
  }

  try {
    const hostname = pageUrl ? new URL(pageUrl).hostname : "";
    const data = await sendBackgroundMessage({
      type: "GET_VOCABULARIES",
      payload: {
        url: pageUrl,
        hostname,
      },
    });

    if (data.success) {
      const count = data.data?.vocabularies?.length ?? 0;
      setLoggedInState(count);
    } else if (data.status === "401") {
      setLoggedOutState("Please sign in to continue");
    } else {
      apiDot.classList.add("err");
      apiStatus.textContent = data.message || "API error";
    }
  } catch {
    apiDot.classList.add("err");
    apiStatus.textContent = "API unreachable";
  }

  loginButton.addEventListener("click", async () => {
    const response = await sendBackgroundMessage({
      type: "OPEN_LOGIN_PAGE",
      payload: {
        returnTo: pageUrl || WEB_APP_URL,
      },
    });

    if (response?.success) {
      window.location.reload();
    }
  });

  // 3. Dashboard button — opens the web app
  document.getElementById("btn-dashboard").addEventListener("click", () => {
    chrome.tabs.create({ url: "https://docu-vocab-kappa.vercel.app" });
  });

  // 4. Re-highlight — tells the content script to re-run highlighting
  document.getElementById("btn-refresh").addEventListener("click", async () => {
    if (tab?.id) {
      await chrome.tabs.sendMessage(tab.id, { type: "REHIGHLIGHT" });
      window.close();
    }
  });

  const settingsOverlay = document.getElementById("settings-overlay");
  const settingsPanel = document.getElementById("settings-panel");
  const settingsButton = document.getElementById("btn-settings");
  const closeSettingsButton = document.getElementById("btn-close-settings");
  const settingsToggle = document.getElementById("settings-global-toggle");

  settingsButton.addEventListener("click", () => {
    loadSettingsAndOpenPanel();
  });

  closeSettingsButton.addEventListener("click", () => {
    setSettingsPanelOpen(false);
  });

  settingsOverlay.addEventListener("click", () => {
    setSettingsPanelOpen(false);
  });

  settingsToggle.addEventListener("click", async () => {
    await handleToggleGlobalVocabulary(tab?.id);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && settingsPanel.classList.contains("open")) {
      setSettingsPanelOpen(false);
    }
  });
}

init();
