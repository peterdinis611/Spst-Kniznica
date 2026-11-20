"use server";

import { apiPost } from "@/lib/api";
import type { CatalogBookRef } from "@/lib/catalog/load-catalog-refs";

type BookSummaryDto = {
  bookId: string;
  title: string;
  author: string;
};

const CHUNK = 100;

/** Resolve id/title/author via POST /api/books/summaries (no full catalog scan). */
export async function fetchBookSummaries(
  ids: string[],
): Promise<CatalogBookRef[]> {
  const unique = [
    ...new Set(ids.map((id) => id.trim()).filter(Boolean)),
  ].slice(0, 500);
  if (unique.length === 0) return [];

  const refs: CatalogBookRef[] = [];
  for (let i = 0; i < unique.length; i += CHUNK) {
    const chunk = unique.slice(i, i + CHUNK);
    const items = await apiPost<BookSummaryDto[]>(
      "/api/books/summaries",
      { ids: chunk },
      undefined,
      undefined,
      { skipStatusRedirect: true },
    );
    for (const item of items) {
      refs.push({
        id: item.bookId,
        title: item.title,
        author: item.author,
      });
    }
  }
  return refs;
}
