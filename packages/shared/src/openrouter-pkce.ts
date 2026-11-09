/** OpenRouter's OAuth PKCE consent page (https://openrouter.ai/docs/use-cases/oauth-pkce). */
export const OPENROUTER_AUTH_URL = "https://openrouter.ai/auth";

export type OpenRouterPkce = Readonly<{
  /** The secret half: stays with whoever started the flow and is sent only to trade the code. */
  codeVerifier: string;
  /** SHA-256 of the verifier, sent up front; OpenRouter checks the verifier against it. */
  codeChallenge: string;
  /** Returned unchanged on the callback; a mismatch means someone else started that redirect. */
  state: string;
}>;

function base64Url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function randomToken(byteLength: number): string {
  return base64Url(crypto.getRandomValues(new Uint8Array(byteLength)));
}

export async function createCodeChallenge(codeVerifier: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(codeVerifier));
  return base64Url(new Uint8Array(digest));
}

/** A fresh verifier (32 random bytes), its S256 challenge, and a state token (16 random bytes). */
export async function createOpenRouterPkce(): Promise<OpenRouterPkce> {
  const codeVerifier = randomToken(32);

  return { codeVerifier, codeChallenge: await createCodeChallenge(codeVerifier), state: randomToken(16) };
}

export function buildOpenRouterAuthUrl(callbackUrl: string, pkce: OpenRouterPkce): string {
  const url = new URL(OPENROUTER_AUTH_URL);
  url.searchParams.set("callback_url", callbackUrl);
  url.searchParams.set("code_challenge", pkce.codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("state", pkce.state);
  return url.href;
}
