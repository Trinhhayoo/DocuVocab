import { defineConfig } from "wxt";

const PRODUCTION_ORIGIN = "https://docu-vocab-kappa.vercel.app";
const DEVELOPMENT_ORIGIN = "http://localhost:3000";

// Public key that fixes the Chrome extension ID to jgeelnjohablnhdioadaemkefnakdkph on every machine.
// The web app allows sign-in redirects to that ID only (apps/web/src/lib/extension-redirect.ts).
const CHROME_PUBLIC_KEY =
  "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA4bKfnc4caOLVqvv4KODGq5aawHehQ/wVlHI5v7OsAT4EiI0lRIUABXgY27FPsNYwfCLoH7Z9ilZYJFuy7bwL7+aY+8NPTIT5cfnetqq4Db5FS4w+3N9pWC9kvxMPF8bqrNgNYehCTG2/sOK578COwJKn9rIAUqf5yxkeWpSppLpYFwBgwkx10ZRC5eiAvG7mCb9uUDYlwPk2hYp32hCcAHEvDl0W9XGsWLEfWRQ8DY/KTPBViexMERAA7UY/cvAb1nTRIPKQfCRP8Xry7cwVdBCqq0AjoFYJmbMHEa7EF52uy/4bhtNItibWWvz53BWVhDWAKrPaOgcM+wlJjKbh6QIDAQAB";

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
