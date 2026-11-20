import { describe, expect, it } from "vitest";
import { isBffAllowedPath } from "@/lib/api/bff-allowlist";

describe("BFF hardening paths", () => {
  it.each([
    ["api/cache/keys", true],
    ["api/messaging/publish", true],
    ["api/emails/templates/loan-due-reminder", true],
    ["api/orders/enqueue", true],
    ["api/gateway/status", true],
    ["api/auth/config", true],
    ["api/books/summaries", true],
    ["api/bookings/lifecycle/mark-overdue", true],
  ])("allows %s → %s", (path, allowed) => {
    expect(isBffAllowedPath(path)).toBe(allowed);
  });

  it.each([
    "api/workers/jobs",
    "api/library-ops/desk",
    "api/internal/audit",
    "api/internal/emails/send",
    "api/books/../internal/x",
    "api/secrets/tokens",
  ])("denies %s", (path) => {
    expect(isBffAllowedPath(path)).toBe(false);
  });
});
