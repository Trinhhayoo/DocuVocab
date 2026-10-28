import { describe, expect, it } from "vitest";

import { safeNextPath } from "./safe-next-path";

describe("safeNextPath", () => {
  it.each([
    ["/", "/"],
    ["/docs/42", "/docs/42"],
    ["/docs/42?tab=vocab#top", "/docs/42?tab=vocab#top"],
  ])("keeps the app path %s", (value, expected) => {
    expect(safeNextPath(value)).toBe(expected);
  });

  it.each([
    null,
    "",
    "docs/42",
    "https://evil.com",
    "//evil.com",
    "/\\evil.com",
    "\\\\evil.com",
    "javascript:alert(1)",
    " /docs",
  ])("falls back to / for %j", (value) => {
    expect(safeNextPath(value)).toBe("/");
  });

  it("normalizes dot segments instead of leaving the app", () => {
    expect(safeNextPath("/../../etc")).toBe("/etc");
  });
});
