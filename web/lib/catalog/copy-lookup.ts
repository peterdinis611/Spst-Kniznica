import {
  COPY_STATUS_BY_NAME,
  COPY_STATUS_LABEL,
  copyStatusLabel,
  type CopyStatusCode,
} from "./mappers";
import type { BookCopyStatus } from "./types";

export type BookCopyLookupDto = {
  copyId: string;
  bookId: string;
  inventoryNumber: string;
  barcode?: string | null;
  status: BookCopyStatus;
  bookTitle: string;
  bookAuthor: string;
};

export type BookCopyLookup = {
  copyId: string;
  bookId: string;
  inventoryNumber: string;
  barcode: string | null;
  status: CopyStatusCode;
  statusLabel: string;
  bookTitle: string;
  bookAuthor: string;
};

export function copyStatusCode(
  value: BookCopyStatus | number | string,
): CopyStatusCode {
  if (typeof value === "number" && value in COPY_STATUS_LABEL) {
    return value as CopyStatusCode;
  }
  if (typeof value === "string") {
    const byName = COPY_STATUS_BY_NAME[value];
    if (byName !== undefined) return byName;
    const numeric = Number.parseInt(value, 10);
    if (numeric in COPY_STATUS_LABEL) return numeric as CopyStatusCode;
  }
  return 0;
}

export function mapBookCopyLookup(raw: BookCopyLookupDto): BookCopyLookup {
  const status = copyStatusCode(raw.status);
  return {
    copyId: raw.copyId,
    bookId: raw.bookId,
    inventoryNumber: raw.inventoryNumber,
    barcode: raw.barcode ?? null,
    status,
    statusLabel: copyStatusLabel(status),
    bookTitle: raw.bookTitle,
    bookAuthor: raw.bookAuthor,
  };
}
