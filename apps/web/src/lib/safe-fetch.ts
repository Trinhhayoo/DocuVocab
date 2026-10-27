import { lookup } from "node:dns/promises";
import { BlockList, isIP } from "node:net";

const MAX_REDIRECTS = 5;
const FETCH_TIMEOUT_MS = 10_000;
export const MAX_RESPONSE_BYTES = 5 * 1024 * 1024;

const BLOCKED_IPV4_SUBNETS: ReadonlyArray<readonly [string, number]> = [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["224.0.0.0", 4],
  ["240.0.0.0", 4],
];

const BLOCKED_IPV6_SUBNETS: ReadonlyArray<readonly [string, number]> = [
  ["::", 128],
  ["::1", 128],
  ["fc00::", 7],
  ["fe80::", 10],
  ["ff00::", 8],
];

const IPV4_MAPPED_IPV6_PATTERN = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i;

const blockedAddresses = createBlockedAddresses();

function createBlockedAddresses(): BlockList {
  const list = new BlockList();
  BLOCKED_IPV4_SUBNETS.forEach(([network, prefix]) => list.addSubnet(network, prefix, "ipv4"));
  BLOCKED_IPV6_SUBNETS.forEach(([network, prefix]) => list.addSubnet(network, prefix, "ipv6"));
  return list;
}

/** Whether an IP points at a private, loopback, link-local, or reserved network. */
export function isBlockedAddress(address: string): boolean {
  const mappedIpv4 = address.match(IPV4_MAPPED_IPV6_PATTERN)?.[1];

  if (mappedIpv4) {
    return isBlockedAddress(mappedIpv4);
  }

  const family = isIP(address);

  if (family === 0) {
    return true;
  }

  return blockedAddresses.check(address, family === 4 ? "ipv4" : "ipv6");
}

async function assertPublicUrl(url: URL): Promise<void> {
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Only http and https URLs are allowed.");
  }

  if (url.username || url.password) {
    throw new Error("URLs with credentials are not allowed.");
  }

  const hostname = url.hostname.replace(/^\[|\]$/g, "");
  const addresses = isIP(hostname)
    ? [hostname]
    : (await lookup(hostname, { all: true, verbatim: true })).map(({ address }) => address);

  if (addresses.length === 0 || addresses.some(isBlockedAddress)) {
    throw new Error("This URL points to a private network address.");
  }
}

function isRedirect(status: number): boolean {
  return status >= 300 && status < 400;
}

/**
 * Fetches a public http(s) URL: re-checks every redirect hop against private networks and aborts after a timeout.
 * DNS can still change between the check and the request (rebinding); this guard narrows SSRF, it does not remove it.
 */
export async function safeFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const signal = AbortSignal.timeout(FETCH_TIMEOUT_MS);
  let url = new URL(input);

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    await assertPublicUrl(url);

    const response = await fetch(url, { ...init, redirect: "manual", signal });
    const location = response.headers.get("location");

    if (!isRedirect(response.status) || !location) {
      return response;
    }

    await response.body?.cancel();
    url = new URL(location, url);
  }

  throw new Error("Too many redirects.");
}

/** Reads a response body as text, failing once it exceeds `maxBytes`. */
export async function readTextWithLimit(
  response: Response,
  maxBytes = MAX_RESPONSE_BYTES,
): Promise<string> {
  const declaredLength = Number(response.headers.get("content-length"));

  if (declaredLength > maxBytes) {
    await response.body?.cancel();
    throw new Error("The page is too large to import.");
  }

  if (!response.body) {
    return "";
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let receivedBytes = 0;

  for (;;) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    receivedBytes += value.byteLength;

    if (receivedBytes > maxBytes) {
      await reader.cancel();
      throw new Error("The page is too large to import.");
    }

    chunks.push(value);
  }

  return new TextDecoder().decode(Buffer.concat(chunks));
}
