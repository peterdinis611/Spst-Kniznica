import { describe, expect, it } from "vitest";
import {
  COPY_STATUS_LABEL,
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

  it("maps format enum and explicit formatLabel", () => {
    expect(mapBookListItem({ ...book, format: 0 }).formatLabel).toBe(
      "Brožovaná",
    );
    expect(mapBookListItem({ ...book, format: 2 }).formatLabel).toBe("E-kniha");
    expect(
      mapBookListItem({ ...book, format: 1, formatLabel: "  Viazaná  " })
        .formatLabel,
    ).toBe("Viazaná");
  });

  it("aggregates copy summary from copies when missing", () => {
    const detail: BookDetail = {
      ...book,
      copies: [
        {
          id: "c1",
          inventoryNumber: "INV-1",
          status: 0,
        },
        {
          id: "c2",
          inventoryNumber: "INV-2",
          status: 1,
        },
        {
          id: "c3",
          inventoryNumber: "INV-3",
          status: 2,
        },
      ],
    };
    expect(mapBookDetail(detail).copySummary).toEqual({
      available: 1,
      borrowed: 1,
      reserved: 1,
      lost: 0,
      maintenance: 0,
    });
  });

  it("prefers server copySummary including PascalCase", () => {
    const detail: BookDetail = {
      ...book,
      copySummary: {
        Available: 4,
        Borrowed: 1,
        reserved: 0,
        lost: 0,
        maintenance: 0,
      } as BookDetail["copySummary"],
      copies: [],
    };
    expect(mapBookDetail(detail).copySummary).toMatchObject({
      available: 4,
      borrowed: 1,
    });
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

  it("keeps authority links and book count", () => {
    const mapped = mapAuthor({
      id: "a2",
      name: "Morgan Housel",
      biography: "Esejista.",
      nationality: "US",
      birthYear: 1984,
      isActive: true,
      wikidataId: "Q42",
      viafId: "123",
      profileUrl: "https://www.wikidata.org/wiki/Q42",
      bookCount: 7,
    });
    expect(mapped).toMatchObject({
      bio: "Esejista.",
      wikidataId: "Q42",
      viafId: "123",
      bookCount: 7,
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

  it("falls back to dto bookCount when override missing", () => {
    expect(
      mapCategory({
        id: "c2",
        name: "Matematika",
        description: "Algebra",
        isActive: true,
        bookCount: 9,
      }).bookCount,
    ).toBe(9);
  });
});

describe("COPY_STATUS_LABEL", () => {
  it("covers every copy status code", () => {
    expect(COPY_STATUS_LABEL[0]).toBe("Dostupný");
    expect(COPY_STATUS_LABEL[1]).toBe("Požičaný");
    expect(COPY_STATUS_LABEL[4]).toBe("Údržba");
  });
});
