"use server";

import { z } from "zod";
import { apiDelete, apiGet, apiPost, withQuery } from "@/lib/api";
import { readSessionAccessToken } from "@/lib/auth/session";
import { actionClient } from "@/lib/shared";
import { explainBookingError } from "./errors";
import { normalizeBookingStatus } from "./status";
import type { BookingDto } from "./types";
import type { DeskBooking } from "./actions";

async function resolveServerToken(explicit?: string): Promise<string | undefined> {
  const fromCookie = await readSessionAccessToken();
  return fromCookie ?? explicit?.trim() ?? undefined;
}

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

async function runOps<T>(task: () => Promise<T>): Promise<T> {
  try {
    return await task();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Operácia zlyhala.";
    throw new Error(explainBookingError(message));
  }
}

export type LoanPolicy = {
  defaultLoanDays: number;
  maxActiveLoansPerReader: number;
  renewExtraDays: number;
  maxRenewals: number;
  freezeNewLoans: boolean;
  schoolYearEndUtc?: string | null;
  reminderDaysBeforeDue: number;
};

export type WaitlistEntry = {
  id: string;
  bookId: string;
  borrowerName: string;
  borrowerEmail: string;
  createdAt: string;
  position: number;
  notes?: string | null;
};

export type FavoriteBook = {
  id: string;
  bookId: string;
  listName: string;
  createdAt: string;
};

export type DeskDaily = {
  generatedAt: string;
  overdueCount: number;
  dueSoonCount: number;
  reservedCount: number;
  activeCount: number;
  overdue: DeskBooking[];
  dueSoon: DeskBooking[];
  pickupReady: DeskBooking[];
};

const tokenSchema = z.object({
  accessToken: z.string().trim().optional(),
});

export const getLoanPolicyAction = actionClient
  .inputSchema(tokenSchema)
  .action(async (): Promise<LoanPolicy> => {
    return runOps(() => apiGet<LoanPolicy>("/api/bookings/policy"));
  });

export const cancelBookingAction = actionClient
  .inputSchema(
    tokenSchema.extend({
      id: z.string().trim().min(1),
    }),
  )
  .action(async ({ parsedInput }): Promise<DeskBooking> => {
    const token = await resolveServerToken(parsedInput.accessToken);
    const updated = await runOps(() =>
      apiPost<BookingDto>(
        `/api/bookings/${parsedInput.id}/cancel`,
        {},
        undefined,
        token,
      ),
    );
    return mapBooking(updated);
  });

export const renewBookingAction = actionClient
  .inputSchema(
    tokenSchema.extend({
      id: z.string().trim().min(1),
      extraDays: z.number().int().positive().optional(),
    }),
  )
  .action(async ({ parsedInput }): Promise<DeskBooking> => {
    const token = await resolveServerToken(parsedInput.accessToken);
    const updated = await runOps(() =>
      apiPost<BookingDto>(
        `/api/bookings/${parsedInput.id}/renew`,
        { extraDays: parsedInput.extraDays },
        undefined,
        token,
      ),
    );
    return mapBooking(updated);
  });

export const joinWaitlistAction = actionClient
  .inputSchema(
    tokenSchema.extend({
      bookId: z.string().trim().min(1),
      borrowerName: z.string().trim().min(1).max(200),
      notes: z.string().trim().max(1000).optional(),
    }),
  )
  .action(async ({ parsedInput }): Promise<WaitlistEntry> => {
    const token = await resolveServerToken(parsedInput.accessToken);
    return runOps(() =>
      apiPost<WaitlistEntry>(
        "/api/bookings/waitlist",
        {
          bookId: parsedInput.bookId,
          borrowerName: parsedInput.borrowerName,
          borrowerEmail: "ignored@server",
          notes: parsedInput.notes,
        },
        undefined,
        token,
      ),
    );
  });

export const listMyWaitlistAction = actionClient
  .inputSchema(tokenSchema)
  .action(async ({ parsedInput }): Promise<WaitlistEntry[]> => {
    const token = await resolveServerToken(parsedInput.accessToken);
    return runOps(() =>
      apiGet<WaitlistEntry[]>("/api/bookings/waitlist/mine", undefined, token),
    );
  });

export const leaveWaitlistAction = actionClient
  .inputSchema(
    tokenSchema.extend({
      id: z.string().trim().min(1),
    }),
  )
  .action(async ({ parsedInput }): Promise<void> => {
    const token = await resolveServerToken(parsedInput.accessToken);
    await runOps(() =>
      apiDelete(`/api/bookings/waitlist/${parsedInput.id}`, undefined, token),
    );
  });

export const listFavoritesAction = actionClient
  .inputSchema(
    tokenSchema.extend({
      listName: z.string().trim().optional(),
    }),
  )
  .action(async ({ parsedInput }): Promise<FavoriteBook[]> => {
    const token = await resolveServerToken(parsedInput.accessToken);
    return runOps(() =>
      apiGet<FavoriteBook[]>(
        withQuery("/api/bookings/favorites", {
          listName: parsedInput.listName,
        }),
        undefined,
        token,
      ),
    );
  });

export const addFavoriteAction = actionClient
  .inputSchema(
    tokenSchema.extend({
      bookId: z.string().trim().min(1),
      listName: z.string().trim().max(120).optional(),
    }),
  )
  .action(async ({ parsedInput }): Promise<FavoriteBook> => {
    const token = await resolveServerToken(parsedInput.accessToken);
    return runOps(() =>
      apiPost<FavoriteBook>(
        "/api/bookings/favorites",
        {
          bookId: parsedInput.bookId,
          listName: parsedInput.listName,
        },
        undefined,
        token,
      ),
    );
  });

export const removeFavoriteByBookAction = actionClient
  .inputSchema(
    tokenSchema.extend({
      bookId: z.string().trim().min(1),
      listName: z.string().trim().optional(),
    }),
  )
  .action(async ({ parsedInput }): Promise<void> => {
    const token = await resolveServerToken(parsedInput.accessToken);
    await runOps(() =>
      apiDelete(
        withQuery(`/api/bookings/favorites/book/${parsedInput.bookId}`, {
          listName: parsedInput.listName,
        }),
        undefined,
        token,
      ),
    );
  });

export const getDeskDailyAction = actionClient
  .inputSchema(tokenSchema)
  .action(async ({ parsedInput }): Promise<DeskDaily> => {
    const token = await resolveServerToken(parsedInput.accessToken);
    const board = await runOps(() =>
      apiGet<{
        generatedAt: string;
        overdueCount: number;
        dueSoonCount: number;
        reservedCount: number;
        activeCount: number;
        overdue: BookingDto[];
        dueSoon: BookingDto[];
        pickupReady: BookingDto[];
      }>("/api/bookings/desk/daily", undefined, token),
    );

    return {
      generatedAt: board.generatedAt,
      overdueCount: board.overdueCount,
      dueSoonCount: board.dueSoonCount,
      reservedCount: board.reservedCount,
      activeCount: board.activeCount,
      overdue: board.overdue.map(mapBooking),
      dueSoon: board.dueSoon.map(mapBooking),
      pickupReady: board.pickupReady.map(mapBooking),
    };
  });
