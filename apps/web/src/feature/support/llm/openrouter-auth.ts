import { z } from "zod";

import { OPENROUTER_API_URL } from "./openrouter-llm-provider";

const keyResponseSchema = z.object({ key: z.string().min(1) });

/**
 * Trades the code from OpenRouter's OAuth PKCE redirect for an API key billed to the user's account.
 * Codes expire 10 minutes after they are issued.
 */
export async function exchangeOpenRouterCode(
  code: string,
  codeVerifier: string,
  fetchFn: typeof fetch = fetch,
): Promise<string> {
  const response = await fetchFn(`${OPENROUTER_API_URL}/auth/keys`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, code_verifier: codeVerifier, code_challenge_method: "S256" }),
  });

  if (!response.ok) {
    throw new Error(`OpenRouter key exchange failed (${response.status}).`);
  }

  return keyResponseSchema.parse(await response.json()).key;
}
