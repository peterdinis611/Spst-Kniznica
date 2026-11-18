import {
  createLoader,
  createParser,
  createSerializer,
  parseAsInteger,
  parseAsString,
  type inferParserType,
} from "nuqs/server";

export type BooksCatalogFilters = {
  q?: string;
  /** Selected category ids (multi). */
  categories?: string[];
  /** Selected author ids (multi). */
  authors?: string[];
  shelf?: string;
  available?: boolean;
  year?: number;
  language?: string;
};

const LANGUAGE_LABELS: Record<string, string> = {
  sk: "Slovenčina",
  en: "Angličtina",
  cs: "Čeština",
  de: "Nemčina",
};

export function languageFilterLabel(code: string): string {
  const key = code.trim().toLowerCase();
  return LANGUAGE_LABELS[key] ?? code.trim();
}

function normalizeIds(ids: string[] | undefined): string[] {
  if (!ids?.length) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of ids) {
    const id = raw.trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

/** Comma-separated ids (`c1,c2`), deduped — matches historical catalog URLs. */
export const parseAsIdList = createParser({
  parse(queryValue) {
    return normalizeIds(queryValue.split(/[,\s]+/).filter(Boolean));
  },
  serialize(value) {
    return normalizeIds(value).join(",");
  },
  eq(a, b) {
    const left = normalizeIds(a);
    const right = normalizeIds(b);
    return (
      left.length === right.length && left.every((id, i) => id === right[i])
    );
  },
}).withDefault([]);

/** Shelf / tract codes are stored uppercased (`e-12` → `E-12`). */
export const parseAsShelfCode = createParser({
  parse(queryValue) {
    const trimmed = queryValue.trim();
    return trimmed ? trimmed.toUpperCase() : null;
  },
  serialize(value) {
    return value;
  },
});

/** Boolean flag encoded as `available=1` (absent / default = false). */
export const parseAsOneFlag = createParser({
  parse(queryValue) {
    if (queryValue === "1" || queryValue === "true") return true;
    if (queryValue === "0" || queryValue === "false") return false;
    return null;
  },
  serialize(value) {
    return value ? "1" : "0";
  },
}).withDefault(false);

export const booksCatalogParsers = {
  q: parseAsString,
  category: parseAsIdList,
  author: parseAsIdList,
  shelf: parseAsShelfCode,
  available: parseAsOneFlag,
  year: parseAsInteger,
  lang: parseAsString,
};

export const authorsCatalogParsers = {
  q: parseAsString,
  letter: parseAsString,
};

export const categoriesCatalogParsers = {
  q: parseAsString,
};

export const bookingsDeskParsers = {
  book: parseAsString,
  scan: parseAsOneFlag,
  code: parseAsString,
};

export type BooksCatalogQuery = inferParserType<typeof booksCatalogParsers>;

const loadBooksCatalog = createLoader(booksCatalogParsers);
const serializeBooksCatalog = createSerializer(booksCatalogParsers);

export function booksFiltersFromQuery(
  state: BooksCatalogQuery,
): BooksCatalogFilters {
  const categories = normalizeIds(state.category);
  const authors = normalizeIds(state.author);
  const q = state.q?.trim();
  const language = state.lang?.trim();

  return {
    q: q || undefined,
    categories: categories.length ? categories : undefined,
    authors: authors.length ? authors : undefined,
    shelf: state.shelf ?? undefined,
    available: state.available,
    year: state.year ?? undefined,
    language: language || undefined,
  };
}

export type BooksCatalogQueryPatch = {
  q?: string | null;
  category?: string[] | null;
  author?: string[] | null;
  shelf?: string | null;
  available?: boolean | null;
  year?: number | null;
  lang?: string | null;
};

/** Partial nuqs patch from filter fields (null clears the URL key). */
export function booksQueryPatchFromFilters(
  filters: Partial<BooksCatalogFilters>,
): BooksCatalogQueryPatch {
  const patch: BooksCatalogQueryPatch = {};

  if ("q" in filters) {
    const q = filters.q?.trim();
    patch.q = q || null;
  }
  if ("categories" in filters) {
    const ids = normalizeIds(filters.categories);
    patch.category = ids.length ? ids : null;
  }
  if ("authors" in filters) {
    const ids = normalizeIds(filters.authors);
    patch.author = ids.length ? ids : null;
  }
  if ("shelf" in filters) {
    patch.shelf = filters.shelf?.trim()
      ? filters.shelf.trim().toUpperCase()
      : null;
  }
  if ("available" in filters) {
    patch.available = filters.available ? true : null;
  }
  if ("year" in filters) {
    patch.year =
      filters.year != null && Number.isFinite(filters.year)
        ? filters.year
        : null;
  }
  if ("language" in filters) {
    const lang = filters.language?.trim();
    patch.lang = lang || null;
  }

  return patch;
}

export function buildBooksCatalogHref(filters: BooksCatalogFilters): string {
  return serializeBooksCatalog("/books", booksQueryPatchFromFilters(filters));
}

export function parseBooksCatalogFilters(
  searchParams: URLSearchParams,
): BooksCatalogFilters {
  return booksFiltersFromQuery(loadBooksCatalog(searchParams));
}

export function shelfZonesFromShelfCodes(
  shelves: Array<string | null | undefined>,
): Array<{ id: string; label: string }> {
  const zones = new Set<string>();
  for (const shelf of shelves) {
    if (!shelf?.trim()) continue;
    const zone = shelf.trim().split("-")[0]?.toUpperCase();
    if (zone) zones.add(zone);
  }
  return [...zones]
    .sort((a, b) => a.localeCompare(b, "sk"))
    .map((id) => ({
      id,
      label: `Trakt ${id}`,
    }));
}
