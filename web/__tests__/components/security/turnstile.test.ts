import { describe, expect, it } from "vitest";
import { isTurnstileConfigured } from "@/components/security/TurnstileWidget";

describe("isTurnstileConfigured", () => {
  it("is false for blank keys", () => {
    expect(isTurnstileConfigured(undefined)).toBe(false);
    expect(isTurnstileConfigured("")).toBe(false);
    expect(isTurnstileConfigured("   ")).toBe(false);
  });

  it("is true when site key present", () => {
    expect(isTurnstileConfigured("0xsite-key")).toBe(true);
  });
});
