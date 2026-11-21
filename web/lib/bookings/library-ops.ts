"use server";

import { z } from "zod";
import { apiDelete, apiGet, apiPost, apiPut, withQuery } from "@/lib/api";
import { readSessionAccessToken } from "@/lib/auth/session";
import { actionClient } from "@/lib/shared";
import { explainBookingError } from "./errors";
import {
  mapBooking,
  mapDeskDaily,
  type DeskBooking,
  type DeskDaily,
  type DeskDailyDto,
} from "./map-booking";
import type { BookingDto } from "./types";

async function resolveServerToken(explicit?: string): Promise<string | undefined> {
  const fromCookie = await readSessionAccessToken();
  return fromCookie ?? explicit?.trim() ?? undefined;
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
  skipNonSchoolDays: boolean;
  holidayCountryCode?: string;
};

export type UpdateLoanPolicyInput = {
  defaultLoanDays: number;
  maxActiveLoansPerReader: number;
  renewExtraDays: number;
  maxRenewals: number;
  freezeNewLoans: boolean;
  schoolYearEndUtc?: string | null;
  reminderDaysBeforeDue: number;
  skipNonSchoolDays: boolean;
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

export type { DeskDaily };

const tokenSchema = z.object({
  accessToken: z.string().trim().optional(),
});

export const getLoanPolicyAction = actionClient
  .inputSchema(tokenSchema)
  .action(async (): Promise<LoanPolicy> => {
    return runOps(() => apiGet<LoanPolicy>("/api/bookings/policy"));
  });

const loanPolicyUpdateSchema = tokenSchema.extend({
  defaultLoanDays: z.number().int().min(1).max(365),
  maxActiveLoansPerReader: z.number().int().min(0).max(50),
  renewExtraDays: z.number().int().min(1).max(365),
  maxRenewals: z.number().int().min(0).max(20),
  freezeNewLoans: z.boolean(),
  schoolYearEndUtc: z.string().trim().nullable().optional(),
  reminderDaysBeforeDue: z.number().int().min(0).max(60),
  skipNonSchoolDays: z.boolean(),
});

export const updateLoanPolicyAction = actionClient
  .inputSchema(loanPolicyUpdateSchema)
  .action(async ({ parsedInput }): Promise<LoanPolicy> => {
    const token = await resolveServerToken(parsedInput.accessToken);
    const schoolYearEndUtc =
      parsedInput.schoolYearEndUtc?.trim() ?
        parsedInput.schoolYearEndUtc.trim()
      : null;
    return runOps(() =>
      apiPut<LoanPolicy>(
        "/api/bookings/policy",
        {
          defaultLoanDays: parsedInput.defaultLoanDays,
          maxActiveLoansPerReader: parsedInput.maxActiveLoansPerReader,
          renewExtraDays: parsedInput.renewExtraDays,
          maxRenewals: parsedInput.maxRenewals,
          freezeNewLoans: parsedInput.freezeNewLoans,
          schoolYearEndUtc,
          reminderDaysBeforeDue: parsedInput.reminderDaysBeforeDue,
          skipNonSchoolDays: parsedInput.skipNonSchoolDays,
        },
        undefined,
        token,
      ),
    );
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

export const checkoutBookingAction = actionClient
  .inputSchema(
    tokenSchema.extend({
      id: z.string().trim().min(1),
      bookCopyId: z
        .string()
        .trim()
        .optional()
        .nullable()
        .transform((value) => {
          if (!value) return null;
          return z.string().uuid().parse(value);
        }),
    }),
  )
  .action(async ({ parsedInput }): Promise<DeskBooking> => {
    const token = await resolveServerToken(parsedInput.accessToken);
    const updated = await runOps(() =>
      apiPost<BookingDto>(
        `/api/bookings/${parsedInput.id}/checkout`,
        { bookCopyId: parsedInput.bookCopyId },
        undefined,
        token,
      ),
    );
    return mapBooking(updated);
  });

export const returnBookingAction = actionClient
  .inputSchema(
    tokenSchema.extend({
      id: z.string().trim().min(1),
    }),
  )
  .action(async ({ parsedInput }): Promise<DeskBooking> => {
    const token = await resolveServerToken(parsedInput.accessToken);
    const updated = await runOps(() =>
      apiPost<BookingDto>(
        `/api/bookings/${parsedInput.id}/return`,
        {},
        undefined,
        token,
      ),
    );
    return mapBooking(updated);
  });

export const promoteWaitlistAction = actionClient
  .inputSchema(
    tokenSchema.extend({
      bookId: z.string().trim().min(1),
    }),
  )
  .action(
    async ({
      parsedInput,
    }): Promise<{ promoted: boolean; booking: DeskBooking | null }> => {
      const token = await resolveServerToken(parsedInput.accessToken);
      const result = await runOps(() =>
        apiPost<{
          promoted: boolean;
          booking: BookingDto | null;
        }>(
          `/api/bookings/waitlist/book/${parsedInput.bookId}/promote`,
          {},
          undefined,
          token,
        ),
      );
      return {
        promoted: result.promoted,
        booking: result.booking ? mapBooking(result.booking) : null,
      };
    },
  );

export const markOverdueBatchAction = actionClient
  .inputSchema(tokenSchema)
  .action(async ({ parsedInput }) => {
    const token = await resolveServerToken(parsedInput.accessToken);
    return runOps(() =>
      apiPost<{
        markedOverdue: number;
        remindersQueued: number;
        overdueIds: string[];
        reminderBookingIds: string[];
      }>("/api/bookings/lifecycle/mark-overdue", {}, undefined, token),
    );
  });

export const queueDueRemindersAction = actionClient
  .inputSchema(tokenSchema)
  .action(async ({ parsedInput }) => {
    const token = await resolveServerToken(parsedInput.accessToken);
    return runOps(() =>
      apiPost<{
        markedOverdue: number;
        remindersQueued: number;
        overdueIds: string[];
        reminderBookingIds: string[];
      }>("/api/bookings/lifecycle/due-reminders", {}, undefined, token),
    );
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

export const listStaffWaitlistAction = actionClient
  .inputSchema(
    tokenSchema.extend({
      limit: z.number().int().min(1).max(500).optional(),
    }),
  )
  .action(async ({ parsedInput }): Promise<WaitlistEntry[]> => {
    const token = await resolveServerToken(parsedInput.accessToken);
    return runOps(() =>
      apiGet<WaitlistEntry[]>(
        withQuery("/api/bookings/waitlist", {
          limit: parsedInput.limit,
        }),
        undefined,
        token,
      ),
    );
  });

export const listWaitlistForBookAction = actionClient
  .inputSchema(
    tokenSchema.extend({
      bookId: z.string().trim().min(1),
    }),
  )
  .action(async ({ parsedInput }): Promise<WaitlistEntry[]> => {
    const token = await resolveServerToken(parsedInput.accessToken);
    return runOps(() =>
      apiGet<WaitlistEntry[]>(
        `/api/bookings/waitlist/book/${parsedInput.bookId}`,
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
      apiGet<DeskDailyDto>("/api/bookings/desk/daily", undefined, token),
    );
    return mapDeskDaily(board);
  });
