import { describe, expect, it } from "vitest";

import { createCodeChallenge } from "@docuvocab/shared";

import {
  buildOpenRouterConnectUrl,
  settingsReturnPath,
  takePendingConnect,
} from "./openrouter-connect";

function memoryStorage(): Storage {
  const items = new Map<string, string>();
  return {
    get length() {
      return items.size;
    },
    clear: () => items.clear(),
    getItem: (key) => items.get(key) ?? null,
    key: (index) => [...items.keys()][index] ?? null,
    removeItem: (key) => void items.delete(key),
    setItem: (key, value) => void items.set(key, value),
  };
}

describe("buildOpenRouterConnectUrl", () => {
  it("points back to the callback page and keeps the verifier for it", async () => {
    const storage = memoryStorage();
    const url = new URL(await buildOpenRouterConnectUrl("https://app.test", "/docs/1", storage));

    expect(url.origin + url.pathname).toBe("https://openrouter.ai/auth");
    expect(url.searchParams.get("callback_url")).toBe(
      "https://app.test/settings/openrouter/callback",
    );
    expect(url.searchParams.get("code_challenge_method")).toBe("S256");

    const pending = takePendingConnect(url.searchParams.get("state"), storage);

    expect(pending?.returnTo).toBe("/docs/1");
    expect(await createCodeChallenge(pending!.codeVerifier)).toBe(
      url.searchParams.get("code_challenge"),
    );
  });
});

describe("takePendingConnect", () => {
  it("rejects a mismatched state and forgets the verifier either way", async () => {
    const storage = memoryStorage();
    const url = new URL(await buildOpenRouterConnectUrl("https://app.test", "/", storage));

    expect(takePendingConnect("forged", storage)).toBeNull();
    expect(takePendingConnect(url.searchParams.get("state"), storage)).toBeNull();
  });
});

describe("settingsReturnPath", () => {
  it.each([
    ["/docs/1?tab=a", "/docs/1?tab=a&settings=open"],
    ["https://evil.test/", "/?settings=open"],
  ])("maps %j to %j", (returnTo, expected) => {
    expect(settingsReturnPath(returnTo)).toBe(expected);
  });
});
