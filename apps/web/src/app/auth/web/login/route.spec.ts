import { afterEach, describe, expect, it, vi } from "vitest";

import { RETURN_PATH_COOKIE } from "@/lib/sign-in-return-path";
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

async function signIn(origin: string, next?: string) {
  const signInWithOAuth = vi.fn().mockResolvedValue({ data: { url: "https://accounts.example/oauth" }, error: null });
  vi.mocked(createSupabaseServerClient).mockResolvedValue({ auth: { signInWithOAuth } } as never);

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
    "sends Supabase one exact callback URL on the serving host (%s)",
    async (origin) => {
      vi.stubEnv("NEXT_PUBLIC_APP_URL", "");

      const callback = await signIn(origin, "/docs/42");

      // No query string: Supabase's allow list matches it too.
      expect(callback.href).toBe(`${origin}/auth/web/callback`);
    },
  );

  it("keeps the return path in a short-lived cookie for the callback only", async () => {
    await signIn("https://docu-vocab-kappa.vercel.app", "/docs/42");

    expect(cookieStore.set).toHaveBeenCalledWith(RETURN_PATH_COOKIE, "/docs/42", {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/auth/web/callback",
      maxAge: 600,
    });
  });

  it.each(["https://evil.com", "//evil.com", undefined])("stores / for an unsafe or missing next (%s)", async (next) => {
    await signIn("http://localhost:3000", next);

    expect(cookieStore.set).toHaveBeenCalledWith(RETURN_PATH_COOKIE, "/", expect.objectContaining({ secure: false }));
  });
});
