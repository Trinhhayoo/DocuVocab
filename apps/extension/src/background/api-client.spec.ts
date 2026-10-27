import { describe, expect, it, vi } from "vitest";

import { createApiClient, parseApiResponse } from "./api-client";
import type { AuthTokens, TokenStore } from "./token-store";

const ORIGIN = "https://app.test";

function memoryTokenStore(initial: AuthTokens | null): TokenStore & { current(): AuthTokens | null } {
  let tokens = initial;
  return {
    current: () => tokens,
    get: async () => tokens,
    set: async (next) => {
      tokens = next;
    },
    clear: async () => {
      tokens = null;
    },
  };
}

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

function authHeader(init: RequestInit | undefined) {
  return new Headers(init?.headers).get("Authorization");
}

const SESSION = { accessToken: "access-1", refreshToken: "refresh-1" };
const REFRESHED = { accessToken: "access-2", refreshToken: "refresh-2" };

describe("createApiClient", () => {
  it("returns 401 without calling the API when signed out", async () => {
    const fetchFn = vi.fn<typeof fetch>();
    const api = createApiClient({ origin: ORIGIN, tokens: memoryTokenStore(null), fetch: fetchFn });

    expect(await api.request("/api/x", {}, "fallback")).toMatchObject({ success: false, status: "401" });
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it("sends the access token and unwraps the data", async () => {
    const fetchFn = vi.fn<typeof fetch>().mockResolvedValue(json(200, { success: true, data: { value: 1 } }));
    const api = createApiClient({ origin: ORIGIN, tokens: memoryTokenStore(SESSION), fetch: fetchFn });

    expect(await api.request("/api/x", { method: "GET" }, "fallback")).toEqual({ success: true, data: { value: 1 } });
    expect(fetchFn).toHaveBeenCalledWith(`${ORIGIN}/api/x`, expect.anything());
    expect(authHeader(fetchFn.mock.calls[0]?.[1])).toBe("Bearer access-1");
  });

  it("refreshes once on 401 and retries with the new token", async () => {
    const tokens = memoryTokenStore(SESSION);
    const fetchFn = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(json(401, { success: false, status: "401", message: "Unauthorized" }))
      .mockResolvedValueOnce(json(200, { success: true, data: REFRESHED }))
      .mockResolvedValueOnce(json(200, { success: true, data: "ok" }));
    const api = createApiClient({ origin: ORIGIN, tokens, fetch: fetchFn });

    expect(await api.request("/api/x", {}, "fallback")).toEqual({ success: true, data: "ok" });
    expect(fetchFn.mock.calls[1]?.[0]).toBe(`${ORIGIN}/api/extension/auth/refresh`);
    expect(authHeader(fetchFn.mock.calls[2]?.[1])).toBe("Bearer access-2");
    expect(tokens.current()).toEqual(REFRESHED);
  });

  it("shares one refresh between concurrent 401s", async () => {
    const fetchFn = vi.fn<typeof fetch>(async (input) => {
      if (String(input).endsWith("/auth/refresh")) return json(200, { success: true, data: REFRESHED });
      return json(401, { success: false, status: "401", message: "Unauthorized" });
    });
    const api = createApiClient({ origin: ORIGIN, tokens: memoryTokenStore(SESSION), fetch: fetchFn });

    await Promise.all([api.request("/api/a", {}, "f"), api.request("/api/b", {}, "f")]);

    const refreshCalls = fetchFn.mock.calls.filter(([input]) => String(input).endsWith("/auth/refresh"));
    expect(refreshCalls).toHaveLength(1);
  });

  it("signs out when the refresh token is rejected", async () => {
    const tokens = memoryTokenStore(SESSION);
    const fetchFn = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(json(401, { success: false }))
      .mockResolvedValueOnce(json(401, { success: false, status: "401", message: "Session expired." }));
    const api = createApiClient({ origin: ORIGIN, tokens, fetch: fetchFn });

    expect(await api.request("/api/x", {}, "fallback")).toMatchObject({ success: false, status: "401" });
    expect(tokens.current()).toBeNull();
  });

  it("keeps the session when the refresh endpoint fails for another reason", async () => {
    const tokens = memoryTokenStore(SESSION);
    const fetchFn = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(json(401, { success: false }))
      .mockResolvedValueOnce(json(500, { success: false, status: "500", message: "Down" }));
    const api = createApiClient({ origin: ORIGIN, tokens, fetch: fetchFn });

    expect(await api.request("/api/x", {}, "fallback")).toMatchObject({ success: false, status: "401" });
    expect(tokens.current()).toEqual(SESSION);
  });

  it("reports a network error without throwing", async () => {
    const fetchFn = vi.fn<typeof fetch>().mockRejectedValue(new TypeError("Failed to fetch"));
    const api = createApiClient({ origin: ORIGIN, tokens: memoryTokenStore(SESSION), fetch: fetchFn });

    expect(await api.request("/api/x", {}, "fallback")).toMatchObject({ success: false, status: "500" });
  });
});

describe("parseApiResponse", () => {
  it("uses the fallback message for an HTML error page", async () => {
    const response = new Response("<!DOCTYPE html><html></html>", {
      status: 502,
      headers: { "content-type": "text/html" },
    });

    expect(await parseApiResponse(response, "Cannot save.")).toEqual({
      success: false,
      status: "502",
      message: "Cannot save.",
    });
  });

  it("keeps the API's status and message on failure", async () => {
    const response = json(409, { success: false, status: "409", message: "Already saved." });

    expect(await parseApiResponse(response, "fallback")).toEqual({
      success: false,
      status: "409",
      message: "Already saved.",
    });
  });

  it("uses the HTTP status when the body omits it", async () => {
    expect(await parseApiResponse(json(400, { success: false, message: "Bad" }), "fallback")).toEqual({
      success: false,
      status: "400",
      message: "Bad",
    });
  });
});
