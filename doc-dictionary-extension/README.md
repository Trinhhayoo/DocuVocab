# Doc Dictionary — Chrome Extension

Browser extension that highlights saved vocabulary words on any webpage and lets you save new words by selecting text.

## Setup

1. Start the Next.js app: `pnpm dev` (runs on `http://localhost:3000`)
2. Open Chrome → `chrome://extensions`
3. Enable **Developer mode** (top right)
4. Click **Load unpacked** → select the `doc-dictionary-extension/` folder
5. The extension icon appears in the toolbar

### Icons

The extension ships with an SVG placeholder. To generate PNG icons:

```bash
# Using ImageMagick
convert icons/icon.svg -resize 16x16 icons/icon16.png
convert icons/icon.svg -resize 48x48 icons/icon48.png
convert icons/icon.svg -resize 128x128 icons/icon128.png
```

Or just remove the icon entries from `manifest.json` — Chrome will use a default icon.

## How it works

### Content Script (`content.js`)
Injected into every page. Fetches saved vocabularies from the API, walks the DOM with `TreeWalker`, and wraps matching words in `<mark>` elements. Also listens for text selection to show a floating "Save" button.

### Background Worker (`background.js`)
Relays API requests from the content script (which can't make cross-origin calls due to CSP). Handles `GET_VOCABULARIES` and `SAVE_VOCABULARY` messages.

### Popup (`popup.html` + `popup.js`)
Small UI when clicking the extension icon. Shows API connection status, word count for the current page, and action buttons.

## Architecture

```
User selects text on any website
       │
       ▼
content.js detects selection
       │
       ▼
Shows floating "Save word" button
       │  (click)
       ▼
Shows inline save popup (meaning + note fields)
       │  (submit)
       ▼
Sends SAVE_VOCABULARY message ──► background.js
                                       │
                                       ▼
                                POST /api/extension/vocabularies
                                       │
                                       ▼
                                  Next.js API → Prisma → DB
                                       │
                                       ▼
                              Response back to content.js
                                       │
                                       ▼
                              Re-highlight page with new word
```
