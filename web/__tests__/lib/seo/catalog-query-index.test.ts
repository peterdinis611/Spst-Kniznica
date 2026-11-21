import { describe, expect, it } from "vitest";
import {
  BOOKS_FILTER_QUERY_KEYS,
  catalogSearchParamsAreFiltered,
} from "@/lib/seo/catalog-query-index";

describe("catalogSearchParamsAreFiltered", () => {
  it("treats empty catalog as indexable", () => {
    expect(catalogSearchParamsAreFiltered({}, BOOKS_FILTER_QUERY_KEYS)).toBe(
      false,
    );
  });

  it("detects search and facet filters", () => {
    expect(
      catalogSearchParamsAreFiltered({ q: "orwell" }, BOOKS_FILTER_QUERY_KEYS),
    ).toBe(true);
    expect(
      catalogSearchParamsAreFiltered(
        { category: "cat-1" },
        BOOKS_FILTER_QUERY_KEYS,
      ),
    ).toBe(true);
    expect(
      catalogSearchParamsAreFiltered(
        { available: "1" },
        BOOKS_FILTER_QUERY_KEYS,
      ),
    ).toBe(true);
  });

  it("ignores blank values", () => {
    expect(
      catalogSearchParamsAreFiltered({ q: "  " }, BOOKS_FILTER_QUERY_KEYS),
    ).toBe(false);
  });
});
