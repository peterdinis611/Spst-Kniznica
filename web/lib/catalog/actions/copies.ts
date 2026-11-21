"use server";

import { z } from "zod";
import { apiGet, apiPatch, withQuery } from "@/lib/api";
import { readSessionAccessToken } from "@/lib/auth/session";
import { actionClient } from "@/lib/shared";
import {
  mapBookCopyLookup,
  copyStatusCode,
  type BookCopyLookup,
  type BookCopyLookupDto,
} from "../copy-lookup";
import { copyStatusLabel } from "../mappers";
import type { BookCopyStatus } from "../types";

export type { BookCopyLookup };

const lookupSchema = z.object({
  accessToken: z.string().trim().optional(),
  code: z
    .string()
    .trim()
    .min(1, "Zadaj inventárne číslo alebo čiarový kód."),
});

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

    return mapBookCopyLookup(raw);
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

    const status = copyStatusCode(raw.copy.status);

    return {
      copyId: raw.copy.id,
      status,
      statusLabel: copyStatusLabel(status),
      totalCopies: raw.totalCopies,
      availableCopies: raw.availableCopies,
    };
  });