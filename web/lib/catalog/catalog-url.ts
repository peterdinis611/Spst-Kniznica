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

function setIdListParam(
  params: URLSearchParams,
  key: string,
  ids: string[] | undefined,
) {
  const normalized = normalizeIds(ids);
  if (normalized.length === 1) {
    params.set(key, normalized[0]!);
  } else if (normalized.length > 1) {
    params.set(key, normalized.join(","));
  }
}

function parseIdListParam(
  searchParams: URLSearchParams,
  key: string,
): string[] {
  const raw = searchParams.get(key) ?? "";
  return normalizeIds(
    raw
      ? raw.split(/[,\s]+/).filter(Boolean)
      : searchParams.getAll(key),
  );
}

export function buildBooksCatalogHref(filters: BooksCatalogFilters): string {
  const params = new URLSearchParams();
  const q = filters.q?.trim();
  if (q) params.set("q", q);
  setIdListParam(params, "category", filters.categories);
  setIdListParam(params, "author", filters.authors);
  if (filters.shelf) params.set("shelf", filters.shelf);
  if (filters.available) params.set("available", "1");
  if (filters.year != null && Number.isFinite(filters.year)) {
    params.set("year", String(filters.year));
  }
  const lang = filters.language?.trim();
  if (lang) params.set("lang", lang);
  const qs = params.toString();
  return qs ? `/books?${qs}` : "/books";
}

export function parseBooksCatalogFilters(
  searchParams: URLSearchParams,
): BooksCatalogFilters {
  const categories = parseIdListParam(searchParams, "category");
  const authors = parseIdListParam(searchParams, "author");

  return {
    q: searchParams.get("q") ?? undefined,
    categories: categories.length ? categories : undefined,
    authors: authors.length ? authors : undefined,
    shelf: searchParams.get("shelf")?.toUpperCase() ?? undefined,
    available: searchParams.get("available") === "1",
    year: (() => {
      const raw = searchParams.get("year");
      if (!raw) return undefined;
      const value = Number.parseInt(raw, 10);
      return Number.isFinite(value) ? value : undefined;
    })(),
    language: searchParams.get("lang")?.trim() || undefined,
  };
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
