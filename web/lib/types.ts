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
  shelfLocation?: string | null;
  totalCopies: number;
  availableCopies: number;
};

export type BookDetail = BookListItem & {
  description?: string | null;
  pageCount?: number | null;
  createdAt?: string;
  updatedAt?: string;
  copies?: Array<{
    id: string;
    inventoryNumber: string;
    barcode?: string | null;
    status: number | string;
    shelfLocation?: string | null;
  }>;
};

export type AuthorDto = {
  id: string;
  name: string;
  biography?: string | null;
  nationality?: string | null;
  birthYear?: number | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type CategoryDto = {
  id: string;
  name: string;
  description?: string | null;
  color?: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type BookingDto = {
  id: string;
  bookId: string;
  bookCopyId?: string | null;
  borrowerName: string;
  borrowerEmail: string;
  status: number | string;
  reservedAt: string;
  borrowedAt?: string | null;
  dueDate: string;
  returnedAt?: string | null;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type PagedResult<T> = {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
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
