import { describe, expect, it, vi } from "vitest";

import { type ApiResult, fail, ok } from "@/lib/api-result";

import type { ApiClient } from "./api-client";
import { logout, parseAuthCallback } from "./auth";
import type { TokenStore } from "./token-store";

/** `request` is generic, so a fixed-result mock needs a cast; logout never reads the data. */
function fakeApi(request: () => Promise<ApiResult<null>>) {
  const mock = vi.fn(request);
  return { api: { request: mock as unknown as ApiClient["request"] } satisfies ApiClient, request: mock };
}

function fakeTokens() {
  return { get: vi.fn(), set: vi.fn(), clear: vi.fn().mockResolvedValue(undefined) } satisfies TokenStore;
}

describe("logout", () => {
  it.each([
    ["the server revokes the session", ok(null)],
    ["revoking fails", fail(500, "Cannot reach DocuVocab.")],
  ])("clears the local tokens when %s", async (_, revokeResult) => {
    const { api, request } = fakeApi(async () => revokeResult);
    const tokens = fakeTokens();

    expect(await logout(api, tokens)).toEqual(ok(null));
    expect(request).toHaveBeenCalledWith("/api/extension/auth/logout", { method: "POST" }, expect.any(String));
    expect(tokens.clear).toHaveBeenCalledOnce();
  });

  it("revokes on the server before clearing locally", async () => {
    const calls: string[] = [];
    const { api } = fakeApi(async () => {
      calls.push("revoke");
      return ok(null);
    });
    const tokens = { ...fakeTokens(), clear: vi.fn(async () => void calls.push("clear")) };

    await logout(api, tokens);

    expect(calls).toEqual(["revoke", "clear"]);
  });
});

const REDIRECT = "https://abcdefghijklmnopabcdefghijklmnop.chromiumapp.org/";

describe("parseAuthCallback", () => {
  it("reads both tokens", () => {
    expect(parseAuthCallback(`${REDIRECT}?access_token=a&refresh_token=r&next=%2F`)).toEqual({
      accessToken: "a",
      refreshToken: "r",
    });
  });

  it.each([
    ["no tokens", REDIRECT],
    ["only the access token", `${REDIRECT}?access_token=a`],
    ["an empty refresh token", `${REDIRECT}?access_token=a&refresh_token=`],
    ["an invalid URL", "not a url"],
  ])("returns null for %s", (_, url) => {
    expect(parseAuthCallback(url)).toBeNull();
  });
});
