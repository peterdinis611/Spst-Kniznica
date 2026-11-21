/** True when catalog list URL has filter/search query → avoid indexing duplicates. */
export function catalogSearchParamsAreFiltered(
  searchParams: Record<string, string | string[] | undefined>,
  keys: readonly string[],
): boolean {
  return keys.some((key) => {
    const value = searchParams[key];
    if (value == null) return false;
    if (Array.isArray(value)) return value.some((item) => item.trim() !== "");
    return value.trim() !== "";
  });
}

export const BOOKS_FILTER_QUERY_KEYS = [
  "q",
  "category",
  "author",
  "shelf",
  "available",
  "year",
  "lang",
] as const;

export const AUTHORS_FILTER_QUERY_KEYS = ["q", "letter"] as const;

export const CATEGORIES_FILTER_QUERY_KEYS = ["q"] as const;
