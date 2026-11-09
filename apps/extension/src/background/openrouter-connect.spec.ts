import { createCodeChallenge } from "@docuvocab/shared";
import { describe, expect, it, vi } from "vitest";

import { ok } from "@/lib/api-result";

import type { ApiClient } from "./api-client";
import { connectOpenRouter, disconnectOpenRouter, parseOpenRouterCallback } from "./openrouter-connect";

const REDIRECT = "https://extension-id.chromiumapp.org/openrouter";
const SETTINGS = { allowGlobalVocabulary: false, aiModel: null, openRouterConnected: true };

function fakeApi() {
  const request = vi.fn().mockResolvedValue(ok({ settings: SETTINGS }));
  return { api: { request: request as unknown as ApiClient["request"] } satisfies ApiClient, request };
}

/** Plays OpenRouter: approves and redirects back with a code and the `state` it was given. */
function fakeIdentity(respond: (authUrl: URL) => string | Promise<string>) {
  return {
    getRedirectURL: vi.fn(() => REDIRECT),
    launchWebAuthFlow: vi.fn(async ({ url }: { url: string }) => respond(new URL(url))),
  };
}

describe("parseOpenRouterCallback", () => {
  it.each([
    [`${REDIRECT}?code=abc&state=s1`, "abc"],
    [`${REDIRECT}?code=abc&state=forged`, null],
    [`${REDIRECT}?state=s1`, null],
    ["not a url", null],
  ])("reads %j", (callbackUrl, expected) => {
    expect(parseOpenRouterCallback(callbackUrl, "s1")).toBe(expected);
  });
});

describe("connectOpenRouter", () => {
  it("sends the code and the verifier that matches the challenge to the server", async () => {
    const { api, request } = fakeApi();
    let challenge = "";
    const identity = fakeIdentity((authUrl) => {
      challenge = authUrl.searchParams.get("code_challenge") ?? "";
      expect(authUrl.searchParams.get("callback_url")).toBe(REDIRECT);
      return `${REDIRECT}?code=fake-code&state=${authUrl.searchParams.get("state")}`;
    });

    expect(await connectOpenRouter(api, identity)).toEqual(ok({ settings: SETTINGS }));
    expect(identity.getRedirectURL).toHaveBeenCalledWith("openrouter");

    const [path, init] = request.mock.calls[0] ?? [];
    const body = JSON.parse(String(init?.body));

    expect(path).toBe("/api/extension/settings/openrouter");
    expect(init?.method).toBe("POST");
    expect(body.code).toBe("fake-code");
    expect(await createCodeChallenge(body.codeVerifier)).toBe(challenge);
  });

  it("refuses a callback with another state and never calls the server", async () => {
    const { api, request } = fakeApi();
    const identity = fakeIdentity(() => `${REDIRECT}?code=stolen&state=forged`);

    const result = await connectOpenRouter(api, identity);

    expect(result.success).toBe(false);
    expect(request).not.toHaveBeenCalled();
  });

  it("reports a closed auth window", async () => {
    const { api, request } = fakeApi();
    const identity = fakeIdentity(() => Promise.reject(new Error("The user did not approve access.")));

    expect(await connectOpenRouter(api, identity)).toEqual({
      success: false,
      status: "400",
      message: "The user did not approve access.",
    });
    expect(request).not.toHaveBeenCalled();
  });
});

describe("disconnectOpenRouter", () => {
  it("asks the server to forget the key", async () => {
    const { api, request } = fakeApi();

    await disconnectOpenRouter(api);

    expect(request).toHaveBeenCalledWith(
      "/api/extension/settings/openrouter",
      { method: "DELETE" },
      expect.any(String),
    );
  });
});
