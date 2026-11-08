import Fuse from "fuse.js";
import {
  MOCK_AUTHORS,
  MOCK_BOOKS,
  MOCK_CATEGORIES,
  type MockAuthor,
  type MockBook,
  type MockCategory,
} from "@/lib/catalog-mock";

const bookFuse = new Fuse(MOCK_BOOKS, {
  keys: [
    { name: "title", weight: 0.5 },
    { name: "author", weight: 0.3 },
    { name: "categoryName", weight: 0.2 },
  ],
  threshold: 0.38,
  ignoreLocation: true,
  minMatchCharLength: 1,
});

const authorFuse = new Fuse(MOCK_AUTHORS, {
  keys: [
    { name: "name", weight: 0.55 },
    { name: "bio", weight: 0.3 },
    { name: "nationality", weight: 0.15 },
  ],
  threshold: 0.38,
  ignoreLocation: true,
  minMatchCharLength: 1,
});

const categoryFuse = new Fuse(MOCK_CATEGORIES, {
  keys: [
    { name: "name", weight: 0.65 },
    { name: "description", weight: 0.35 },
  ],
  threshold: 0.38,
  ignoreLocation: true,
  minMatchCharLength: 1,
});

export function searchBooks(
  query?: string,
  categoryId?: string,
): MockBook[] {
  const q = query?.trim();
  let results = q
    ? bookFuse.search(q).map((hit) => hit.item)
    : [...MOCK_BOOKS];

  if (categoryId) {
    results = results.filter((book) => book.categoryId === categoryId);
  }

  return results;
}

export function searchAuthors(
  query?: string,
  letter?: string,
): MockAuthor[] {
  const q = query?.trim();
  const initial = letter?.trim().charAt(0).toUpperCase();

  let results = q
    ? authorFuse.search(q).map((hit) => hit.item)
    : [...MOCK_AUTHORS];

  if (initial) {
    results = results.filter(
      (author) => author.name.charAt(0).toUpperCase() === initial,
    );
  }

  return results.sort((a, b) => a.name.localeCompare(b.name, "sk"));
}

export function searchCategories(query?: string): MockCategory[] {
  const q = query?.trim();
  if (!q) return [...MOCK_CATEGORIES];
  return categoryFuse.search(q).map((hit) => hit.item);
}
