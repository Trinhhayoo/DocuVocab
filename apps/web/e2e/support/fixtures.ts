import { readFileSync } from "node:fs";
import path from "node:path";

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
