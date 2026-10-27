# Doc Dictionary extension

Highlights your saved DocuVocab vocabulary on any web page, and lets you select a word or phrase to get a bilingual (Vietnamese and English) AI explanation and save it. The extension is built with [WXT](https://wxt.dev) and TypeScript, and targets Chrome, Edge, and Firefox 140 or later.

## Develop

Run these commands from the repository root:

1. Start the web app on `http://localhost:3000`: `pnpm dev`.
2. Start the extension: `pnpm --filter @docuvocab/extension dev` for Chrome, or `pnpm --filter @docuvocab/extension dev:firefox` for Firefox. WXT opens a browser with the extension loaded and reloads it on change.

Development builds call `http://localhost:3000`; production builds call `https://docu-vocab-kappa.vercel.app`. To point a build at another web app, set `WXT_API_ORIGIN`.

To load a production build by hand, run `pnpm --filter @docuvocab/extension build`, then:

- **Chrome or Edge:** open `chrome://extensions`, turn on **Developer mode**, select **Load unpacked**, and choose `apps/extension/.output/chrome-mv3`.
- **Firefox:** open `about:debugging#/runtime/this-firefox`, select **Load Temporary Add-on**, and choose `apps/extension/.output/firefox-mv2/manifest.json`.

`pnpm --filter @docuvocab/extension zip` produces store-ready archives in `.output/`.

## How it works

| Part | Location | Responsibility |
|------|----------|----------------|
| Background | `src/entrypoints/background.ts`, `src/background/` | Sends every API request under the extension origin, so a page's CSP cannot block it. Stores the session tokens and refreshes them once on a 401. Signs in with Google through `identity.launchWebAuthFlow`. |
| Content script | `src/entrypoints/content/`, `src/content/` | Highlights saved words with the CSS Custom Highlight API, so the page DOM is never modified. Shows the tooltip, the **Save word** button, and the save dialog inside a closed shadow root. Re-highlights new content and single-page-app navigations. |
| Popup | `src/entrypoints/popup/` | React UI for sign-in status, the page's word count, re-highlighting, and settings. |
| Shared | `packages/shared` | Word normalization, the vocabulary regex, and sentence extraction, also used by the web app. |

Messages between these parts are typed in `src/lib/messages.ts`.

## Limits

- Highlights are not focusable, because the CSS Custom Highlight API does not create elements. You can reach the details of a highlighted word with a pointer only.
- Safari is not supported yet: it has no `identity.launchWebAuthFlow`, which the sign-in flow depends on.
