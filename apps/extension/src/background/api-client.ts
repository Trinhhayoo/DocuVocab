import { type ApiResult, fail, ok } from "@/lib/api-result";

import type { AuthTokens, TokenStore } from "./token-store";

type ApiClientDeps = Readonly<{
  origin: string;
  tokens: TokenStore;
  fetch?: typeof fetch;
}>;

export type ApiClient = Readonly<{
  /** Sends an authenticated request, refreshing the session once on 401. */
  request<T>(path: string, init: RequestInit, fallbackMessage: string): Promise<ApiResult<T>>;
}>;

const UNAUTHORIZED = fail(401, "Please sign in to continue.");
const OFFLINE_MESSAGE = "Cannot reach DocuVocab. Check your connection and try again.";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/** Reads the `{ success, status, message, data }` envelope, falling back when the body is not that JSON. */
export async function parseApiResponse<T>(response: Response, fallbackMessage: string): Promise<ApiResult<T>> {
  const isJson = response.headers.get("content-type")?.includes("application/json") ?? false;
  const body: unknown = isJson ? await response.json().catch(() => null) : null;

  if (!isRecord(body) || typeof body.success !== "boolean") {
    return fail(response.status || 500, fallbackMessage);
  }

  if (body.success && response.ok) {
    return ok(body.data as T);
  }

  return fail(
    typeof body.status === "string" ? body.status : response.status,
    typeof body.message === "string" ? body.message : fallbackMessage,
  );
}

function withBearer(init: RequestInit, accessToken: string): RequestInit {
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${accessToken}`);
  return { ...init, headers };
}

export function createApiClient({ origin, tokens, fetch: fetchFn = fetch }: ApiClientDeps): ApiClient {
  let pendingRefresh: Promise<string | null> | null = null;

  async function refreshSession(refreshToken: string): Promise<string | null> {
    const response = await fetchFn(`${origin}/api/extension/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    const result = await parseApiResponse<AuthTokens>(response, "Session expired.");

    if (!result.success) {
      // Only a rejected refresh token ends the session; a server error keeps it for the next try.
      if (response.status === 401) await tokens.clear();
      return null;
    }

    await tokens.set(result.data);
    return result.data.accessToken;
  }

  /** Concurrent 401s share one refresh, because Supabase rotates the refresh token on use. */
  function refreshOnce(refreshToken: string) {
    pendingRefresh ??= refreshSession(refreshToken)
      .catch(() => null)
      .finally(() => {
        pendingRefresh = null;
      });
    return pendingRefresh;
  }

  return {
    async request<T>(path: string, init: RequestInit, fallbackMessage: string) {
      const session = await tokens.get();
      if (!session) return UNAUTHORIZED;

      try {
        let response = await fetchFn(`${origin}${path}`, withBearer(init, session.accessToken));

        if (response.status === 401) {
          const accessToken = await refreshOnce(session.refreshToken);
          if (!accessToken) return UNAUTHORIZED;
          response = await fetchFn(`${origin}${path}`, withBearer(init, accessToken));
        }

        return await parseApiResponse<T>(response, fallbackMessage);
      } catch {
        return fail(500, OFFLINE_MESSAGE);
      }
    },
  };
}
