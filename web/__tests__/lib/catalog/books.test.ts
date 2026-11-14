import { describe, expect, it } from "vitest";
import { toCarouselBooks } from "@/lib/catalog/books";
import type { CatalogBook } from "@/lib/catalog/mappers";
import type { BookListItem } from "@/lib/catalog/types";

describe("toCarouselBooks", () => {
  it("maps dto items into carousel books", () => {
    const items: BookListItem[] = Array.from({ length: 3 }, (_, index) => ({
      id: `b-${index}`,
      title: `Titul ${index}`,
      author: `Autor ${index}`,
      totalCopies: 1,
      availableCopies: 1,
    }));

    const carousel = toCarouselBooks(items);
    expect(carousel).toHaveLength(3);
    expect(carousel[0]).toMatchObject({
      id: "b-0",
      title: "Titul 0",
      author: "Autor 0",
    });
    expect(carousel[0]?.accent).toBeTruthy();
  });

  it("keeps already mapped catalog books", () => {
    const catalog: CatalogBook = {
      id: "c1",
      title: "Katalóg",
      author: "SPST",
      accent: "#111111",
      secondary: "#eeeeee",
      motif: "crow",
      availableCopies: 1,
      totalCopies: 1,
    };

    expect(toCarouselBooks([catalog])[0]).toMatchObject({
      id: "c1",
      accent: "#111111",
      secondary: "#eeeeee",
      motif: "crow",
    });
  });

  it("caps the carousel at 7 items", () => {
    const items: BookListItem[] = Array.from({ length: 12 }, (_, index) => ({
      id: `b-${index}`,
      title: `Titul ${index}`,
      author: "Autor",
      totalCopies: 1,
      availableCopies: 1,
    }));
    expect(toCarouselBooks(items)).toHaveLength(7);
  });
});
