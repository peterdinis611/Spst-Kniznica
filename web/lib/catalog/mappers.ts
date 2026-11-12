import type {
  AuthorDto,
  BookDetail,
  BookListItem,
  CategoryDto,
  CoverMotif,
} from "./types";

const COVER_PALETTES = [
  { accent: "#7BA08A", secondary: "#F3F7F2", motif: "crow" as const },
  { accent: "#1F4E8C", secondary: "#F6E27A", motif: "yellow" as const },
  { accent: "#0E1A24", secondary: "#E8EEF2", motif: "forest" as const },
  { accent: "#1C6B7A", secondary: "#F2D66B", motif: "glass" as const },
  { accent: "#3A1D22", secondary: "#E8D8CF", motif: "silhouette" as const },
  { accent: "#7A4E2D", secondary: "#F5EADF", motif: "abstract" as const },
] as const;

function paletteFor(seed: string, index = 0) {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash + seed.charCodeAt(i) * (i + 1)) % 997;
  }
  return COVER_PALETTES[(hash + index) % COVER_PALETTES.length];
}

export type CatalogBook = {
  id: string;
  title: string;
  author: string;
  authorId?: string | null;
  categoryId?: string | null;
  categoryName?: string | null;
  year?: number | null;
  description?: string | null;
  accent: string;
  secondary: string;
  motif: CoverMotif;
  availableCopies: number;
  totalCopies: number;
};

export type CatalogAuthor = {
  id: string;
  name: string;
  bio: string;
  nationality: string;
  birthYear?: number | null;
  accent: string;
  bookCount: number;
};

export type CatalogCategory = {
  id: string;
  name: string;
  description: string;
  accent: string;
  secondary: string;
  motif: CoverMotif;
  bookCount: number;
};

export function mapBookListItem(
  book: BookListItem,
  index = 0,
): CatalogBook {
  const palette = paletteFor(book.id || book.title, index);
  return {
    id: book.id,
    title: book.title,
    author: book.author || "Neznámy autor",
    authorId: book.authorId,
    categoryId: book.categoryId,
    categoryName: book.categoryName,
    year: book.publishedYear,
    accent: palette.accent,
    secondary: palette.secondary,
    motif: palette.motif,
    availableCopies: book.availableCopies,
    totalCopies: book.totalCopies,
  };
}

export function mapBookDetail(book: BookDetail, index = 0): CatalogBook {
  return {
    ...mapBookListItem(book, index),
    description: book.description,
  };
}

export function mapAuthor(author: AuthorDto, index = 0): CatalogAuthor {
  const palette = paletteFor(author.id || author.name, index);
  return {
    id: author.id,
    name: author.name,
    bio: author.biography?.trim() || "Bez biografie.",
    nationality: author.nationality?.trim() || "—",
    birthYear: author.birthYear,
    accent: palette.accent,
    bookCount: 0,
  };
}

export function mapCategory(
  category: CategoryDto,
  index = 0,
  bookCount = 0,
): CatalogCategory {
  const palette = paletteFor(category.id || category.name, index);
  return {
    id: category.id,
    name: category.name,
    description: category.description?.trim() || "Bez popisu.",
    accent: category.color?.trim() || palette.accent,
    secondary: palette.secondary,
    motif: palette.motif,
    bookCount,
  };
}
