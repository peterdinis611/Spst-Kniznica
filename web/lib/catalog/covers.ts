/** Open Library cover URL helper (mirrors backend OpenLibraryCovers). */
export function openLibraryCoverUrl(
  isbn: string | null | undefined,
  size: "S" | "M" | "L" = "L",
): string | null {
  if (!isbn?.trim()) return null;
  const normalized = isbn.replace(/[^0-9Xx]/g, "").toUpperCase();
  if (normalized.length !== 10 && normalized.length !== 13) return null;
  return `https://covers.openlibrary.org/b/isbn/${normalized}-${size}.jpg`;
}

export function resolveBookCoverUrl(book: {
  coverUrl?: string | null;
  isbn?: string | null;
}): string | null {
  if (book.coverUrl?.trim()) return book.coverUrl.trim();
  return openLibraryCoverUrl(book.isbn);
}
