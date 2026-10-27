import { useEffect, useState } from "react";

import { toUserMessage } from "@/lib/api-result";
import { sendToBackground } from "@/lib/messages";
import type { Settings } from "@/lib/vocabulary";

type SettingsPanelProps = Readonly<{
  isOpen: boolean;
  settings: Settings;
  onClose: () => void;
  onSaved: () => Promise<void>;
}>;

export function SettingsPanel({ isOpen, settings, onClose, onSaved }: SettingsPanelProps) {
  const [allowGlobal, setAllowGlobal] = useState(settings.allowGlobalVocabulary);
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

  async function handleToggle() {
    const next = !allowGlobal;
    setAllowGlobal(next);
    setIsSaving(true);
    setError(null);

    const result = await sendToBackground("UPDATE_SETTINGS", { allowGlobalVocabulary: next });
    setIsSaving(false);

    if (!result.success) {
      setAllowGlobal(!next);
      setError(toUserMessage(result));
      return;
    }

    await onSaved();
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

        <p className={`settings-status ${error ? "error" : ""}`} aria-live="polite">
          {isSaving ? "Saving settings..." : error}
        </p>
      </aside>
    </>
  );
}
