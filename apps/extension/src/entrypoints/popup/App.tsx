import { useCallback, useEffect, useState } from "react";
import { browser, type Browser } from "wxt/browser";

import { isUnauthorized, toUserMessage } from "@/lib/api-result";
import { API_ORIGIN } from "@/lib/config";
import { sendToBackground, sendToTab } from "@/lib/messages";
import type { Settings } from "@/lib/vocabulary";

import { SettingsPanel } from "./SettingsPanel";

type Session =
  | Readonly<{ kind: "loading" }>
  | Readonly<{ kind: "signedOut"; message: string }>
  | Readonly<{ kind: "error"; message: string }>
  | Readonly<{ kind: "signedIn"; settings: Settings; wordCount: number | null }>;

async function getActiveTab(): Promise<Browser.tabs.Tab | undefined> {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function loadSession(tabId: number | undefined): Promise<Session> {
  const result = await sendToBackground("GET_SETTINGS", null);

  if (!result.success) {
    return isUnauthorized(result)
      ? { kind: "signedOut", message: "Please sign in to continue." }
      : { kind: "error", message: toUserMessage(result) };
  }

  const stats = tabId === undefined ? null : await sendToTab(tabId, "GET_HIGHLIGHT_STATS");

  return {
    kind: "signedIn",
    settings: result.data.settings,
    wordCount: stats?.success ? stats.data.matchedWords : null,
  };
}

export function App() {
  const [tab, setTab] = useState<Browser.tabs.Tab>();
  const [session, setSession] = useState<Session>({ kind: "loading" });
  const [busyMessage, setBusyMessage] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const refresh = useCallback(async (activeTab: Browser.tabs.Tab | undefined) => {
    setSession(await loadSession(activeTab?.id));
  }, []);

  useEffect(() => {
    void getActiveTab().then((activeTab) => {
      setTab(activeTab);
      return refresh(activeTab);
    });
  }, [refresh]);

  async function handleLogin() {
    setBusyMessage("Signing you in with Google...");
    const result = await sendToBackground("LOGIN", { returnTo: tab?.url ?? API_ORIGIN });
    setBusyMessage(null);

    if (result.success) {
      await refresh(tab);
    } else {
      setSession({ kind: "signedOut", message: result.message });
    }
  }

  async function handleLogout() {
    setBusyMessage("Logging you out...");
    await sendToBackground("LOGOUT", null);
    setBusyMessage(null);
    setIsSettingsOpen(false);
    setSession({ kind: "signedOut", message: "You are logged out." });
  }

  async function handleRehighlight() {
    if (tab?.id === undefined) return;
    await sendToTab(tab.id, "REHIGHLIGHT");
    window.close();
  }

  async function handleSettingsSaved() {
    if (tab?.id !== undefined) await sendToTab(tab.id, "REHIGHLIGHT");
    setIsSettingsOpen(false);
    await refresh(tab);
  }

  const isBusy = busyMessage !== null;
  const statusText = busyMessage ?? describeSession(session);

  return (
    <div className="popup-shell">
      <header className="header">
        <h1>📖 Doc Dictionary</h1>
      </header>

      <div className="status-row" role="status">
        <span className={`status-dot ${session.kind === "signedIn" ? "ok" : session.kind === "loading" ? "" : "err"}`} />
        <span>{statusText}</span>
      </div>

      <div className="stat-box">
        <div className="stat-label">Words on this page</div>
        <div className="stat-value">{session.kind === "signedIn" ? (session.wordCount ?? "—") : "0"}</div>
      </div>

      <div className="page-url">{tab?.url}</div>

      <div className="actions">
        {session.kind === "signedOut" && (
          <button type="button" onClick={handleLogin} disabled={isBusy}>
            Login with Google
          </button>
        )}
        {session.kind === "signedIn" && (
          <button type="button" className="danger" onClick={handleLogout} disabled={isBusy}>
            Logout
          </button>
        )}
        <button type="button" className="primary" onClick={() => browser.tabs.create({ url: API_ORIGIN })}>
          Open Dashboard
        </button>
        <button type="button" onClick={handleRehighlight} disabled={isBusy || tab?.id === undefined}>
          ↻ Re-highlight this page
        </button>
        <button type="button" onClick={() => setIsSettingsOpen(true)} disabled={isBusy || session.kind !== "signedIn"}>
          ⚙ Settings
        </button>
      </div>

      {session.kind === "signedIn" && (
        <SettingsPanel
          isOpen={isSettingsOpen}
          settings={session.settings}
          onClose={() => setIsSettingsOpen(false)}
          onSaved={handleSettingsSaved}
        />
      )}
    </div>
  );
}

function describeSession(session: Session) {
  switch (session.kind) {
    case "loading":
      return "Checking your session...";
    case "signedIn":
      return "Connected to DocuVocab";
    case "signedOut":
    case "error":
      return session.message;
  }
}
