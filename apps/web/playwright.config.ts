import { defineConfig, devices } from "@playwright/test";

import { STORAGE_STATE_PATH } from "./e2e/support/fixtures";
import { appEnv, readLocalSupabase } from "./e2e/support/local-supabase";

// Not 3000, so a running `pnpm dev` does not get reused as the app under test.
const PORT = 3300;
const BASE_URL = `http://localhost:${PORT}`;
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
    baseURL: BASE_URL,
    storageState: STORAGE_STATE_PATH,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"] },
      testIgnore: /\.(mobile|dark)\.spec\.ts$/,
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
  ],
  webServer: {
    // NEXT_PUBLIC_* values are inlined at build time, so the app is built against local Supabase.
    command: `pnpm exec next build && pnpm exec next start -p ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !isCI,
    timeout: 240_000,
    env: appEnv(readLocalSupabase(), BASE_URL),
  },
});
