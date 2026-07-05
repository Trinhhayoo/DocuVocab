/* ============================================================
   Doc Dictionary — Popup Script
   ============================================================
   Small UI that appears when clicking the extension icon.
   Shows: API connection status, word count for current page,
   page URL, and action buttons.
   ============================================================ */

const API_BASE = "http://localhost:3000/api/extension";

async function init() {
  // 1. Show current page URL
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const pageUrl = tab?.url ?? "";
  document.getElementById("page-url").textContent = pageUrl;

  // 2. Health check — is the API reachable?
  const apiDot = document.getElementById("api-dot");
  const apiStatus = document.getElementById("api-status");

  try {
    const hostname = pageUrl ? new URL(pageUrl).hostname : "";
    const params = new URLSearchParams({ url: pageUrl, hostname });
    const res = await fetch(`${API_BASE}/vocabularies?${params}`);
    const data = await res.json();

    if (data.success) {
      apiDot.classList.add("ok");
      apiStatus.textContent = "API connected";

      // Show word count
      const count = data.data?.vocabularies?.length ?? 0;
      document.getElementById("word-count").textContent = String(count);
    } else {
      apiDot.classList.add("err");
      apiStatus.textContent = "API error";
    }
  } catch {
    apiDot.classList.add("err");
    apiStatus.textContent = "API unreachable";
  }

  // 3. Dashboard button — opens the web app
  document.getElementById("btn-dashboard").addEventListener("click", () => {
    chrome.tabs.create({ url: "http://localhost:3000" });
  });

  // 4. Re-highlight — tells the content script to re-run highlighting
  document.getElementById("btn-refresh").addEventListener("click", async () => {
    if (tab?.id) {
      await chrome.tabs.sendMessage(tab.id, { type: "REHIGHLIGHT" });
      window.close();
    }
  });
}

init();
