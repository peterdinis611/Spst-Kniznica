"use server";

import { z } from "zod";
import { apiGet, withQuery } from "@/lib/api";
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