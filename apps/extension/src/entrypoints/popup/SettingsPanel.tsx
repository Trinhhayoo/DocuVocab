import { AI_MODELS, resolveAiModelId } from "@docuvocab/shared";
import { useEffect, useState } from "react";
import { browser } from "wxt/browser";

import { toUserMessage } from "@/lib/api-result";
import { API_ORIGIN } from "@/lib/config";
import { sendToBackground } from "@/lib/messages";
import type { Settings, UpdateSettingsInput } from "@/lib/vocabulary";

/** OpenRouter is connected on the web app, which opens its settings for this query parameter. */
const WEB_SETTINGS_URL = `${API_ORIGIN}/?settings=open`;

type SettingsPanelProps = Readonly<{
  isOpen: boolean;
  settings: Settings;
  onClose: () => void;
  onSaved: () => Promise<void>;
}>;

export function SettingsPanel({ isOpen, settings, onClose, onSaved }: SettingsPanelProps) {
  const [allowGlobal, setAllowGlobal] = useState(settings.allowGlobalVocabulary);
  const [aiModel, setAiModel] = useState(resolveAiModelId(settings.aiModel, settings.openRouterConnected));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  /** Saves one change; `revert` restores the control when the server rejects it. */
  async function save(input: UpdateSettingsInput, revert: () => void) {
    setIsSaving(true);
    setError(null);

    const result = await sendToBackground("UPDATE_SETTINGS", input);
    setIsSaving(false);

    if (!result.success) {
      revert();
      setError(toUserMessage(result));
      return;
    }

    await onSaved();
  }

  function handleToggle() {
    const next = !allowGlobal;
    setAllowGlobal(next);
    void save({ allowGlobalVocabulary: next }, () => setAllowGlobal(!next));
  }

  /** Connect opens an OpenRouter window; Chrome may close this popup meanwhile, and the background finishes. */
  async function handleOpenRouter() {
    setIsSaving(true);
    setError(null);

    const result = await sendToBackground(
      settings.openRouterConnected ? "DISCONNECT_OPENROUTER" : "CONNECT_OPENROUTER",
      null,
    );
    setIsSaving(false);

    if (!result.success) {
      setError(toUserMessage(result));
      return;
    }

    await onSaved();
  }

  function handleModelChange(next: string) {
    const previous = aiModel;
    setAiModel(next);
    void save({ aiModel: next }, () => setAiModel(previous));
  }

  return (
    <>
      <div className={`settings-overlay ${isOpen ? "open" : ""}`} aria-hidden="true" onClick={onClose} />
      <aside className={`settings-panel ${isOpen ? "open" : ""}`} aria-hidden={!isOpen} inert={!isOpen}>
        <div className="settings-header">
          <h2 className="settings-title">Settings</h2>
          <button type="button" className="settings-close" aria-label="Close settings" onClick={onClose}>
            ×
          </button>
        </div>

        <p className="settings-description">Configure global vocabulary behavior for highlighting.</p>

        <div className="settings-row">
          <div>
            <span className="settings-label" id="global-vocabulary-label">
              Enable Global Vocabulary
            </span>
            <p className="settings-hint">When enabled, highlight from all your saved words.</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={allowGlobal}
            aria-labelledby="global-vocabulary-label"
            className={`switch ${allowGlobal ? "on" : ""}`}
            disabled={isSaving}
            onClick={handleToggle}
          />
        </div>

        <div className="settings-row settings-row-stacked">
          <label className="settings-label" htmlFor="ai-model">
            AI model
          </label>
          <select
            id="ai-model"
            className="settings-select"
            value={aiModel}
            disabled={isSaving}
            onChange={(event) => handleModelChange(event.target.value)}
          >
            {AI_MODELS.map((model) => {
              const isLocked = model.requiresOwnKey && !settings.openRouterConnected;
              return (
                <option key={model.id} value={model.id} disabled={isLocked}>
                  {model.label}
                  {isLocked ? " (connect OpenRouter)" : ""}
                </option>
              );
            })}
          </select>
          <p className="settings-hint">
            {settings.openRouterConnected
              ? "OpenRouter connected: explanations are billed to your account."
              : "Connect your OpenRouter account to use any model."}
          </p>
          <button
            type="button"
            className={`settings-button ${settings.openRouterConnected ? "" : "primary"}`}
            disabled={isSaving}
            onClick={() => void handleOpenRouter()}
          >
            {settings.openRouterConnected ? "Disconnect OpenRouter" : "Connect OpenRouter"}
          </button>
          <button
            type="button"
            className="settings-link"
            onClick={() => browser.tabs.create({ url: WEB_SETTINGS_URL })}
          >
            Manage on the web app
          </button>
        </div>

        <p className={`settings-status ${error ? "error" : ""}`} aria-live="polite">
          {isSaving ? "Saving settings..." : error}
        </p>
      </aside>
    </>
  );
}
