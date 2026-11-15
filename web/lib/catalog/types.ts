export type BookListItem = {
  id: string;
  title: string;
  subtitle?: string | null;
  authorId?: string | null;
  author: string;
  publisher?: string | null;
  isbn?: string | null;
  publishedYear?: number | null;
  language?: string | null;
  categoryId?: string | null;
  categoryName?: string | null;
  format?: number | string;
  coverUrl?: string | null;
  shelfLocation?: string | null;
  totalCopies: number;
  availableCopies: number;
  updatedAt?: string;
};

export type BookCopyStatus = 0 | 1 | 2 | 3 | 4 | string;

export type BookCopy = {
  id: string;
  inventoryNumber: string;
  barcode?: string | null;
  status: BookCopyStatus;
  shelfLocation?: string | null;
};

export type BookCopyStatusSummary = {
  available: number;
  borrowed: number;
  reserved: number;
  lost: number;
  maintenance: number;
};

export type BookDetail = BookListItem & {
  description?: string | null;
  pageCount?: number | null;
  formatLabel?: string | null;
  copySummary?: BookCopyStatusSummary | null;
  createdAt?: string;
  updatedAt?: string;
  copies?: BookCopy[];
};

export type AuthorDto = {
  id: string;
  name: string;
  biography?: string | null;
  nationality?: string | null;
  birthYear?: number | null;
  wikidataId?: string | null;
  viafId?: string | null;
  profileUrl?: string | null;
  isActive: boolean;
  bookCount?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type CategoryDto = {
  id: string;
  name: string;
  description?: string | null;
  color?: string | null;
  isActive: boolean;
  bookCount?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type CoverMotif =
  | "crow"
  | "yellow"
  | "forest"
  | "glass"
  | "silhouette"
  | "abstract";

export type CarouselBook = {
  id: string;
  title: string;
  author: string;
  accent: string;
  secondary: string;
  motif?: CoverMotif;
};
