import { describe, expect, it } from "vitest";

import { parseExtensionRedirectUri } from "./extension-redirect";

const CHROME_ID = "abcdefghijklmnopabcdefghijklmnop";
const FIREFOX_ID = "0123456789abcdef0123456789abcdef01234567";

describe("parseExtensionRedirectUri", () => {
  it.each([
    `https://${CHROME_ID}.chromiumapp.org/`,
    `https://${CHROME_ID}.chromiumapp.org/callback`,
    `https://${FIREFOX_ID}.extensions.allizom.org/`,
  ])("accepts %s", (value) => {
    expect(parseExtensionRedirectUri(value)?.href).toBe(value);
  });

  it.each([
    null,
    "",
    "not a url",
    "https://evil.com/",
    `https://${CHROME_ID}.chromiumapp.org.evil.com/`,
    `https://evil.com/${CHROME_ID}.chromiumapp.org/`,
    `http://${CHROME_ID}.chromiumapp.org/`,
    `https://${CHROME_ID}.chromiumapp.org:8443/`,
    `https://user:pass@${CHROME_ID}.chromiumapp.org/`,
    `https://${CHROME_ID.slice(1)}.chromiumapp.org/`,
    `https://${CHROME_ID.toUpperCase()}x.chromiumapp.org/`,
    `https://${FIREFOX_ID}z.extensions.allizom.org/`,
    `chrome-extension://${CHROME_ID}/auth-callback.html`,
    "javascript:alert(1)",
  ])("rejects %s", (value) => {
    expect(parseExtensionRedirectUri(value)).toBeNull();
  });
});
