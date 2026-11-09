import { randomBytes } from "node:crypto";

import { describe, expect, it } from "vitest";

import { decryptSecret, encryptSecret, readEncryptionKey } from "./secret-box";

const KEY = randomBytes(32);
const SECRET = "sk-or-v1-fake-test-key";

describe("secret-box", () => {
  it("round-trips a secret with a fresh IV each time", () => {
    const first = encryptSecret(SECRET, KEY);
    const second = encryptSecret(SECRET, KEY);

    expect(first).not.toContain(SECRET);
    expect(first).not.toBe(second);
    expect(decryptSecret(first, KEY)).toBe(SECRET);
  });

  it("rejects a value encrypted with another key", () => {
    expect(() => decryptSecret(encryptSecret(SECRET, KEY), randomBytes(32))).toThrow();
  });

  it("rejects a tampered ciphertext", () => {
    const [version, iv, tag, ciphertext] = encryptSecret(SECRET, KEY).split(".");
    const flipped = Buffer.from(ciphertext, "base64url");
    flipped[0] ^= 1;

    expect(() =>
      decryptSecret([version, iv, tag, flipped.toString("base64url")].join("."), KEY),
    ).toThrow();
  });

  it("rejects an unknown format", () => {
    expect(() => decryptSecret("plain-text", KEY)).toThrow("Unsupported encrypted secret format.");
  });
});

describe("readEncryptionKey", () => {
  it("decodes a 32-byte base64 secret", () => {
    const key = randomBytes(32);

    expect(readEncryptionKey({ AI_KEY_ENCRYPTION_SECRET: key.toString("base64") })).toEqual(key);
  });

  it.each([
    [{}, "AI_KEY_ENCRYPTION_SECRET is not set."],
    [{ AI_KEY_ENCRYPTION_SECRET: randomBytes(16).toString("base64") }, "must decode to 32 bytes"],
  ])("rejects %j", (env, message) => {
    expect(() => readEncryptionKey(env)).toThrow(message);
  });
});
