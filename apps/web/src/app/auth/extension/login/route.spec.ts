import { afterEach, describe, expect, it, vi } from "vitest";

import { CHROME_EXTENSION_ID } from "@/lib/extension-redirect";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { GET } from "./route";

vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`redirect:${url}`);
  }),
}));

const REDIRECT_URI = `https://${CHROME_EXTENSION_ID}.chromiumapp.org/`;

function mockSignIn() {
  const signInWithOAuth = vi.fn().mockResolvedValue({ data: { url: "https://accounts.example/oauth" }, error: null });
  vi.mocked(createSupabaseServerClient).mockResolvedValue({ auth: { signInWithOAuth } } as never);
  return signInWithOAuth;
}

function loginRequest(origin: string, redirectUri: string) {
  const url = new URL("/auth/extension/login", origin);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("next", "/docs");
  return new Request(url);
}

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});

describe("GET /auth/extension/login", () => {
  it.each(["http://localhost:3000", "https://docu-vocab-git-feature.vercel.app"])(
    "sends the OAuth callback to the host serving the request (%s)",
    async (origin) => {
      vi.stubEnv("NEXT_PUBLIC_APP_URL", "");
      const signInWithOAuth = mockSignIn();

      await expect(GET(loginRequest(origin, REDIRECT_URI))).rejects.toThrow("redirect:https://accounts.example/oauth");

      const redirectTo = new URL(signInWithOAuth.mock.calls[0]?.[0].options.redirectTo);
      expect(redirectTo.origin).toBe(origin);
      expect(redirectTo.pathname).toBe("/auth/extension/callback");
      expect(redirectTo.searchParams.get("redirect_uri")).toBe(REDIRECT_URI);
      expect(redirectTo.searchParams.get("next")).toBe("/docs");
    },
  );

  it("rejects another extension's redirect before starting OAuth", async () => {
    const signInWithOAuth = mockSignIn();

    const response = await GET(loginRequest("http://localhost:3000", "https://abcdefghijklmnopabcdefghijklmnop.chromiumapp.org/"));

    expect(response.status).toBe(400);
    expect(signInWithOAuth).not.toHaveBeenCalled();
  });
});
