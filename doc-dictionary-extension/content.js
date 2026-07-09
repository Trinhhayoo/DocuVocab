/* ============================================================
   Doc Dictionary — Content Script
   ============================================================
   Injected into every page. Responsibilities:
   1. Fetch saved vocabularies for the current URL from the API.
   2. Walk the live DOM and wrap matching words in <mark> elements.
   3. Listen for text selection → show a floating "Save" button.
   4. Observe DOM mutations & SPA navigations → re-highlight.
   ============================================================ */

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
/**
 * Tags whose text nodes must NOT be highlighted.
 * Modifying these could break interactive elements or code blocks.
 */
const SKIP_TAGS = new Set([
  "SCRIPT",
  "STYLE",
  "PRE",
  "CODE",
  "A",
  "BUTTON",
  "INPUT",
  "TEXTAREA",
  "SELECT",
  "MARK",
  "SVG",
  "CANVAS",
  "VIDEO",
  "AUDIO",
  "IFRAME",
]);

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

/** Vocabulary items fetched from API for the current page. */
let vocabularies = [];

/** Compiled regex built from saved words. `null` when no words loaded. */
let vocabRegex = null;

/** Lookup map: lowercased word → vocabulary id. */
const vocabIdByWord = new Map();

/** The floating save button element (created once, reused). */
let saveButton = null;

/** Last URL we fetched vocabularies for (SPA detection). */
let lastUrl = location.href;

// ---------------------------------------------------------------------------
// 1. Highlighting — live DOM text-node replacement
// ---------------------------------------------------------------------------

/**
 * Builds a single regex that matches any saved word.
 * Words are sorted longest-first so "machine learning" matches
 * before "machine" alone.
 */
function buildRegex(words) {
  const escaped = words
    .map((w) => w.trim())
    .filter(Boolean)
    .sort((a, b) => b.length - a.length)
    .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));

  if (escaped.length === 0) return null;
  return new RegExp(`\\b(${escaped.join("|")})\\b`, "gi");
}

/**
 * Should we skip highlighting inside this text node?
 * Walks up the ancestor chain checking against SKIP_TAGS.
 */
function shouldSkip(node) {
  let el = node.parentElement;
  while (el) {
    if (SKIP_TAGS.has(el.tagName)) return true;
    el = el.parentElement;
  }
  return false;
}

/**
 * Core algorithm — TreeWalker-based text-node replacement.
 *
 * Why TreeWalker instead of innerHTML?
 *   • innerHTML serializes + re-parses the entire subtree.
 *   • That destroys event listeners, breaks React/Vue hydration,
 *     kills iframes, and invalidates references held by the page's JS.
 *   • TreeWalker visits only TEXT nodes — no serialization, no re-parse.
 *     We replace individual text nodes with a DocumentFragment containing
 *     text + <mark> nodes. The rest of the DOM is untouched.
 *
 * Performance considerations:
 *   • We collect all text nodes first, THEN mutate. Mutating during
 *     traversal would invalidate the walker's position.
 *   • The regex uses word boundaries (\b) so we don't need to
 *     manually check for partial matches.
 *   • Nodes inside SKIP_TAGS are rejected by the filter function,
 *     so the walker never descends into them (FILTER_REJECT).
 */
