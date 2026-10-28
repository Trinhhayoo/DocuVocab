import type { Vocabulary } from "@/lib/vocabulary";

import { h, placeElementNear } from "./dom";
import styles from "./overlay.css?inline";

export type Overlay = Readonly<{
  host: HTMLElement;
  root: ShadowRoot;
  /** True when the event happened inside the extension UI. */
  owns(event: Event): boolean;
  showTooltip(vocabulary: Vocabulary, anchor: DOMRect): void;
  hideTooltip(): void;
  showSaveButton(anchor: DOMRect, onClick: () => void): void;
  hideSaveButton(): void;
  dispose(): void;
}>;


/** Mounts the extension UI in a closed shadow root, so page styles and scripts cannot reach into it. */
export function createOverlay(): Overlay {
  const host = h("div", { "data-docuvocab": "" });
  const root = host.attachShadow({ mode: "closed" });
  root.append(h("style", {}, styles));

  const tooltip = h("div", { class: "tooltip", role: "tooltip", hidden: "" });
  const saveButton = h("button", { type: "button", class: "save-button", hidden: "" }, "📖 Save word");
  root.append(tooltip, saveButton);
  document.documentElement.append(host);

  let onSaveClick: (() => void) | null = null;
  saveButton.addEventListener("click", () => onSaveClick?.());

  return {
    host,
    root,
    owns: (event) => event.composedPath().includes(host),
    showTooltip(vocabulary, anchor) {
      const example = vocabulary.exampleSentence;
      tooltip.replaceChildren(
        h(
          "div",
          {},
          h("div", { class: "tooltip-line tooltip-word" }, vocabulary.word),
          vocabulary.meaning && h("div", { class: "tooltip-line", lang: "vi" }, vocabulary.meaning),
          vocabulary.meaningEn && h("div", { class: "tooltip-line", lang: "en" }, vocabulary.meaningEn),
          vocabulary.note && h("div", { class: "tooltip-line", lang: "vi" }, `📝 ${vocabulary.note}`),
          example && h("div", { class: "tooltip-line" }, `💡 ${example}`),
        ),
      );
      tooltip.hidden = false;
      placeElementNear(tooltip, anchor);
    },
    hideTooltip() {
      tooltip.hidden = true;
    },
    showSaveButton(anchor, onClick) {
      onSaveClick = onClick;
      saveButton.hidden = false;
      placeElementNear(saveButton, anchor);
    },
    hideSaveButton() {
      saveButton.hidden = true;
      onSaveClick = null;
    },
    dispose() {
      host.remove();
    },
  };
}
