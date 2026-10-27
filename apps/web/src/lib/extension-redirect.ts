// Redirect hosts that only the browser's identity API can intercept (Chrome/Edge and Firefox).
const EXTENSION_REDIRECT_HOST =
  /^([a-p]{32}\.chromiumapp\.org|[0-9a-f]{40}\.extensions\.allizom\.org)$/;

/** Returns the URL only when it points at an extension identity redirect, so tokens never leave the browser. */
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

  return EXTENSION_REDIRECT_HOST.test(url.hostname) ? url : null;
}
