import { describe, expect, it } from "vitest";
import { openLibraryCoverUrl, resolveBookCoverUrl } from "@/lib/catalog/covers";

describe("openLibraryCoverUrl", () => {
  it("builds cover URL from ISBN-13", () => {
    expect(openLibraryCoverUrl("978-0-13-110362-7")).toBe(
      "https://covers.openlibrary.org/b/isbn/9780131103627-L.jpg",
    );
  });

  it("supports size variants", () => {
    expect(openLibraryCoverUrl("9780131103627", "S")).toContain("-S.jpg");
  });

  it("returns null for invalid isbn", () => {
    expect(openLibraryCoverUrl("123")).toBeNull();
    expect(openLibraryCoverUrl(null)).toBeNull();
  });
});

describe("resolveBookCoverUrl", () => {
  it("prefers explicit coverUrl", () => {
    expect(
      resolveBookCoverUrl({
        coverUrl: " https://cdn.example/cover.jpg ",
        isbn: "9780131103627",
      }),
    ).toBe("https://cdn.example/cover.jpg");
  });

  it("falls back to Open Library", () => {
    expect(resolveBookCoverUrl({ isbn: "9780131103627" })).toContain(
      "covers.openlibrary.org",
    );
  });
});
