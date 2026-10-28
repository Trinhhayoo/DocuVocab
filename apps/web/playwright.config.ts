import { defineConfig, devices } from "@playwright/test";

import { E2E_BASE_URL, E2E_PORT, STORAGE_STATE_PATH } from "./e2e/support/fixtures";
import { appEnv, readLocalSupabase } from "./e2e/support/local-supabase";

const isCI = Boolean(process.env.CI);

export default defineConfig({
  testDir: "./e2e",
  // Tests share one seeded user, and some of them save vocabulary.
  workers: 1,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  reporter: isCI ? [["github"], ["html", { open: "never" }]] : "list",
  globalSetup: "./e2e/global-setup.ts",
  use: {
    baseURL: E2E_BASE_URL,
    storageState: STORAGE_STATE_PATH,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"] },
      testIgnore: [/\.(mobile|dark)\.spec\.ts$/, /extension\//],
    },
    {
      name: "mobile",
      use: { ...devices["Desktop Chrome"], viewport: { width: 375, height: 812 } },
      testMatch: /\.mobile\.spec\.ts$/,
    },
    {
      name: "dark",
      use: { ...devices["Desktop Chrome"], colorScheme: "dark" },
      testMatch: /\.dark\.spec\.ts$/,
    },
    {
      // Launches its own Chromium with the extension loaded (e2e/support/extension.ts).
      name: "extension",
      testMatch: /extension\/.*\.spec\.ts$/,
    },
  ],
  webServer: {
    // NEXT_PUBLIC_* values are inlined at build time, so the app is built against local Supabase.
    command: `pnpm exec next build && pnpm exec next start -p ${E2E_PORT}`,
    url: E2E_BASE_URL,
    reuseExistingServer: !isCI,
    timeout: 240_000,
    env: appEnv(readLocalSupabase()),
  },
});
