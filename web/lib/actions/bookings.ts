"use server";

import { z } from "zod";
import { apiGet, apiPost, apiPut, withQuery } from "@/lib/api";
import {
  explainBookingError,
  normalizeBookingStatus,
  BOOKING_STATUS,
} from "@/lib/bookings";
import { actionClient } from "@/lib/safe-action";
import type { BookingDto, PagedResult } from "@/lib/types";

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : undefined));

const statusCode = z.number().int().min(0).max(4);

const searchBookingsSchema = z.object({
  search: optionalText,
  borrowerEmail: optionalText,
  bookId: optionalText,
  status: statusCode.optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(40),
});

const createBookingSchema = z.object({
  bookId: z.string().trim().min(1, "Chýba kniha."),
  borrowerName: z
    .string()
    .trim()
    .min(1, "Meno je povinné.")
    .max(200, "Meno je príliš dlhé."),
  borrowerEmail: z
    .string()
    .trim()
    .email("Zadaj platný email.")
    .max(256, "Email je príliš dlhý."),
  dueDate: z.string().trim().min(8, "Vyber termín vrátenia."),
  notes: z
    .string()
    .trim()
    .max(1000, "Poznámka môže mať najviac 1000 znakov.")
    .optional(),
});

const updateBookingSchema = z.object({
  id: z.string().trim().min(1),
  bookId: z.string().trim().min(1),
  bookCopyId: z.string().trim().nullable().optional(),
  borrowerName: z.string().trim().min(1).max(200),
  borrowerEmail: z.string().trim().email().max(256),
  status: statusCode,
  dueDate: z.string().trim().min(8),
  notes: z.string().trim().max(1000).nullable().optional(),
});

export type DeskBooking = {
  id: string;
  bookId: string;
  bookCopyId: string | null;
  borrowerName: string;
  borrowerEmail: string;
  status: number;
  dueDate: string;
  notes: string | null;
  reservedAt: string;
};

export type SearchBookingsResult = {
  items: DeskBooking[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};

function mapBooking(booking: BookingDto): DeskBooking {
  return {
    id: booking.id,
    bookId: booking.bookId,
    bookCopyId: booking.bookCopyId ?? null,
    borrowerName: booking.borrowerName,
    borrowerEmail: booking.borrowerEmail,
    status: normalizeBookingStatus(booking.status),
    dueDate: booking.dueDate,
    notes: booking.notes ?? null,
    reservedAt: booking.reservedAt,
  };
}

async function runBooking<T>(task: () => Promise<T>): Promise<T> {
  try {
    return await task();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Výpožičku sa nepodarilo uložiť.";
    throw new Error(explainBookingError(message));
  }
}

export const searchBookingsAction = actionClient
  .inputSchema(searchBookingsSchema)
  .action(async ({ parsedInput }): Promise<SearchBookingsResult> => {
    const { search, borrowerEmail, bookId, status, page, pageSize } =
      parsedInput;

    const result = await runBooking(() =>
      apiGet<PagedResult<BookingDto>>(
        withQuery("/api/bookings", {
          page,
          pageSize,
          search,
          borrowerEmail,
          bookId,
          status,
          sortBy: "dueDate",
          sortDir: "asc",
        }),
      ),
    );

    const totalCount = result.totalCount ?? 0;
    const safePageSize = result.pageSize || pageSize;

    return {
      items: (result.items ?? []).map(mapBooking),
      page: result.page || page,
      pageSize: safePageSize,
      totalCount,
      totalPages:
        result.totalPages ||
        (safePageSize > 0 ? Math.ceil(totalCount / safePageSize) : 0),
    };
  });

export const createBookingAction = actionClient
  .inputSchema(createBookingSchema)
  .action(async ({ parsedInput }): Promise<DeskBooking> => {
    const created = await runBooking(() =>
      apiPost<BookingDto>("/api/bookings", {
        bookId: parsedInput.bookId,
        borrowerName: parsedInput.borrowerName,
        borrowerEmail: parsedInput.borrowerEmail,
        status: BOOKING_STATUS.reserved,
        dueDate: parsedInput.dueDate,
        notes: parsedInput.notes || null,
      }),
    );
    return mapBooking(created);
  });

export const updateBookingAction = actionClient
  .inputSchema(updateBookingSchema)
  .action(async ({ parsedInput }): Promise<DeskBooking> => {
    const { id, bookCopyId, notes, ...rest } = parsedInput;
    const updated = await runBooking(() =>
      apiPut<BookingDto>(`/api/bookings/${id}`, {
        ...rest,
        bookCopyId: bookCopyId || null,
        notes: notes || null,
      }),
    );
    return mapBooking(updated);
  });
