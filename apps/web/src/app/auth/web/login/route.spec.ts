import { afterEach, describe, expect, it, vi } from "vitest";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { GET } from "./route";

vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`redirect:${url}`);
  }),
}));

function mockSignIn() {
  const signInWithOAuth = vi.fn().mockResolvedValue({ data: { url: "https://accounts.example/oauth" }, error: null });
  vi.mocked(createSupabaseServerClient).mockResolvedValue({ auth: { signInWithOAuth } } as never);
  return signInWithOAuth;
}

async function callbackFor(origin: string, next?: string) {
  const signInWithOAuth = mockSignIn();
  const url = new URL("/auth/web/login", origin);
  if (next !== undefined) url.searchParams.set("next", next);

  await expect(GET(new Request(url))).rejects.toThrow("redirect:https://accounts.example/oauth");
  return new URL(signInWithOAuth.mock.calls[0]?.[0].options.redirectTo);
}

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});

describe("GET /auth/web/login", () => {
  it.each(["http://localhost:3000", "https://docu-vocab-git-feature.vercel.app"])(
    "sends the OAuth callback to the host serving the request (%s)",
    async (origin) => {
      vi.stubEnv("NEXT_PUBLIC_APP_URL", "");

      const callback = await callbackFor(origin, "/docs/42");

      expect(callback.origin).toBe(origin);
      expect(callback.pathname).toBe("/auth/web/callback");
      expect(callback.searchParams.get("next")).toBe("/docs/42");
    },
  );

  it.each(["https://evil.com", "//evil.com", undefined])("replaces an unsafe or missing next (%s) with /", async (next) => {
    const callback = await callbackFor("http://localhost:3000", next);

    expect(callback.searchParams.get("next")).toBe("/");
  });
});
