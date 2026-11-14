"use server";

import { z } from "zod";
import { apiGet, apiPost, apiPut, withQuery } from "@/lib/api";
import { readSessionAccessToken } from "@/lib/auth/session";
import { actionClient } from "@/lib/shared";
import type { PagedResult } from "@/lib/shared";
import { explainBookingError } from "./errors";
import { BOOKING_STATUS, normalizeBookingStatus } from "./status";
import type { BookingDto } from "./types";

async function resolveServerToken(explicit?: string): Promise<string | undefined> {
  const fromCookie = await readSessionAccessToken();
  return fromCookie ?? explicit?.trim() ?? undefined;
}

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : undefined));

const statusCode = z.number().int().min(0).max(4);

const searchBookingsSchema = z.object({
  accessToken: z.string().trim().optional(),
  search: optionalText,
  borrowerEmail: optionalText,
  bookId: optionalText,
  status: statusCode.optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(40),
});

const createBookingSchema = z.object({
  accessToken: z.string().trim().optional(),
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
  accessToken: z.string().trim().optional(),
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
    const {
      accessToken,
      search,
      borrowerEmail,
      bookId,
      status,
      page,
      pageSize,
    } = parsedInput;
    const token = await resolveServerToken(accessToken);

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
        undefined,
        token,
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
    const token = await resolveServerToken(parsedInput.accessToken);
    const created = await runBooking(() =>
      apiPost<BookingDto>(
        "/api/bookings",
        {
          bookId: parsedInput.bookId,
          borrowerName: parsedInput.borrowerName,
          borrowerEmail: parsedInput.borrowerEmail,
          status: BOOKING_STATUS.reserved,
          dueDate: parsedInput.dueDate,
          notes: parsedInput.notes || null,
        },
        undefined,
        token,
      ),
    );

    try {
      await apiPost(
        "/api/orders/enqueue",
        { orderId: created.id },
        undefined,
        token,
      );
    } catch {
      // Workers queue je best-effort — rezervácia už je uložená.
    }

    return mapBooking(created);
  });

export const updateBookingAction = actionClient
  .inputSchema(updateBookingSchema)
  .action(async ({ parsedInput }): Promise<DeskBooking> => {
    const { id, bookCopyId, notes, accessToken, ...rest } = parsedInput;
    const token = await resolveServerToken(accessToken);
    const updated = await runBooking(() =>
      apiPut<BookingDto>(
        `/api/bookings/${id}`,
        {
          ...rest,
          bookCopyId: bookCopyId || null,
          notes: notes || null,
        },
        undefined,
        token,
      ),
    );
    return mapBooking(updated);
  });
