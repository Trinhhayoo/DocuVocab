import { afterEach, describe, expect, it, vi } from "vitest";

import { isBlockedAddress, readTextWithLimit, safeFetch } from "./safe-fetch";

const PUBLIC_IP_URL = "http://203.0.113.10/article";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("isBlockedAddress", () => {
  it.each([
    "127.0.0.1",
    "10.0.0.5",
    "172.16.0.1",
    "172.31.255.255",
    "192.168.1.1",
    "169.254.169.254",
    "100.64.0.1",
    "0.0.0.0",
    "::1",
    "::",
    "fd00::1",
    "fe80::1",
    "::ffff:127.0.0.1",
    "not-an-ip",
  ])("blocks %s", (address) => {
    expect(isBlockedAddress(address)).toBe(true);
  });

  it.each(["8.8.8.8", "172.32.0.1", "203.0.113.10", "2606:4700:4700::1111", "::ffff:8.8.8.8"])(
    "allows %s",
    (address) => {
      expect(isBlockedAddress(address)).toBe(false);
    },
  );
});

describe("safeFetch", () => {
  it.each([
    ["file:///etc/passwd", "Only http and https URLs are allowed."],
    ["http://127.0.0.1:3000/", "This URL points to a private network address."],
    ["http://[::1]/", "This URL points to a private network address."],
    ["http://169.254.169.254/latest/meta-data", "This URL points to a private network address."],
    ["http://user:pass@203.0.113.10/", "URLs with credentials are not allowed."],
  ])("rejects %s", async (url, message) => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(safeFetch(url)).rejects.toThrow(message);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects a redirect to a private address", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(null, { status: 302, headers: { location: "http://10.0.0.1/admin" } }),
      ),
    );

    await expect(safeFetch(PUBLIC_IP_URL)).rejects.toThrow(
      "This URL points to a private network address.",
    );
  });

  it("stops after too many redirects", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(() =>
        Promise.resolve(new Response(null, { status: 302, headers: { location: PUBLIC_IP_URL } })),
      ),
    );

    await expect(safeFetch(PUBLIC_IP_URL)).rejects.toThrow("Too many redirects.");
  });

  it("returns the final response for a public URL", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("ok", { status: 200 })));

    const response = await safeFetch(PUBLIC_IP_URL);

    expect(await response.text()).toBe("ok");
  });
});

describe("readTextWithLimit", () => {
  it("returns the body under the limit", async () => {
    await expect(readTextWithLimit(new Response("hello"), 5)).resolves.toBe("hello");
  });

  it("rejects a body over the limit", async () => {
    await expect(readTextWithLimit(new Response("hello!"), 5)).rejects.toThrow(
      "The page is too large to import.",
    );
  });

  it("rejects a declared content-length over the limit", async () => {
    const response = new Response("hi", { headers: { "content-length": "999" } });

    await expect(readTextWithLimit(response, 5)).rejects.toThrow("The page is too large to import.");
  });
});
