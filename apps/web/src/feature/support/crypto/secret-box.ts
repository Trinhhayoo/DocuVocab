import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_BYTES = 12;
const KEY_BYTES = 32;
const VERSION = "v1";

/** Reads `AI_KEY_ENCRYPTION_SECRET`: 32 random bytes, base64 encoded (`openssl rand -base64 32`). */
export function readEncryptionKey(env: Readonly<Record<string, string | undefined>> = process.env): Buffer {
  const secret = env.AI_KEY_ENCRYPTION_SECRET;

  if (!secret) {
    throw new Error("AI_KEY_ENCRYPTION_SECRET is not set.");
  }

  const key = Buffer.from(secret, "base64");

  if (key.length !== KEY_BYTES) {
    throw new Error(`AI_KEY_ENCRYPTION_SECRET must decode to ${KEY_BYTES} bytes.`);
  }

  return key;
}

/** Encrypts with a fresh IV; the result is `v1.<iv>.<tag>.<ciphertext>` in base64url. */
export function encryptSecret(plaintext: string, key: Buffer = readEncryptionKey()): string {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);

  return [VERSION, iv, cipher.getAuthTag(), ciphertext]
    .map((part) => (typeof part === "string" ? part : part.toString("base64url")))
    .join(".");
}

/** Throws when the value was tampered with or encrypted with another key. */
export function decryptSecret(encrypted: string, key: Buffer = readEncryptionKey()): string {
  const [version, iv, tag, ciphertext] = encrypted.split(".");

  if (version !== VERSION || !iv || !tag || ciphertext === undefined) {
    throw new Error("Unsupported encrypted secret format.");
  }

  const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(iv, "base64url"));
  decipher.setAuthTag(Buffer.from(tag, "base64url"));

  return Buffer.concat([
    decipher.update(Buffer.from(ciphertext, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}
