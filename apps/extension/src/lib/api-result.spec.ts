import { describe, expect, it } from "vitest";

import { fail, isUnauthorized, ok, toUserMessage } from "./api-result";

describe("toUserMessage", () => {
  it.each([
    ["400", "Word is required", "Word is required"],
    ["409", "Already saved.", "Already saved."],
    ["401", "Unauthorized", "Please sign in to continue."],
    ["500", "PrismaClientKnownRequestError", "Something went wrong on our server."],
    ["418", "I'm a teapot", "I'm a teapot"],
  ])("maps %s", (status, message, expected) => {
    expect(toUserMessage(fail(status, message))).toBe(expected);
  });
});

describe("isUnauthorized", () => {
  it("is true only for a 401 failure", () => {
    expect(isUnauthorized(fail(401, "x"))).toBe(true);
    expect(isUnauthorized(fail(403, "x"))).toBe(false);
    expect(isUnauthorized(ok(null))).toBe(false);
  });
});
