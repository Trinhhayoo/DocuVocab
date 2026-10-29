import { afterEach, describe, expect, it, vi } from "vitest";

import { CHROME_EXTENSION_ID, EXTENSION_REDIRECT_COOKIE } from "@/lib/extension-redirect";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { GET } from "./route";

const cookieStore = vi.hoisted(() => ({ set: vi.fn() }));

vi.mock("next/headers", () => ({ cookies: vi.fn(async () => cookieStore) }));
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
  return new Request(url);
}

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});

describe("GET /auth/extension/login", () => {
  it.each(["http://localhost:3000", "https://docu-vocab-git-feature.vercel.app"])(
    "sends Supabase one exact callback URL on the serving host (%s)",
    async (origin) => {
      vi.stubEnv("NEXT_PUBLIC_APP_URL", "");
      const signInWithOAuth = mockSignIn();

      await expect(GET(loginRequest(origin, REDIRECT_URI))).rejects.toThrow("redirect:https://accounts.example/oauth");

      // No query string: Supabase's allow list matches it too.
      expect(signInWithOAuth.mock.calls[0]?.[0].options.redirectTo).toBe(`${origin}/auth/extension/callback`);
    },
  );

  it("keeps the extension's redirect in a short-lived cookie for the callback only", async () => {
    mockSignIn();

    await expect(GET(loginRequest("https://docu-vocab-kappa.vercel.app", REDIRECT_URI))).rejects.toThrow();

    expect(cookieStore.set).toHaveBeenCalledWith(EXTENSION_REDIRECT_COOKIE, REDIRECT_URI, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/auth/extension/callback",
      maxAge: 600,
    });
  });

  it("rejects another extension's redirect before starting OAuth", async () => {
    const signInWithOAuth = mockSignIn();

    const response = await GET(loginRequest("http://localhost:3000", "https://abcdefghijklmnopabcdefghijklmnop.chromiumapp.org/"));

    expect(response.status).toBe(400);
    expect(signInWithOAuth).not.toHaveBeenCalled();
    expect(cookieStore.set).not.toHaveBeenCalled();
  });
});
