import { apiGet, withQuery } from "@/lib/api";
import type { PagedResult } from "@/lib/shared";

type SitemapEntity = {
  id: string;
  updatedAt?: string | null;
};

const PAGE_SIZE = 100;
const MAX_PAGES = 50;

async function fetchAllIds(path: string): Promise<SitemapEntity[]> {
  const items: SitemapEntity[] = [];

  for (let page = 1; page <= MAX_PAGES; page += 1) {
    try {
      const result = await apiGet<PagedResult<SitemapEntity>>(
        withQuery(path, {
          page,
          pageSize: PAGE_SIZE,
          sortBy: "updatedAt",
          sortDir: "desc",
        }),
      );

      const batch = result.items ?? [];
      items.push(...batch);

      if (batch.length === 0 || items.length >= (result.totalCount ?? 0)) {
        break;
      }
      if (batch.length < PAGE_SIZE) break;
    } catch {
      break;
    }
  }

  return items;
}

export async function fetchSitemapCatalog() {
  const [books, authors, categories] = await Promise.all([
    fetchAllIds("/api/books"),
    fetchAllIds("/api/authors"),
    fetchAllIds("/api/categories"),
  ]);

  return { books, authors, categories };
}
