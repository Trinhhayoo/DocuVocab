import { defineConfig } from "wxt";

const PRODUCTION_ORIGIN = "https://docu-vocab-kappa.vercel.app";
const DEVELOPMENT_ORIGIN = "http://localhost:3000";
// The web app under Playwright (apps/web/playwright.config.ts); built with `wxt build --mode e2e`.
const E2E_ORIGIN = "http://localhost:3300";

// The Chrome Web Store item's public key: unpacked builds get its ID, bpeoeihgcioncibdafpcpfnfcgijlacp.
// The web app allows sign-in redirects to that ID only (apps/web/src/lib/extension-redirect.ts).
const CHROME_PUBLIC_KEY =
  "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAlnzRAC7wV2mEcNf5UYbsAKqJ2w/Gv0itZX9KdA12qZOn7yiYV8+9t3JI9hDeEj93ElMMt5NVp0R2ZNl6q3YMxtbCWHGPao5os122LOX+rAfuQC6Pa9t4fGXKeOSeHWfhcX2hqdeoEKWkdLrc7086e7PxiBk8nU+oF8HZW6KwjYB+edBYQQNGyH3CUpdPLNBPp4+h9EAmBWNYHHkccBTb0oGu4Gm5xQvZjK912l7zCnpGYN/nxDbZWDakZP0J5O7YS3cNwNeDO4syQ7AsDkXYcut6j+Y+gRmgGHEypNJk+HRBOJl9y0f6pih6zh7tX/KX4Fc8NaXhcqNrBHlIPv+7qQIDAQAB";

// Must match FIREFOX_ADDON_ID in apps/web/src/lib/extension-redirect.ts.
const FIREFOX_ADDON_ID = "doc-dictionary@docuvocab";

export default defineConfig({
  srcDir: "src",
  modules: ["@wxt-dev/module-react"],
  imports: false,
  // WXT defaults to port 3000, which the web app needs; the extension calls it there in dev.
  dev: { server: { port: 3100 } },
  manifest: ({ mode, browser }) => ({
    name: "Doc Dictionary",
    description: "Highlight saved vocabulary on any webpage. Select text to save new words.",
    permissions: ["storage", "identity"],
    host_permissions: [
      `${PRODUCTION_ORIGIN}/*`,
      ...(mode === "development" ? [`${DEVELOPMENT_ORIGIN}/*`] : []),
      ...(mode === "e2e" ? [`${E2E_ORIGIN}/*`] : []),
    ],
    icons: { 48: "icon/48.png" },
    ...(browser !== "firefox" && { key: CHROME_PUBLIC_KEY }),
    ...(browser === "firefox" && {
      browser_specific_settings: {
        gecko: {
          id: FIREFOX_ADDON_ID,
          // 140 is the first release with the CSS Custom Highlight API.
          strict_min_version: "140.0",
          // Selected text and its sentence, the page URL, and the sign-in tokens leave the browser.
          data_collection_permissions: {
            required: ["authenticationInfo", "browsingActivity", "websiteContent"],
          },
        },
      },
    }),
  }),
});
