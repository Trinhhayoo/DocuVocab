import { afterEach, describe, expect, it, vi } from "vitest";

import { CHROME_EXTENSION_ID, EXTENSION_REDIRECT_COOKIE } from "@/lib/extension-redirect";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { GET } from "./route";

const cookieStore = vi.hoisted(() => ({ get: vi.fn(), delete: vi.fn() }));

vi.mock("next/headers", () => ({ cookies: vi.fn(async () => cookieStore) }));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient: vi.fn() }));
vi.mock("@/feature/core/user/data/repository/auth-user.repository", () => ({ default: vi.fn() }));
vi.mock("@/feature/core/user/domain/usecase/sync-auth-user.usecase", () => ({ default: vi.fn() }));

const CALLBACK = "https://docu-vocab-kappa.vercel.app/auth/extension/callback?code=abc";
const REDIRECT_URI = `https://${CHROME_EXTENSION_ID}.chromiumapp.org/`;

function mockExchange() {
  const exchangeCodeForSession = vi.fn().mockResolvedValue({
    data: { session: { access_token: "access", refresh_token: "refresh", user: { id: "user-1", email: null } } },
    error: null,
  });
  vi.mocked(createSupabaseServerClient).mockResolvedValue({ auth: { exchangeCodeForSession } } as never);
  return exchangeCodeForSession;
}

function withRedirectCookie(value: string | undefined) {
  cookieStore.get.mockReturnValue(value === undefined ? undefined : { value });
}

afterEach(() => {
  vi.clearAllMocks();
});

describe("GET /auth/extension/callback", () => {
  it("hands the tokens to the extension saved when sign-in started and clears the cookie", async () => {
    withRedirectCookie(REDIRECT_URI);
    mockExchange();

    const response = await GET(new Request(CALLBACK));

    const location = new URL(response.headers.get("location") ?? "");
    expect(location.origin).toBe(`https://${CHROME_EXTENSION_ID}.chromiumapp.org`);
    expect(location.searchParams.get("access_token")).toBe("access");
    expect(location.searchParams.get("refresh_token")).toBe("refresh");
    expect(cookieStore.delete).toHaveBeenCalledWith({
      name: EXTENSION_REDIRECT_COOKIE,
      path: "/auth/extension/callback",
    });
  });

  it.each([
    ["no saved redirect", undefined],
    ["a tampered cookie", "https://evil.com/"],
  ])("sends %s home without exchanging the code", async (_, cookie) => {
    withRedirectCookie(cookie);
    const exchangeCodeForSession = mockExchange();

    const response = await GET(new Request(CALLBACK));

    expect(response.headers.get("location")).toBe("https://docu-vocab-kappa.vercel.app/");
    expect(exchangeCodeForSession).not.toHaveBeenCalled();
  });

  it("ignores a redirect_uri in the callback URL", async () => {
    withRedirectCookie(undefined);
    const exchangeCodeForSession = mockExchange();

    const response = await GET(new Request(`${CALLBACK}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`));

    expect(response.headers.get("location")).toBe("https://docu-vocab-kappa.vercel.app/");
    expect(exchangeCodeForSession).not.toHaveBeenCalled();
  });
});
