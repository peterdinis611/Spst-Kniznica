import { describe, expect, it } from "vitest";
import {
  buildBooksCatalogHref,
  languageFilterLabel,
  parseBooksCatalogFilters,
  shelfZonesFromShelfCodes,
} from "@/lib/catalog/catalog-url";

describe("buildBooksCatalogHref", () => {
  it("returns bare path without filters", () => {
    expect(buildBooksCatalogHref({})).toBe("/books");
  });

  it("encodes query and flags", () => {
    expect(
      buildBooksCatalogHref({
        q: "  motor  ",
        categories: ["cat-1"],
        authors: ["a1"],
        shelf: "E",
        available: true,
      }),
    ).toBe("/books?q=motor&category=cat-1&author=a1&shelf=E&available=1");
  });

  it("joins multiple categories", () => {
    expect(
      buildBooksCatalogHref({
        categories: ["c1", "c2", "c1"],
      }),
    ).toBe("/books?category=c1%2Cc2");
  });

  it("joins multiple authors", () => {
    expect(
      buildBooksCatalogHref({
        authors: ["a1", "a2", "a1"],
      }),
    ).toBe("/books?author=a1%2Ca2");
  });

  it("encodes year and language", () => {
    expect(
      buildBooksCatalogHref({
        year: 2018,
        language: "en",
      }),
    ).toBe("/books?year=2018&lang=en");
  });

  it("omits available when false", () => {
    expect(buildBooksCatalogHref({ available: false, q: "x" })).toBe(
      "/books?q=x",
    );
  });
});

describe("parseBooksCatalogFilters", () => {
  it("parses search params", () => {
    const params = new URLSearchParams(
      "q=lean&category=c1&author=a1&shelf=e-12&available=1&year=2004&lang=sk",
    );
    expect(parseBooksCatalogFilters(params)).toEqual({
      q: "lean",
      categories: ["c1"],
      authors: ["a1"],
      shelf: "E-12",
      available: true,
      year: 2004,
      language: "sk",
    });
  });

  it("parses comma-separated categories", () => {
    expect(
      parseBooksCatalogFilters(new URLSearchParams("category=c1,c2,c1"))
        .categories,
    ).toEqual(["c1", "c2"]);
  });

  it("parses comma-separated authors", () => {
    expect(
      parseBooksCatalogFilters(new URLSearchParams("author=a1,a2,a1")).authors,
    ).toEqual(["a1", "a2"]);
  });

  it("ignores invalid year", () => {
    expect(
      parseBooksCatalogFilters(new URLSearchParams("year=abc")).year,
    ).toBeUndefined();
  });

  it("treats missing available as false", () => {
    expect(parseBooksCatalogFilters(new URLSearchParams()).available).toBe(
      false,
    );
  });
});

describe("languageFilterLabel", () => {
  it("maps known codes and passes through custom", () => {
    expect(languageFilterLabel("sk")).toBe("Slovenčina");
    expect(languageFilterLabel("hu")).toBe("hu");
  });
});

describe("shelfZonesFromShelfCodes", () => {
  it("extracts unique sorted tracts", () => {
    expect(
      shelfZonesFromShelfCodes(["e-12", "B-01", null, "E-03", "  ", "b-02"]),
    ).toEqual([
      { id: "B", label: "Trakt B" },
      { id: "E", label: "Trakt E" },
    ]);
  });
});
