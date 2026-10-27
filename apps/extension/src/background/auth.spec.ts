import { describe, expect, it } from "vitest";

import { parseAuthCallback } from "./auth";

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