function highlightTextNodes(root = document.body) {
  if (!vocabRegex) return;

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (shouldSkip(node)) return NodeFilter.FILTER_REJECT;
      if (!node.textContent?.trim()) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  // Collect first, mutate later — avoids invalidating walker position.
  const textNodes = [];
  while (walker.nextNode()) textNodes.push(walker.currentNode);

  for (const textNode of textNodes) {
    const text = textNode.textContent ?? "";
    vocabRegex.lastIndex = 0;
    if (!vocabRegex.test(text)) continue;
    vocabRegex.lastIndex = 0;

    const fragment = document.createDocumentFragment();
    let lastIndex = 0;

    for (const match of text.matchAll(vocabRegex)) {
      const matchedText = match[0];
      const matchIndex = match.index ?? 0;

      // Text before this match
      if (matchIndex > lastIndex) {
        fragment.append(
          document.createTextNode(text.slice(lastIndex, matchIndex)),
        );
      }

      // <mark> element wrapping the matched word
      const mark = document.createElement("mark");
      mark.className = "dd-vocab-highlight";
      mark.textContent = matchedText;

      const vocabId = vocabIdByWord.get(matchedText.toLowerCase().trim());
      if (vocabId) mark.dataset.vocabId = vocabId;

      // Hover tooltip: show meaning on mouseover
      mark.addEventListener("mouseenter", showTooltip);
      mark.addEventListener("mouseleave", hideTooltip);

      fragment.append(mark);
      lastIndex = matchIndex + matchedText.length;
    }

    // Remaining text after last match
    if (lastIndex < text.length) {
      fragment.append(document.createTextNode(text.slice(lastIndex)));
    }

    textNode.replaceWith(fragment);
  }
}

/** Remove all existing highlights (before re-highlighting). */
function clearHighlights() {
  document.querySelectorAll("mark.dd-vocab-highlight").forEach((mark) => {
    const parent = mark.parentNode;
    if (!parent) return;
    // Replace the <mark> with its text content
    parent.replaceChild(document.createTextNode(mark.textContent ?? ""), mark);
    parent.normalize(); // merge adjacent text nodes
  });
}

// ---------------------------------------------------------------------------
// 2. Tooltip — shows meaning/note on hover
// ---------------------------------------------------------------------------

let tooltip = null;

function ensureTooltip() {
  if (tooltip) return tooltip;
  tooltip = document.createElement("div");
  tooltip.className = "dd-vocab-tooltip";
  tooltip.style.display = "none";
  document.body.appendChild(tooltip);
  return tooltip;
}

function showTooltip(event) {
  const mark = event.currentTarget;
  const vocabId = mark.dataset.vocabId;
  const vocab = vocabularies.find((v) => v.id === vocabId);
  if (!vocab) return;

  const tip = ensureTooltip();
  const parts = [];
  if (vocab.meaning) parts.push(vocab.meaning);
  if (vocab.note) parts.push(`📝 ${vocab.note}`);
  if (parts.length === 0) parts.push("(no meaning saved)");

  tip.innerHTML = parts.map((p) => `<div>${escapeHtml(p)}</div>`).join("");

  const rect = mark.getBoundingClientRect();
  tip.style.display = "block";
  tip.style.left = `${rect.left + window.scrollX}px`;
  tip.style.top = `${rect.bottom + window.scrollY + 4}px`;
}

