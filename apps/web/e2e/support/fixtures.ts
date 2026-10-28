import { readFileSync } from "node:fs";
import path from "node:path";

// Not 3000, so a running `pnpm dev` is not reused as the app under test. The extension's e2e build
// is allowed to call this origin (apps/extension/wxt.config.ts).
export const E2E_PORT = 3300;
export const E2E_BASE_URL = `http://localhost:${E2E_PORT}`;

/** Output of `wxt build --mode e2e`, which global setup runs. */
export const EXTENSION_DIR = path.resolve(__dirname, "../../../extension/.output/chrome-mv3-e2e");

export const AUTH_DIR = path.resolve(__dirname, "../.auth");
export const STORAGE_STATE_PATH = path.join(AUTH_DIR, "user.json");
export const FIXTURES_PATH = path.join(AUTH_DIR, "fixtures.json");

export const E2E_USER = { email: "e2e@docuvocab.test", password: "e2e-local-only-password" };

/** A document seeded by global setup, with one saved word at the start of a line. */
export const SEEDED_DOC = {
  title: "Designing idempotent APIs",
  sourceUrl: "https://example.com/e2e/idempotent-apis",
  savedWord: "idempotent",
  savedMeaning: "lũy đẳng",
  savedMeaningEn: "giving the same result when repeated",
  unsavedWord: "throughput",
} as const;

export type SeededIds = Readonly<{ userId: string; docId: string }>;

export function readSeededIds(): SeededIds {
  return JSON.parse(readFileSync(FIXTURES_PATH, "utf8"));
}
