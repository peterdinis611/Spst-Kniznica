"use server";

import { z } from "zod";
import { apiGet, apiPatch, withQuery } from "@/lib/api";
import { readSessionAccessToken } from "@/lib/auth/session";
import { actionClient } from "@/lib/shared";
import { COPY_STATUS_LABEL } from "../mappers";
import type { BookCopyStatus } from "../types";

type BookCopyLookupDto = {
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
  status: number;
  statusLabel: string;
  bookTitle: string;
  bookAuthor: string;
};

const lookupSchema = z.object({
  accessToken: z.string().trim().optional(),
  code: z
    .string()
    .trim()
    .min(1, "Zadaj inventárne číslo alebo čiarový kód."),
});

function statusCode(value: BookCopyStatus): number {
  if (typeof value === "number") return value;
  const named: Record<string, number> = {
    Available: 0,
    Borrowed: 1,
    Reserved: 2,
    Lost: 3,
    Maintenance: 4,
  };
  if (value in named) return named[value]!;
  const numeric = Number.parseInt(String(value), 10);
  return Number.isFinite(numeric) ? numeric : 0;
}

export const lookupBookCopyAction = actionClient
  .inputSchema(lookupSchema)
  .action(async ({ parsedInput }): Promise<BookCopyLookup> => {
    const token =
      (await readSessionAccessToken()) ?? parsedInput.accessToken?.trim();

    let raw: BookCopyLookupDto;
    try {
      raw = await apiGet<BookCopyLookupDto>(
        withQuery("/api/books/copies/lookup", { code: parsedInput.code }),
        undefined,
        token,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Výtlačok sa nenašiel.";
      if (/404|not found|nenaš/i.test(message)) {
        throw new Error("Výtlačok s týmto kódom neexistuje.");
      }
      throw new Error(message);
    }

    const status = statusCode(raw.status);

    return {
      copyId: raw.copyId,
      bookId: raw.bookId,
      inventoryNumber: raw.inventoryNumber,
      barcode: raw.barcode ?? null,
      status,
      statusLabel: COPY_STATUS_LABEL[status] ?? "Neznámy",
      bookTitle: raw.bookTitle,
      bookAuthor: raw.bookAuthor,
    };
  });

const updateCopyStatusSchema = z.object({
  accessToken: z.string().trim().optional(),
  bookId: z.string().uuid("Neplatné ID knihy."),
  copyId: z.string().uuid("Neplatné ID výtlačku."),
  status: z.union([
    z.literal(0),
    z.literal(3),
    z.literal(4),
  ]),
});

type UpdateBookCopyStatusResultDto = {
  copy: {
    id: string;
    inventoryNumber: string;
    barcode?: string | null;
    status: BookCopyStatus;
    shelfLocation?: string | null;
  };
  totalCopies: number;
  availableCopies: number;
};

export type BookCopyStatusUpdate = {
  copyId: string;
  status: number;
  statusLabel: string;
  totalCopies: number;
  availableCopies: number;
};

export const updateBookCopyStatusAction = actionClient
  .inputSchema(updateCopyStatusSchema)
  .action(async ({ parsedInput }): Promise<BookCopyStatusUpdate> => {
    const token =
      (await readSessionAccessToken()) ?? parsedInput.accessToken?.trim();

    const raw = await apiPatch<UpdateBookCopyStatusResultDto>(
      `/api/books/${parsedInput.bookId}/copies/${parsedInput.copyId}`,
      { status: parsedInput.status },
      undefined,
      token,
    );

    const status = statusCode(raw.copy.status);

    return {
      copyId: raw.copy.id,
      status,
      statusLabel: COPY_STATUS_LABEL[status] ?? "Neznámy",
      totalCopies: raw.totalCopies,
      availableCopies: raw.availableCopies,
    };
  });