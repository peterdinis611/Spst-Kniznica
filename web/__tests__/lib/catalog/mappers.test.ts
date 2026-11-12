import { describe, expect, it } from "vitest";
import {
  mapAuthor,
  mapBookDetail,
  mapBookListItem,
  mapCategory,
} from "@/lib/catalog/mappers";
import type {
  AuthorDto,
  BookDetail,
  BookListItem,
  CategoryDto,
} from "@/lib/catalog/types";

const book: BookListItem = {
  id: "book-1",
  title: "Elektrotechnika I",
  author: "Ján Kováč",
  authorId: "author-1",
  categoryId: "cat-1",
  categoryName: "Elektrotechnika",
  publishedYear: 2020,
  totalCopies: 3,
  availableCopies: 2,
};

describe("mapBookListItem / mapBookDetail", () => {
  it("maps catalog fields and fills cover palette", () => {
    const mapped = mapBookListItem(book, 0);
    expect(mapped).toMatchObject({
      id: "book-1",
      title: "Elektrotechnika I",
      author: "Ján Kováč",
      authorId: "author-1",
      categoryId: "cat-1",
      categoryName: "Elektrotechnika",
      year: 2020,
      availableCopies: 2,
      totalCopies: 3,
    });
    expect(mapped.accent).toMatch(/^#/);
    expect(mapped.secondary).toMatch(/^#/);
    expect(mapped.motif).toBeTruthy();
  });

  it("falls back to unknown author", () => {
    expect(mapBookListItem({ ...book, author: "" }).author).toBe(
      "Neznámy autor",
    );
  });

  it("keeps description on detail mapping", () => {
    const detail: BookDetail = {
      ...book,
      description: "Úvod do obvodov.",
    };
    expect(mapBookDetail(detail).description).toBe("Úvod do obvodov.");
  });

  it("is stable for the same seed", () => {
    expect(mapBookListItem(book, 0)).toEqual(mapBookListItem(book, 0));
  });
});

describe("mapAuthor", () => {
  it("maps author dto with defaults", () => {
    const author: AuthorDto = {
      id: "a1",
      name: "Ján Kováč",
      biography: null,
      nationality: null,
      birthYear: 1975,
      isActive: true,
    };
    expect(mapAuthor(author)).toMatchObject({
      id: "a1",
      name: "Ján Kováč",
      bio: "Bez biografie.",
      nationality: "—",
      birthYear: 1975,
      bookCount: 0,
    });
  });
});

describe("mapCategory", () => {
  it("prefers category color when present", () => {
    const category: CategoryDto = {
      id: "c1",
      name: "Strojárstvo",
      description: "  ",
      color: "#112233",
      isActive: true,
    };
    const mapped = mapCategory(category, 0, 12);
    expect(mapped).toMatchObject({
      id: "c1",
      name: "Strojárstvo",
      description: "Bez popisu.",
      accent: "#112233",
      bookCount: 12,
    });
  });
});
