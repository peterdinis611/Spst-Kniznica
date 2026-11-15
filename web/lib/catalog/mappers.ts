import type {
  AuthorDto,
  BookCopy,
  BookCopyStatusSummary,
  BookDetail,
  BookListItem,
  CategoryDto,
  CoverMotif,
} from "./types";

const COVER_PALETTES = [
  { accent: "#7BA08A", secondary: "#F3F7F2", motif: "crow" as const },
  { accent: "#1F4E8C", secondary: "#D8E8F0", motif: "abstract" as const },
  { accent: "#0E1A24", secondary: "#E8EEF2", motif: "forest" as const },
  { accent: "#1C6B7A", secondary: "#C5E4E8", motif: "glass" as const },
  { accent: "#3A1D22", secondary: "#E8D8CF", motif: "silhouette" as const },
  { accent: "#7A4E2D", secondary: "#F5EADF", motif: "abstract" as const },
] as const;

function paletteFor(seed: string, index = 0) {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash + seed.charCodeAt(i) * (i + 1)) % 997;
  }
  const palette = COVER_PALETTES[(hash + index) % COVER_PALETTES.length];
  return palette ?? COVER_PALETTES[0];
}

const FORMAT_LABELS: Record<number, string> = {
  0: "Brožovaná",
  1: "Viazaná",
  2: "E-kniha",
  3: "Iné",
};

export const COPY_STATUS_LABEL: Record<number, string> = {
  0: "Dostupný",
  1: "Požičaný",
  2: "Rezervovaný",
  3: "Stratený",
  4: "Údržba",
};

function formatLabelFrom(book: BookDetail | BookListItem): string | null {
  if ("formatLabel" in book && book.formatLabel?.trim()) {
    return book.formatLabel.trim();
  }
  if (typeof book.format === "number") {
    return FORMAT_LABELS[book.format] ?? null;
  }
  if (typeof book.format === "string" && book.format.trim()) {
    return book.format.trim();
  }
  return null;
}

function mapCopySummary(
  summary: BookCopyStatusSummary | null | undefined,
  copies: BookCopy[] | undefined,
): BookCopyStatusSummary {
  if (summary) {
    const raw = summary as BookCopyStatusSummary & {
      Available?: number;
      Borrowed?: number;
      Reserved?: number;
      Lost?: number;
      Maintenance?: number;
    };
    return {
      available: raw.available ?? raw.Available ?? 0,
      borrowed: raw.borrowed ?? raw.Borrowed ?? 0,
      reserved: raw.reserved ?? raw.Reserved ?? 0,
      lost: raw.lost ?? raw.Lost ?? 0,
      maintenance: raw.maintenance ?? raw.Maintenance ?? 0,
    };
  }

  const empty = {
    available: 0,
    borrowed: 0,
    reserved: 0,
    lost: 0,
    maintenance: 0,
  };
  if (!copies?.length) return empty;

  for (const copy of copies) {
    const status =
      typeof copy.status === "number"
        ? copy.status
        : Number.parseInt(String(copy.status), 10);
    if (status === 0) empty.available += 1;
    else if (status === 1) empty.borrowed += 1;
    else if (status === 2) empty.reserved += 1;
    else if (status === 3) empty.lost += 1;
    else if (status === 4) empty.maintenance += 1;
  }
  return empty;
}

export type CatalogBook = {
  id: string;
  title: string;
  subtitle?: string | null;
  author: string;
  authorId?: string | null;
  categoryId?: string | null;
  categoryName?: string | null;
  publisher?: string | null;
  shelfLocation?: string | null;
  year?: number | null;
  description?: string | null;
  isbn?: string | null;
  language?: string | null;
  pageCount?: number | null;
  formatLabel?: string | null;
  coverUrl?: string | null;
  accent: string;
  secondary: string;
  motif: CoverMotif;
  availableCopies: number;
  totalCopies: number;
  copySummary?: BookCopyStatusSummary;
  copies?: BookCopy[];
};

export type CatalogAuthor = {
  id: string;
  name: string;
  bio: string;
  nationality: string;
  birthYear?: number | null;
  profileUrl?: string | null;
  wikidataId?: string | null;
  viafId?: string | null;
  isActive: boolean;
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
  isActive: boolean;
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
    subtitle: book.subtitle,
    author: book.author || "Neznámy autor",
    authorId: book.authorId,
    categoryId: book.categoryId,
    categoryName: book.categoryName,
    publisher: book.publisher,
    shelfLocation: book.shelfLocation,
    year: book.publishedYear,
    isbn: book.isbn,
    language: book.language,
    formatLabel: formatLabelFrom(book),
    coverUrl: book.coverUrl,
    accent: palette.accent,
    secondary: palette.secondary,
    motif: palette.motif,
    availableCopies: book.availableCopies,
    totalCopies: book.totalCopies,
  };
}

export function mapBookDetail(book: BookDetail, index = 0): CatalogBook {
  const copies = book.copies ?? [];
  return {
    ...mapBookListItem(book, index),
    description: book.description,
    pageCount: book.pageCount,
    formatLabel: formatLabelFrom(book),
    copySummary: mapCopySummary(book.copySummary, copies),
    copies,
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
    profileUrl: author.profileUrl,
    wikidataId: author.wikidataId,
    viafId: author.viafId,
    isActive: author.isActive !== false,
    accent: palette.accent,
    bookCount: author.bookCount ?? 0,
  };
}

export function mapCategory(
  category: CategoryDto,
  index = 0,
  bookCount?: number,
): CatalogCategory {
  const palette = paletteFor(category.id || category.name, index);
  return {
    id: category.id,
    name: category.name,
    description: category.description?.trim() || "Bez popisu.",
    accent: category.color?.trim() || palette.accent,
    secondary: palette.secondary,
    motif: palette.motif,
    isActive: category.isActive !== false,
    bookCount: bookCount ?? category.bookCount ?? 0,
  };
}
