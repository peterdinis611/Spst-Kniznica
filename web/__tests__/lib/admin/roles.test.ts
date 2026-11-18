import { describe, expect, it } from "vitest";
import { hasAdminRole } from "@/lib/admin/roles";

describe("hasAdminRole", () => {
  it("returns false for non-arrays", () => {
    expect(hasAdminRole(undefined)).toBe(false);
    expect(hasAdminRole(null)).toBe(false);
    expect(hasAdminRole("Admin")).toBe(false);
    expect(hasAdminRole({ roles: ["Admin"] })).toBe(false);
  });

  it("matches Admin case-insensitively", () => {
    expect(hasAdminRole(["Admin"])).toBe(true);
    expect(hasAdminRole(["admin"])).toBe(true);
    expect(hasAdminRole(["Librarian", "ADMIN"])).toBe(true);
  });

  it("returns false for librarian-only or empty", () => {
    expect(hasAdminRole([])).toBe(false);
    expect(hasAdminRole(["Librarian", "Reader"])).toBe(false);
    expect(hasAdminRole([1, true, "Librarian"])).toBe(false);
  });
});
