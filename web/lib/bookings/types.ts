export type BookingDto = {
  id: string;
  bookId: string;
  bookCopyId?: string | null;
  bookTitle?: string | null;
  bookAuthor?: string | null;
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
