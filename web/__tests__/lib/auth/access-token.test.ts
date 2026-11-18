import { describe, expect, it, vi } from "vitest";
import {
  readerFromAuth,
  resolveActionAccessToken,
} from "@/lib/auth/access-token";

describe("resolveActionAccessToken", () => {
  it("returns token when present", async () => {
    await expect(
      resolveActionAccessToken({
        entraEnabled: true,
        getAccessToken: async () => "tok-123",
      }),
    ).resolves.toBe("tok-123");
  });

  it("throws when Entra is on and token is missing", async () => {
    await expect(
      resolveActionAccessToken({
        entraEnabled: true,
        getAccessToken: async () => null,
      }),
    ).rejects.toThrow(/Na výpožičku musíš byť prihlásený/);
  });

  it("allows missing token when Entra is off", async () => {
    await expect(
      resolveActionAccessToken({
        entraEnabled: false,
        getAccessToken: async () => null,
      }),
    ).resolves.toBeUndefined();
  });
});

describe("readerFromAuth", () => {
  it("returns null without email", () => {
    expect(
      readerFromAuth(null, { name: "Peter", email: null }),
    ).toBeNull();
  });

  it("falls back name to email when blank", () => {
    expect(
      readerFromAuth(null, { name: "  ", email: "a@spst.sk" }),
    ).toEqual({ name: "a@spst.sk", email: "a@spst.sk" });
  });

  it("keeps trimmed name when present", () => {
    expect(
      readerFromAuth(null, { name: "  Peter D. ", email: "a@spst.sk" }),
    ).toEqual({ name: "Peter D.", email: "a@spst.sk" });
  });
});
