import { afterEach, describe, expect, it, vi } from "vitest";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { POST } from "./route";

vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient: vi.fn() }));

function mockSignOut(result: { error: { status?: number } | null }) {
  const signOut = vi.fn().mockResolvedValue({ data: null, ...result });
  vi.mocked(createSupabaseServerClient).mockResolvedValue({ auth: { admin: { signOut } } } as never);
  return signOut;
}

function logoutRequest(authorization?: string) {
  return new Request("http://localhost:3000/api/extension/auth/logout", {
    method: "POST",
    headers: authorization ? { authorization } : {},
  });
}

afterEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/extension/auth/logout", () => {
  it("revokes only the extension's session", async () => {
    const signOut = mockSignOut({ error: null });

    const response = await POST(logoutRequest("Bearer access-token"));

    expect(response.status).toBe(200);
    expect(signOut).toHaveBeenCalledWith("access-token", "local");
  });

  it("returns 401 without a bearer token", async () => {
    const signOut = mockSignOut({ error: null });

    const response = await POST(logoutRequest());

    expect(response.status).toBe(401);
    expect(signOut).not.toHaveBeenCalled();
  });

  it("passes Supabase's status through when revoking fails", async () => {
    mockSignOut({ error: { status: 401 } });

    const response = await POST(logoutRequest("Bearer expired-token"));

    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({ success: false, status: "401" });
  });
});
