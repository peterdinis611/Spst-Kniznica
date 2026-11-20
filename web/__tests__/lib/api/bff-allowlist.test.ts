import { describe, expect, it } from "vitest";
import {
  BFF_ALLOWED_PREFIXES,
  isBffAllowedPath,
} from "@/lib/api/bff-allowlist";

describe("isBffAllowedPath", () => {
  it("allows known prefixes and nested paths", () => {
    expect(isBffAllowedPath("api/emails")).toBe(true);
    expect(isBffAllowedPath("api/emails/status")).toBe(true);
    expect(isBffAllowedPath("/api/orders/queue")).toBe(true);
    expect(isBffAllowedPath("api/books/summaries")).toBe(true);
    expect(isBffAllowedPath("health")).toBe(true);
  });

  it("rejects empty, traversal, unknown, dead, and internal paths", () => {
    expect(isBffAllowedPath("")).toBe(false);
    expect(isBffAllowedPath("api/../secret")).toBe(false);
    expect(isBffAllowedPath("api/internal/emails")).toBe(false);
    expect(isBffAllowedPath("api/secrets")).toBe(false);
    expect(isBffAllowedPath("api/library-ops")).toBe(false);
    expect(isBffAllowedPath("api/workers")).toBe(false);
    expect(isBffAllowedPath("api/bookings/internal/foo")).toBe(false);
  });

  it("exposes the staff tooling prefixes", () => {
    expect(BFF_ALLOWED_PREFIXES).toEqual(
      expect.arrayContaining([
        "api/emails",
        "api/orders",
        "api/bookings",
        "api/gateway",
        "api/relations",
        "api/cache",
      ]),
    );
    expect(BFF_ALLOWED_PREFIXES).not.toContain("api/library-ops");
    expect(BFF_ALLOWED_PREFIXES).not.toContain("api/workers");
  });
});
