import { describe, expect, it, vi } from "vitest";

import { success } from "@/feature/common/data/result";

import { DEFAULT_SETTINGS } from "../entity/settings.entity";
import type SettingsRepository from "../i-repo/settings.repository";
import connectOpenRouterUsecase, { ConnectOpenRouterFailure } from "./connect-openrouter.usecase";

const INPUT = { code: "fake-code", codeVerifier: "v".repeat(43) };

function fakeRepo(): SettingsRepository {
  return {
    get: vi.fn(),
    update: vi.fn(),
    getEncryptedOpenRouterKey: vi.fn(),
    setEncryptedOpenRouterKey: vi
      .fn()
      .mockResolvedValue(success({ ...DEFAULT_SETTINGS, openRouterConnected: true })),
  };
}

describe("connectOpenRouterUsecase", () => {
  it("stores only the encrypted key", async () => {
    const repo = fakeRepo();
    const exchangeCode = vi.fn().mockResolvedValue("sk-or-fake");
    const encrypt = vi.fn((plaintext: string) => `encrypted(${plaintext})`);

    const result = await connectOpenRouterUsecase({ repo, exchangeCode, encrypt }, "user-1", INPUT);

    expect(result).toEqual(success({ ...DEFAULT_SETTINGS, openRouterConnected: true }));
    expect(exchangeCode).toHaveBeenCalledWith("fake-code", INPUT.codeVerifier);
    expect(repo.setEncryptedOpenRouterKey).toHaveBeenCalledWith("user-1", "encrypted(sk-or-fake)");
  });

  it("saves nothing when the exchange fails", async () => {
    const repo = fakeRepo();
    const exchangeCode = vi.fn().mockRejectedValue(new Error("403"));

    const result = await connectOpenRouterUsecase(
      { repo, exchangeCode, encrypt: (value) => value },
      "user-1",
      INPUT,
    );

    expect(result.success).toBe(false);
    expect(!result.success && result.failure).toBeInstanceOf(ConnectOpenRouterFailure);
    expect(repo.setEncryptedOpenRouterKey).not.toHaveBeenCalled();
  });
});