function hideTooltip() {
  if (tooltip) tooltip.style.display = "none";
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// ---------------------------------------------------------------------------
// 3. Text selection → floating "Save" button
// ---------------------------------------------------------------------------

/**
 * When the user selects text, we show a small floating button near the
 * selection. Clicking it opens a save popup (via message to background).
 *
 * How selection context is captured:
 *   • `window.getSelection()` gives us the selected text.
 *   • To find the surrounding sentence, we walk outward from the
 *     anchor/focus nodes until we hit sentence-ending punctuation
 *     or a block boundary.
 */
function initSelectionListener() {
  document.addEventListener("mouseup", (event) => {
    // Small delay to let the selection finalize
    setTimeout(() => handleSelection(event), 10);
  });

  document.addEventListener("mousedown", (event) => {
    // Hide save button if clicking outside of it
    if (saveButton && !saveButton.contains(event.target)) {
      hideSaveButton();
    }
  });
}

function handleSelection(event) {
  const selection = window.getSelection();
  const selectedText = selection?.toString().trim();
  if (!selectedText || selectedText.length === 0 || selectedText.length > 100) {
    return;
  }

  // Don't show save button if selection is inside our own UI
  if (
    event.target.closest?.(".dd-save-button, .dd-vocab-tooltip, .dd-save-popup")
  ) {
    return;
  }

  const sentence = extractSentence(selection);
  showSaveButton(event.clientX, event.clientY, selectedText, sentence);
}

/**
 * Extracts the sentence surrounding the selection.
 *
 * Strategy: get the text content of the selection's anchor node's parent,
 * find the selected text within it, then expand outward to the nearest
 * sentence boundaries (. ! ? or block edge).
 */
function extractSentence(selection) {
  const anchorNode = selection.anchorNode;
  if (!anchorNode) return "";

  // Get the closest block-level parent's text
  const blockParent =
    anchorNode.nodeType === Node.TEXT_NODE
      ? anchorNode.parentElement
      : anchorNode;

  const fullText = blockParent?.textContent ?? "";
  const selected = selection.toString().trim();
  const idx = fullText.indexOf(selected);
  if (idx === -1) return fullText.slice(0, 200);

  // Walk backward to sentence start
  let start = idx;
  while (start > 0 && !/[.!?]/.test(fullText[start - 1])) start--;
  if (start > 0 && /[.!?]/.test(fullText[start - 1])) start++; // skip the punctuation

  // Walk forward to sentence end
  let end = idx + selected.length;
  while (end < fullText.length && !/[.!?]/.test(fullText[end])) end++;
  if (end < fullText.length) end++; // include the punctuation

  return fullText.slice(start, end).trim().slice(0, 500);
}

function showSaveButton(x, y, selectedText, sentence) {
  if (!saveButton) {
    saveButton = document.createElement("div");
    saveButton.className = "dd-save-button";
    saveButton.textContent = "📖 Save word";
    document.body.appendChild(saveButton);
  }

  saveButton.style.display = "block";
  saveButton.style.left = `${x + window.scrollX + 8}px`;
  saveButton.style.top = `${y + window.scrollY - 36}px`;

  // Remove old listener, attach new one
  const newButton = saveButton.cloneNode(true);
  saveButton.replaceWith(newButton);
  saveButton = newButton;

  saveButton.addEventListener("click", () => {
    hideSaveButton();
    showSavePopup(selectedText, sentence);
  });
}

function hideSaveButton() {
  if (saveButton) saveButton.style.display = "none";
}

// ---------------------------------------------------------------------------
// 4. Save popup — inline form for adding meaning/note
// ---------------------------------------------------------------------------

function showSavePopup(word, sentence) {
  // Remove existing popup if any
  document.querySelector(".dd-save-popup")?.remove();

  const popup = document.createElement("div");
  popup.className = "dd-save-popup";
  popup.innerHTML = `
    <div class="dd-save-popup-header">
      <strong>${escapeHtml(word)}</strong>
      <button class="dd-save-popup-close">&times;</button>
    </div>
    <div class="dd-save-popup-sentence">${escapeHtml(sentence)}</div>
    <div class="dd-save-popup-explain-status">✨ Generating explanation...</div>
    <label>Meaning Language</label>
    <select class="dd-save-popup-language">
    <option value="English">English</option>
    <option value="Vietnamese">Vietnamese</option>
    </select>
    <label>Meaning</label>
    <input type="text" class="dd-save-popup-meaning" placeholder="Generating..." disabled />
    <label>Note</label>
    <input type="text" class="dd-save-popup-note" placeholder="Generating..." disabled />
    <label>Example</label>
    <input type="text" class="dd-save-popup-example" placeholder="Generating..." disabled />
    <div class="dd-save-popup-actions">
      <button class="dd-save-popup-submit">Save</button>
      <button class="dd-save-popup-regenerate" title="Regenerate explanation">✨</button>
    </div>
    <div class="dd-save-popup-status"></div>
  `;

  document.body.appendChild(popup);

  // Position near center of viewport
  popup.style.position = "fixed";
  popup.style.top = "20%";
  popup.style.left = "50%";
  popup.style.transform = "translateX(-50%)";

  const meaningInput = popup.querySelector(".dd-save-popup-meaning");
  const noteInput = popup.querySelector(".dd-save-popup-note");
  const exampleInput = popup.querySelector(".dd-save-popup-example");
  const explainStatus = popup.querySelector(".dd-save-popup-explain-status");

  // Auto-explain via AI
  async function requestExplanation() {
    explainStatus.textContent = "✨ Generating explanation...";
    const languageSelect = popup.querySelector(".dd-save-popup-language");
    explainStatus.style.display = "block";
    meaningInput.disabled = true;
    noteInput.disabled = true;
    exampleInput.disabled = true;

    try {
      const response = await chrome.runtime.sendMessage({
        type: "EXPLAIN_VOCABULARY",
        payload: {
          text: word,
          sentence: sentence || undefined,
          sourceTitle: document.title,
          sourceUrl: location.href,
          meaningLanguage: languageSelect.value,
        },
      });

      if (response?.success && response.data) {
        meaningInput.value = response.data.meaning || "";
        noteInput.value = response.data.simpleExplanation || "";
        exampleInput.value = response.data.exampleSentence || "";
        explainStatus.style.display = "none";
      } else {
        explainStatus.textContent =
          "Could not generate explanation. Fill in manually.";
      }
    } catch {
      explainStatus.textContent =
        "Could not generate explanation. Fill in manually.";
    }

    meaningInput.disabled = false;
    noteInput.disabled = false;
    exampleInput.disabled = false;
  }

  const isExistingVocab = vocabularies.find(
    (v) => v.word.toLowerCase().trim() === word.toLowerCase().trim(),
  );
  if (isExistingVocab) {
    explainStatus.textContent = "This word is already saved.";
    meaningInput.value = isExistingVocab.meaning || "";
    noteInput.value = isExistingVocab.note || "";
    exampleInput.value = isExistingVocab.exampleSentence || "";
    meaningInput.disabled = false;
    noteInput.disabled = false;
    exampleInput.disabled = false;
  } else {
    requestExplanation();
  }

  // Close button
  popup.querySelector(".dd-save-popup-close").addEventListener("click", () => {
    popup.remove();
  });

  // Regenerate button
  popup
    .querySelector(".dd-save-popup-regenerate")
    .addEventListener("click", () => {
      requestExplanation();
    });

  // Submit
  popup
    .querySelector(".dd-save-popup-submit")
    .addEventListener("click", async () => {
      const meaning = meaningInput.value.trim();
      const note = noteInput.value.trim();
      const example = exampleInput.value.trim();
      const statusEl = popup.querySelector(".dd-save-popup-status");

      statusEl.textContent = "Saving...";

      try {
        const response = await chrome.runtime.sendMessage({
          type: "SAVE_VOCABULARY",
          payload: {
            word,
            meaning: meaning || undefined,
            note: note || undefined,
            originalSentence: sentence || undefined,
            exampleSentence: example || undefined,
            sourceUrl: location.href,
            sourceHostname: location.hostname,
            pageTitle: document.title,
          },
        });

        if (response?.success) {
          statusEl.textContent = "✓ Saved!";
          statusEl.classList.add("dd-status-success");

          // Add to local state and re-highlight immediately
          vocabularies.push(response.data.vocabulary);
          rebuildRegex();
          clearHighlights();
          highlightTextNodes();

          setTimeout(() => popup.remove(), 800);
        } else {
          
          if (response?.status === "401") {
            renderAuthError(statusEl);
            return;
          }

          statusEl.textContent = mapApiErrorToUserMessage(response);
          statusEl.classList.add("dd-status-error");
        }
      } catch (err) {
        statusEl.textContent = mapApiErrorToUserMessage({
          status: "500",
          message: "Cannot connect to DocuVocab. Please try again.",
        });
        statusEl.classList.add("dd-status-error");
      }
    });

  // Auto-focus meaning input
  popup.querySelector(".dd-save-popup-meaning").focus();
}

// ---------------------------------------------------------------------------
// 5. SPA navigation observer
// ---------------------------------------------------------------------------

/**
 * Detects SPA page transitions (URL change without full reload).
 *
 * Why we need this:
 *   SPAs (React Router, Next.js, Vue Router) change the visible page
 *   by updating the DOM and calling history.pushState / replaceState —
 *   no actual navigation event fires. Our content script loaded once
 *   at document_idle and won't re-run.
 *
 * Strategy:
 *   1. Poll `location.href` on a MutationObserver callback.
 *      MutationObserver fires when the SPA swaps page content,
 *      which usually coincides with a URL change.
 *   2. Also listen for `popstate` (back/forward button).
 *   3. When URL changes → clear highlights → re-fetch → re-highlight.
 *
 * The MutationObserver also catches dynamically loaded content
 * (lazy-loaded sections, infinite scroll) and highlights new text.
 */
function initSpaObserver() {
  // Observe DOM changes for two purposes:
  //   a) Detect URL changes (SPA navigation).
  //   b) Highlight text in newly added nodes.
  const observer = new MutationObserver((mutations) => {
    // Check for URL change
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      onPageChange();
      return;
    }

    // For added nodes, highlight only the new subtrees (efficient).
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          highlightTextNodes(node);
        }
      }
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Back/forward navigation
  window.addEventListener("popstate", () => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      onPageChange();
    }
  });
}

