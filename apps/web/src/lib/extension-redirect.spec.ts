import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";

import {
  CHROME_EXTENSION_ID,
  FIREFOX_ADDON_ID,
  FIREFOX_REDIRECT_SUBDOMAIN,
  parseExtensionRedirectUri,
} from "./extension-redirect";

const OTHER_CHROME_ID = "abcdefghijklmnopabcdefghijklmnop";
const OTHER_FIREFOX_SUBDOMAIN = "0123456789abcdef0123456789abcdef01234567";

describe("FIREFOX_REDIRECT_SUBDOMAIN", () => {
  it("is the SHA-1 of the add-on ID", () => {
    expect(createHash("sha1").update(FIREFOX_ADDON_ID).digest("hex")).toBe(FIREFOX_REDIRECT_SUBDOMAIN);
  });
});

describe("parseExtensionRedirectUri", () => {
  it.each([
    `https://${CHROME_EXTENSION_ID}.chromiumapp.org/`,
    `https://${CHROME_EXTENSION_ID}.chromiumapp.org/callback`,
    `https://${FIREFOX_REDIRECT_SUBDOMAIN}.extensions.allizom.org/`,
  ])("accepts %s", (value) => {
    expect(parseExtensionRedirectUri(value)?.href).toBe(value);
  });

  it.each([
    null,
    "",
    "not a url",
    "https://evil.com/",
    `https://${OTHER_CHROME_ID}.chromiumapp.org/`,
    `https://${OTHER_FIREFOX_SUBDOMAIN}.extensions.allizom.org/`,
    `https://${CHROME_EXTENSION_ID}.chromiumapp.org.evil.com/`,
    `https://evil.com/${CHROME_EXTENSION_ID}.chromiumapp.org/`,
    `http://${CHROME_EXTENSION_ID}.chromiumapp.org/`,
    `https://${CHROME_EXTENSION_ID}.chromiumapp.org:8443/`,
    `https://user:pass@${CHROME_EXTENSION_ID}.chromiumapp.org/`,
    `https://x.${CHROME_EXTENSION_ID}.chromiumapp.org/`,
    `chrome-extension://${CHROME_EXTENSION_ID}/auth-callback.html`,
    "javascript:alert(1)",
  ])("rejects %s", (value) => {
    expect(parseExtensionRedirectUri(value)).toBeNull();
  });
});
