import { describe, expect, it } from "vitest";
import { absoluteUrl, getSiteUrl, siteConfig } from "@/lib/site";

describe("siteConfig", () => {
  it("exposes library branding defaults", () => {
    expect(siteConfig.name).toContain("SPST");
    expect(siteConfig.locale).toBe("sk_SK");
    expect(siteConfig.address.length).toBeGreaterThan(3);
  });
});

describe("getSiteUrl / absoluteUrl", () => {
  it("returns localhost fallback in tests", () => {
    const url = getSiteUrl();
    expect(url.origin).toMatch(/^https?:\/\//);
  });

  it("builds absolute paths", () => {
    expect(absoluteUrl("/books")).toMatch(/\/books$/);
  });
});
