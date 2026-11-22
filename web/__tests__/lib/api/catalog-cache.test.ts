import { describe, expect, it } from "vitest";
import {
  catalogRequestCache,
  catalogResponseCacheControl,
  isPublicCatalogGet,
} from "@/lib/api/catalog-cache";

describe("catalog cache", () => {
  it("treats list, cursor, and detail GETs as public catalog reads", () => {
    expect(isPublicCatalogGet("/api/books?page=1")).toBe(true);
    expect(isPublicCatalogGet("/api/books/cursor?limit=40")).toBe(true);
    expect(
      isPublicCatalogGet(
        "/api/authors/11111111-1111-1111-1111-111111111111",
      ),
    ).toBe(true);
    expect(isPublicCatalogGet("api/categories")).toBe(true);
  });

  it("keeps writes, bookings, exports, and summaries uncached", () => {
    expect(isPublicCatalogGet("/api/books", "POST")).toBe(false);
    expect(isPublicCatalogGet("/api/books/summaries", "POST")).toBe(false);
    expect(isPublicCatalogGet("/api/books/export")).toBe(false);
    expect(isPublicCatalogGet("/api/books/copies/lookup")).toBe(false);
    expect(isPublicCatalogGet("/api/bookings")).toBe(false);
    expect(isPublicCatalogGet("/api/admin/books")).toBe(false);
    expect(catalogRequestCache("/api/bookings", "GET")).toBe("no-store");
    expect(catalogRequestCache("/api/books", "GET")).toBe("default");
  });

  it("marks book detail private and the rest of the catalog public", () => {
    expect(
      catalogResponseCacheControl(
        "api/books/11111111-1111-1111-1111-111111111111",
      ),
    ).toBe("private, max-age=15");
    expect(catalogResponseCacheControl("/api/books")).toBe(
      "public, max-age=15",
    );
    expect(catalogResponseCacheControl("/api/authors/cursor")).toBe(
      "public, max-age=15",
    );
  });
});
