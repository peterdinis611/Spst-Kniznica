import { describe, expect, it } from "vitest";
import { safeNextPath } from "@/lib/routing/safe-next-path";

describe("safeNextPath", () => {
  it("allows same-origin relative paths", () => {
    expect(safeNextPath("/admin")).toBe("/admin");
    expect(safeNextPath("/books?q=1")).toBe("/books?q=1");
  });

  it("rejects open redirects", () => {
    expect(safeNextPath("//evil.example")).toBeNull();
    expect(safeNextPath("https://evil.example")).toBeNull();
    expect(safeNextPath("javascript:alert(1)")).toBeNull();
    expect(safeNextPath("\\evil")).toBeNull();
    expect(safeNextPath(null)).toBeNull();
  });
});
