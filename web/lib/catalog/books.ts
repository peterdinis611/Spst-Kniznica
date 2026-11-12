import { apiGet, withQuery } from "@/lib/api";
import type { PagedResult } from "@/lib/shared";
import { mapBookListItem, type CatalogBook } from "./mappers";
import type { BookDetail, BookListItem, CarouselBook } from "./types";

export function toCarouselBooks(
  items: Array<BookListItem | CatalogBook>,
): CarouselBook[] {
  return items.slice(0, 7).map((book, index) => {
    if ("accent" in book && "secondary" in book) {
      return {
        id: book.id,
        title: book.title,
        author: book.author,
        accent: book.accent,
        secondary: book.secondary,
        motif: book.motif,
      };
    }

    const mapped = mapBookListItem(book, index);
    return {
      id: mapped.id,
      title: mapped.title,
      author: mapped.author,
      accent: mapped.accent,
      secondary: mapped.secondary,
      motif: mapped.motif,
    };
  });
}

export async function fetchCarouselBooks(): Promise<CarouselBook[]> {
  const result = await apiGet<PagedResult<BookListItem>>(
    withQuery("/api/books", {
      page: 1,
      pageSize: 7,
      sortBy: "title",
      sortDir: "asc",
    }),
  );
  return toCarouselBooks(result.items ?? []);
}

export async function fetchBookDetail(id: string): Promise<BookDetail | null> {
  try {
    return await apiGet<BookDetail>(`/api/books/${id}`);
  } catch {
    return null;
  }
}
