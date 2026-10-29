import { afterEach, describe, expect, it, vi } from "vitest";

import { RETURN_PATH_COOKIE } from "@/lib/sign-in-return-path";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { GET } from "./route";

const cookieStore = vi.hoisted(() => ({ get: vi.fn(), delete: vi.fn() }));

vi.mock("next/headers", () => ({ cookies: vi.fn(async () => cookieStore) }));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient: vi.fn() }));
vi.mock("@/feature/core/user/data/repository/auth-user.repository", () => ({ default: vi.fn() }));
vi.mock("@/feature/core/user/domain/usecase/sync-auth-user.usecase", () => ({ default: vi.fn() }));

const CALLBACK = "https://docu-vocab-kappa.vercel.app/auth/web/callback?code=abc";

function signedInWithReturnPath(returnPath: string | undefined) {
  cookieStore.get.mockReturnValue(returnPath === undefined ? undefined : { value: returnPath });
  const exchangeCodeForSession = vi.fn().mockResolvedValue({
    data: { session: { user: { id: "user-1", email: "user@example.com" } } },
    error: null,
  });
  vi.mocked(createSupabaseServerClient).mockResolvedValue({ auth: { exchangeCodeForSession } } as never);
}

afterEach(() => {
  vi.clearAllMocks();
});

describe("GET /auth/web/callback", () => {
  it("returns to the path saved when sign-in started and clears it", async () => {
    signedInWithReturnPath("/docs/42");

    const response = await GET(new Request(CALLBACK));

    expect(response.headers.get("location")).toBe("https://docu-vocab-kappa.vercel.app/docs/42");
    expect(cookieStore.get).toHaveBeenCalledWith(RETURN_PATH_COOKIE);
    expect(cookieStore.delete).toHaveBeenCalledWith({ name: RETURN_PATH_COOKIE, path: "/auth/web/callback" });
  });

  it.each([["an off-site URL", "https://evil.com"], ["no saved path", undefined]])(
    "returns home for %s",
    async (_, returnPath) => {
      signedInWithReturnPath(returnPath);

      const response = await GET(new Request(CALLBACK));

      expect(response.headers.get("location")).toBe("https://docu-vocab-kappa.vercel.app/");
    },
  );

  it("ignores a next parameter in the callback URL", async () => {
    signedInWithReturnPath(undefined);

    const response = await GET(new Request(`${CALLBACK}&next=https://evil.com`));

    expect(response.headers.get("location")).toBe("https://docu-vocab-kappa.vercel.app/");
  });
});
