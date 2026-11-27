import { describe, expect, it } from "vitest";
import { isSafeHttpUrl } from "@/lib/security/safe-url";

describe("isSafeHttpUrl", () => {
  it("accepts absolute http(s)", () => {
    expect(isSafeHttpUrl("https://covers.openlibrary.org/x.jpg")).toBe(true);
    expect(isSafeHttpUrl("http://localhost:3000/x.png")).toBe(true);
  });

  it("rejects non-http schemes and blank", () => {
    expect(isSafeHttpUrl("javascript:alert(1)")).toBe(false);
    expect(isSafeHttpUrl("data:image/png;base64,xx")).toBe(false);
    expect(isSafeHttpUrl("//cdn.example/x")).toBe(false);
    expect(isSafeHttpUrl("/local.jpg")).toBe(false);
    expect(isSafeHttpUrl("   ")).toBe(false);
    expect(isSafeHttpUrl(null)).toBe(false);
  });

  it("can disallow plain http", () => {
    expect(isSafeHttpUrl("http://example.com/a", { allowHttp: false })).toBe(
      false,
    );
  });
});
