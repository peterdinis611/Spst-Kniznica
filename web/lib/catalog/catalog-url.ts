export type BooksCatalogFilters = {
  q?: string;
  category?: string;
  author?: string;
  shelf?: string;
  available?: boolean;
};

export function buildBooksCatalogHref(filters: BooksCatalogFilters): string {
  const params = new URLSearchParams();
  const q = filters.q?.trim();
  if (q) params.set("q", q);
  if (filters.category) params.set("category", filters.category);
  if (filters.author) params.set("author", filters.author);
  if (filters.shelf) params.set("shelf", filters.shelf);
  if (filters.available) params.set("available", "1");
  const qs = params.toString();
  return qs ? `/books?${qs}` : "/books";
}

export function parseBooksCatalogFilters(
  searchParams: URLSearchParams,
): BooksCatalogFilters {
  return {
    q: searchParams.get("q") ?? undefined,
    category: searchParams.get("category") ?? undefined,
    author: searchParams.get("author") ?? undefined,
    shelf: searchParams.get("shelf")?.toUpperCase() ?? undefined,
    available: searchParams.get("available") === "1",
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
