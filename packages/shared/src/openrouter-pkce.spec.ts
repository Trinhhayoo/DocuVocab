import { describe, expect, it } from "vitest";

import { buildOpenRouterAuthUrl, createCodeChallenge, createOpenRouterPkce } from "./openrouter-pkce";

describe("createCodeChallenge", () => {
  it("is the unpadded base64url SHA-256 of the verifier", async () => {
    // Expected value computed separately: node -e 'crypto.createHash("sha256").update(v).digest("base64url")'
    expect(await createCodeChallenge("dBjftJeZ4CVP-mJ92K9hIfXJ1T4ZKFrqUfNt3-aXqBk")).toBe(
      "i9ksqGNpyz8rON7pNW59dbYgvtuBImF4LYsz1_NU_bI",
    );
  });
});

describe("createOpenRouterPkce", () => {
  it("makes a fresh verifier and state each time, with a matching challenge", async () => {
    const first = await createOpenRouterPkce();
    const second = await createOpenRouterPkce();

    expect(first.codeVerifier).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(first.codeVerifier).not.toBe(second.codeVerifier);
    expect(first.state).not.toBe(second.state);
    expect(await createCodeChallenge(first.codeVerifier)).toBe(first.codeChallenge);
  });
});

describe("buildOpenRouterAuthUrl", () => {
  it("sends the challenge and state, never the verifier", async () => {
    const pkce = await createOpenRouterPkce();
    const url = new URL(buildOpenRouterAuthUrl("https://app.test/callback", pkce));

    expect(url.origin + url.pathname).toBe("https://openrouter.ai/auth");
    expect(url.searchParams.get("callback_url")).toBe("https://app.test/callback");
    expect(url.searchParams.get("code_challenge")).toBe(pkce.codeChallenge);
    expect(url.searchParams.get("code_challenge_method")).toBe("S256");
    expect(url.searchParams.get("state")).toBe(pkce.state);
    expect(url.href).not.toContain(pkce.codeVerifier);
  });
});
