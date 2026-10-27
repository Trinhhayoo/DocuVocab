import { type ApiResult, isUnauthorized, toUserMessage } from "@/lib/api-result";
import type { Explanation, Vocabulary } from "@/lib/vocabulary";

import { h, placeNear } from "./dom";

export type PopoverValues = Readonly<{
  meaning: string;
  meaningEn: string;
  note: string;
  noteEn: string;
  exampleSentence: string;
}>;

export type PopoverOptions = Readonly<{
  word: string;
  sentence: string;
  anchor: DOMRect;
  saved: Vocabulary | undefined;
  explain(): Promise<ApiResult<Explanation>>;
  save(values: PopoverValues): Promise<ApiResult<{ vocabulary: Vocabulary }>>;
  login(): Promise<ApiResult<null>>;
  onSaved(vocabulary: Vocabulary): void;
}>;

const POPOVER_SIZE = { width: 360, height: 520 };
const CLOSE_AFTER_SAVE_MS = 800;

type FieldName = keyof PopoverValues;

const FIELDS: ReadonlyArray<{ name: FieldName; label: string; lang?: string; multiline?: boolean }> = [
  { name: "meaning", label: "Meaning (Vietnamese)", lang: "vi" },
  { name: "meaningEn", label: "Meaning (English)", lang: "en" },
  { name: "note", label: "Explanation (Vietnamese)", lang: "vi", multiline: true },
  { name: "noteEn", label: "Explanation (English)", lang: "en", multiline: true },
  { name: "exampleSentence", label: "Example", multiline: true },
];

function fromExplanation(explanation: Explanation): PopoverValues {
  return {
    meaning: explanation.meaning,
    meaningEn: explanation.meaningEn,
    note: explanation.simpleExplanation,
    noteEn: explanation.simpleExplanationEn,
    exampleSentence: explanation.exampleSentence,
  };
}

function fromVocabulary(vocabulary: Vocabulary): PopoverValues {
  return {
    meaning: vocabulary.meaning ?? "",
    meaningEn: vocabulary.meaningEn ?? "",
    note: vocabulary.note ?? "",
    noteEn: vocabulary.noteEn ?? "",
    exampleSentence: vocabulary.exampleSentence ?? "",
  };
}

/** Opens the save dialog in `root`; returns a function that closes it. */
export function openPopover(root: ShadowRoot, options: PopoverOptions): () => void {
  const inputs = new Map<FieldName, HTMLInputElement | HTMLTextAreaElement>();
  const fieldElements = FIELDS.map(({ name, label, lang, multiline }) => {
    const id = `docuvocab-${name}`;
    const input = multiline ? h("textarea", { id, rows: "2" }) : h("input", { id, type: "text" });
    if (lang) input.lang = lang;
    inputs.set(name, input);
    return [h("label", { for: id }, label), input];
  }).flat();

  const explainStatus = h("div", { class: "popover-explain-status", role: "status" });
  const status = h("div", { class: "popover-status", "aria-live": "polite" });
  const closeButton = h("button", { type: "button", class: "popover-close", "aria-label": "Close" }, "×");
  const regenerateButton = h("button", { type: "button", class: "popover-regenerate" }, "✨ Regenerate");
  const submitButton = h("button", { type: "button", class: "popover-submit" }, "Save");

  const popover = h(
    "div",
    { class: "popover", role: "dialog", "aria-label": `Save ${options.word}` },
    h("div", { class: "popover-header" }, h("strong", {}, options.word), closeButton),
    options.sentence && h("div", { class: "popover-sentence" }, options.sentence),
    explainStatus,
    ...fieldElements,
    h("div", { class: "popover-actions" }, submitButton, regenerateButton),
    status,
  );

  const { left, top } = placeNear(options.anchor, POPOVER_SIZE);
  popover.style.left = `${left}px`;
  popover.style.top = `${top}px`;
  root.append(popover);

  let closeTimer: number | undefined;

  function close() {
    window.clearTimeout(closeTimer);
    popover.remove();
  }

  function setValues(values: PopoverValues) {
    for (const [name, input] of inputs) input.value = values[name];
  }

  function readValues(): PopoverValues {
    const value = (name: FieldName) => inputs.get(name)?.value.trim() ?? "";
    return {
      meaning: value("meaning"),
      meaningEn: value("meaningEn"),
      note: value("note"),
      noteEn: value("noteEn"),
      exampleSentence: value("exampleSentence"),
    };
  }

  function setBusy(isBusy: boolean) {
    for (const input of inputs.values()) input.disabled = isBusy;
    submitButton.disabled = isBusy;
    regenerateButton.disabled = isBusy;
  }

  function setStatus(message: string, tone: "success" | "error" | "neutral" = "neutral") {
    status.className = `popover-status ${tone === "neutral" ? "" : `status-${tone}`}`;
    status.replaceChildren(message);
  }

  function showSignIn(retry: () => Promise<void>) {
    const loginButton = h("button", { type: "button", class: "popover-login" }, "Login with Google");
    loginButton.addEventListener("click", async () => {
      loginButton.disabled = true;
      const result = await options.login();
      if (result.success) {
        setStatus("Signed in. You can save now.", "success");
        await retry();
      } else {
        loginButton.disabled = false;
        setStatus(result.message, "error");
      }
    });
    setStatus("🔒 Please sign in to continue.", "error");
    status.append(loginButton);
  }

  async function explain() {
    explainStatus.hidden = false;
    explainStatus.textContent = "✨ Generating explanation...";
    setBusy(true);

    const result = await options.explain();
    setBusy(false);

    if (result.success) {
      setValues(fromExplanation(result.data));
      explainStatus.hidden = true;
      return;
    }

    explainStatus.textContent = "Could not generate an explanation. Fill it in manually.";
    if (isUnauthorized(result)) showSignIn(explain);
  }

  async function save() {
    setBusy(true);
    setStatus("Saving...");

    const result = await options.save(readValues());
    setBusy(false);

    if (result.success) {
      setStatus("✓ Saved!", "success");
      options.onSaved(result.data.vocabulary);
      closeTimer = window.setTimeout(close, CLOSE_AFTER_SAVE_MS);
    } else if (isUnauthorized(result)) {
      showSignIn(save);
    } else {
      setStatus(toUserMessage(result), "error");
    }
  }

  closeButton.addEventListener("click", close);
  regenerateButton.addEventListener("click", () => void explain());
  submitButton.addEventListener("click", () => void save());
  popover.addEventListener("keydown", (event) => {
    if (event.key === "Escape") close();
  });

  if (options.saved) {
    setValues(fromVocabulary(options.saved));
    explainStatus.textContent = "This word is already saved.";
  } else {
    void explain();
  }

  // Focus the dialog itself: the fields may still be disabled while the explanation loads.
  popover.tabIndex = -1;
  popover.focus();
  return close;
}