async function onPageChange() {
  clearHighlights();
  await fetchVocabularies();
  highlightTextNodes();
}

// ---------------------------------------------------------------------------
// 6. API communication (through background worker)
// ---------------------------------------------------------------------------

async function fetchVocabularies() {
  try {
    const response = await chrome.runtime.sendMessage({
      type: "GET_VOCABULARIES",
      payload: {
        url: location.href,
        hostname: location.hostname,
      },
    });

    if (response?.success) {
      vocabularies = response.data.vocabularies;
      rebuildRegex();
    }
  } catch (err) {
    console.warn("[Doc Dictionary] Failed to fetch vocabularies:", err.message);
  }
}

function rebuildRegex() {
  vocabIdByWord.clear();
  for (const v of vocabularies) {
    vocabIdByWord.set(v.word.toLowerCase().trim(), v.id);
  }
  vocabRegex = buildRegex(vocabularies.map((v) => v.word));
}

function renderAuthError(statusEl) {
  statusEl.classList.add("dd-status-error");
  statusEl.innerHTML = `
    <div>🔒 Please sign in to save vocabulary.</div>
    <button class="dd-login-button">Login with Google</button>
  `;
  console.log("renderAuthError called with statusEl:", statusEl);

  statusEl.querySelector(".dd-login-button").addEventListener("click", () => {
    console.log("Login button clicked");

    chrome.runtime.sendMessage(
      {
        type: "OPEN_LOGIN_PAGE",
        payload: {
          returnTo: location.href,
        },
      },
      (response) => {
        console.log("Background response:", response);
        console.log("Runtime error:", chrome.runtime.lastError);
      },
    );
  });
}

// ---------------------------------------------------------------------------
// 8. Init
// ---------------------------------------------------------------------------

/** Listen for messages from popup (e.g., re-highlight command). */
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "REHIGHLIGHT") {
    onPageChange().then(() => sendResponse({ success: true }));
    return true; // async response
  }
  if (message.type === "AUTH_LOGIN_SUCCESS") {
    const statusEl = document.querySelector(".dd-save-popup-status");

    if (statusEl) {
      statusEl.textContent = "✓ Signed in. You can save now.";
      statusEl.classList.remove("dd-status-error");
      statusEl.classList.add("dd-status-success");
    }

    sendResponse({ success: true });
    return true;
  }
});

async function init() {
  initSelectionListener();
  await fetchVocabularies();
  highlightTextNodes();
  initSpaObserver();
}

init();
