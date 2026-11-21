import { isRecord } from "@/lib/api/problem-details";
import { normalizeBookingStatus, type BookingStatusCode } from "./status";
import type { BookingDto } from "./types";

export type DeskBooking = {
  id: string;
  bookId: string;
  bookCopyId: string | null;
  bookTitle: string | null;
  bookAuthor: string | null;
  borrowerName: string;
  borrowerEmail: string;
  status: BookingStatusCode;
  dueDate: string;
  notes: string | null;
  reservedAt: string;
};

export function mapBooking(booking: BookingDto): DeskBooking {
  return {
    id: booking.id,
    bookId: booking.bookId,
    bookCopyId: booking.bookCopyId ?? null,
    bookTitle: booking.bookTitle?.trim() || null,
    bookAuthor: booking.bookAuthor?.trim() || null,
    borrowerName: booking.borrowerName,
    borrowerEmail: booking.borrowerEmail,
    status: normalizeBookingStatus(booking.status),
    dueDate: booking.dueDate,
    notes: booking.notes ?? null,
    reservedAt: booking.reservedAt,
  };
}

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

export type DeskDailyDto = {
  generatedAt: string;
  overdueCount: number;
  dueSoonCount: number;
  reservedCount: number;
  activeCount: number;
  overdue: BookingDto[];
  dueSoon: BookingDto[];
  pickupReady: BookingDto[];
};

export function mapDeskDaily(board: DeskDailyDto): DeskDaily {
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
}

/** Normalize paginated booking payloads (camelCase or PascalCase). */
export function bookingItemsOf(body: unknown): BookingDto[] {
  if (!isRecord(body)) return [];
  const items = body.items ?? body.Items;
  if (!Array.isArray(items)) return [];
  return items.filter(isBookingDtoLike);
}

function isBookingDtoLike(value: unknown): value is BookingDto {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === "string" &&
    typeof value.bookId === "string" &&
    typeof value.borrowerName === "string" &&
    typeof value.borrowerEmail === "string" &&
    typeof value.dueDate === "string"
  );
}
