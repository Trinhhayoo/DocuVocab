/**
 * Where to go after web sign-in. It travels in a cookie instead of the OAuth callback URL, so the
 * callback stays one exact URL that matches Supabase's Redirect URLs allow list. Supabase matches
 * the query string too, and falls back to the Site URL when a callback does not match.
 */
export const RETURN_PATH_COOKIE = "docuvocab-sign-in-next";

export const WEB_CALLBACK_PATH = "/auth/web/callback";

const TEN_MINUTES = 60 * 10;

export function returnPathCookieOptions(secure: boolean) {
  return {
    httpOnly: true,
    secure,
    sameSite: "lax" as const,
    // Sent only to the callback, and only for the length of a sign-in.
    path: WEB_CALLBACK_PATH,
    maxAge: TEN_MINUTES,
  };
}
