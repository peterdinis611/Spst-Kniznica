import { describe, expect, it } from "vitest";
import {
  buildAuthorMarkdown,
  buildBookMarkdown,
  buildCategoryMarkdown,
} from "@/lib/seo/entity-markdown";
import type {
  CatalogAuthor,
  CatalogBook,
  CatalogCategory,
} from "@/lib/catalog/mappers";

const book = {
  id: "book-1",
  title: "1984",
  author: "George Orwell",
  categoryName: "Sci-fi",
  year: 1949,
  isbn: "9780451524935",
  language: "sk",
  availableCopies: 2,
  totalCopies: 3,
  description: "Dystópia.",
  accent: "#000",
  secondary: "#fff",
  motif: "forest",
} as CatalogBook;

const author = {
  id: "author-1",
  name: "George Orwell",
  bio: "Anglický autor.",
  nationality: "GB",
  birthYear: 1903,
  isActive: true,
  accent: "#000",
  bookCount: 8,
} as CatalogAuthor;

const category = {
  id: "cat-1",
  name: "Sci-fi",
  description: "Budúcnosť.",
  accent: "#000",
  secondary: "#fff",
  motif: "forest",
  isActive: true,
  bookCount: 12,
} as CatalogCategory;

describe("entity markdown", () => {
  it("buildBookMarkdown includes biblio and .md-friendly links", () => {
    const md = buildBookMarkdown(book);
    expect(md.startsWith("# 1984\n")).toBe(true);
    expect(md).toContain("George Orwell");
    expect(md).toContain("/books/book-1");
    expect(md).toContain("ISBN");
  });

  it("buildAuthorMarkdown lists titles", () => {
    const md = buildAuthorMarkdown(author, ["1984", "Animal Farm"]);
    expect(md).toContain("## Tituly vo fonde");
    expect(md).toContain("- 1984");
  });

  it("buildCategoryMarkdown includes description", () => {
    const md = buildCategoryMarkdown(category, ["1984"]);
    expect(md.startsWith("# Sci-fi\n")).toBe(true);
    expect(md).toContain("Budúcnosť.");
  });
});
