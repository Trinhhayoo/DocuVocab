const PLACEHOLDER_ORIGIN = "http://app.invalid";

/**
 * Returns `value` when it is a path on this app, otherwise `/`. Used for the `next` parameter of
 * sign-in redirects, so a crafted link cannot send a user to another site after they sign in.
 */
export function safeNextPath(value: string | null): string {
  // Only plain absolute paths; `//host` and `/\host` are protocol-relative URLs in browsers.
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) {
    return "/";
  }

  try {
    const url = new URL(value, PLACEHOLDER_ORIGIN);
    if (url.origin !== PLACEHOLDER_ORIGIN) return "/";
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "/";
  }
}
