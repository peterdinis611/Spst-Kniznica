"use server";

import { searchBooksCursorAction } from "@/lib/catalog/actions";

export type CatalogBookRef = {
  id: string;
  title: string;
  author: string;
};

const PAGE_LIMIT = 100;
const MAX_PAGES = 50;

/** Loads id/title/author for every catalog title (cursor pages, safety-capped). */
export async function loadCatalogRefs(): Promise<CatalogBookRef[]> {
  const refs: CatalogBookRef[] = [];
  let cursor: string | undefined;
  let pages = 0;

  while (pages < MAX_PAGES) {
    const result = await searchBooksCursorAction({ limit: PAGE_LIMIT, cursor });
    const data = result?.data;
    if (!data) break;

    for (const item of data.items) {
      refs.push({
        id: item.id,
        title: item.title,
        author: item.author,
      });
    }

    pages += 1;
    if (!data.hasMore || !data.nextCursor) break;
    cursor = data.nextCursor;
  }

  return refs;
}
