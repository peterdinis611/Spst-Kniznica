import { describe, expect, it } from "vitest";
import { openLibraryCoverUrl, resolveBookCoverUrl } from "@/lib/catalog/covers";

describe("cover size strategy", () => {
  it("uses M for list density and L for detail", () => {
    const isbn = "9780131103627";
    expect(openLibraryCoverUrl(isbn, "M")).toBe(
      "https://covers.openlibrary.org/b/isbn/9780131103627-M.jpg",
    );
    expect(openLibraryCoverUrl(isbn, "L")).toBe(
      "https://covers.openlibrary.org/b/isbn/9780131103627-L.jpg",
    );
  });

  it("does not invent a cover without isbn or coverUrl", () => {
    expect(resolveBookCoverUrl({})).toBeNull();
    expect(resolveBookCoverUrl({ coverUrl: "   " })).toBeNull();
  });

  it("accepts ISBN-10 with X check digit", () => {
    expect(openLibraryCoverUrl("0-306-40615-X")).toBe(
      "https://covers.openlibrary.org/b/isbn/030640615X-L.jpg",
    );
  });
});
