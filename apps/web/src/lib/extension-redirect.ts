/** Fixed by the `key` in apps/extension/wxt.config.ts. */
export const CHROME_EXTENSION_ID = "bpeoeihgcioncibdafpcpfnfcgijlacp";

/** `gecko.id` in apps/extension/wxt.config.ts. */
export const FIREFOX_ADDON_ID = "doc-dictionary@docuvocab";

/** Firefox's `identity.getRedirectURL()` subdomain: the SHA-1 hex digest of the add-on ID. */
export const FIREFOX_REDIRECT_SUBDOMAIN = "dee9f0eaa99010512f41f85ded686cbb29122ecc";

// Only our own extension's identity redirects; the browser intercepts these, so tokens never leave it.
const EXTENSION_REDIRECT_HOSTS: ReadonlySet<string> = new Set([
  `${CHROME_EXTENSION_ID}.chromiumapp.org`,
  `${FIREFOX_REDIRECT_SUBDOMAIN}.extensions.allizom.org`,
]);

/** Returns the URL only when it is our extension's identity redirect. */
export function parseExtensionRedirectUri(value: string | null): URL | null {
  if (!value) return null;

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }

  if (url.protocol !== "https:" || url.username || url.password || url.port) {
    return null;
  }

  return EXTENSION_REDIRECT_HOSTS.has(url.hostname) ? url : null;
}

/**
 * The extension's identity redirect travels in a cookie instead of the OAuth callback URL, so the
 * callback stays one exact URL that matches Supabase's Redirect URLs allow list. Supabase matches
 * the query string too, and falls back to the Site URL when a callback does not match.
 */
export const EXTENSION_REDIRECT_COOKIE = "docuvocab-extension-redirect";

export const EXTENSION_CALLBACK_PATH = "/auth/extension/callback";

export function extensionRedirectCookieOptions(secure: boolean) {
  return {
    httpOnly: true,
    secure,
    sameSite: "lax" as const,
    // Sent only to the callback, and only for the length of a sign-in.
    path: EXTENSION_CALLBACK_PATH,
    maxAge: 60 * 10,
  };
}
