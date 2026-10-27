import { defineConfig } from "wxt";

const PRODUCTION_ORIGIN = "https://docu-vocab-kappa.vercel.app";
const DEVELOPMENT_ORIGIN = "http://localhost:3000";

export default defineConfig({
  srcDir: "src",
  modules: ["@wxt-dev/module-react"],
  imports: false,
  manifest: ({ mode, browser }) => ({
    name: "Doc Dictionary",
    description: "Highlight saved vocabulary on any webpage. Select text to save new words.",
    permissions: ["storage", "identity"],
    host_permissions: [
      `${PRODUCTION_ORIGIN}/*`,
      ...(mode === "development" ? [`${DEVELOPMENT_ORIGIN}/*`] : []),
    ],
    icons: { 48: "icon/48.png" },
    ...(browser === "firefox" && {
      browser_specific_settings: {
        gecko: {
          id: "doc-dictionary@docuvocab",
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
