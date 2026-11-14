export const BOOKING_STATUS = {
  reserved: 0,
  active: 1,
  returned: 2,
  cancelled: 3,
  overdue: 4,
} as const;

export type BookingStatusCode =
  (typeof BOOKING_STATUS)[keyof typeof BOOKING_STATUS];

const STATUS_BY_NAME: Record<string, BookingStatusCode> = {
  Reserved: BOOKING_STATUS.reserved,
  Active: BOOKING_STATUS.active,
  Returned: BOOKING_STATUS.returned,
  Cancelled: BOOKING_STATUS.cancelled,
  Overdue: BOOKING_STATUS.overdue,
};

export const BOOKING_STATUS_LABEL: Record<BookingStatusCode, string> = {
  0: "Rezervované",
  1: "Požičané",
  2: "Vrátené",
  3: "Zrušené",
  4: "Po termíne",
};

export function normalizeBookingStatus(
  value: number | string,
): BookingStatusCode {
  if (typeof value === "number" && value in BOOKING_STATUS_LABEL) {
    return value as BookingStatusCode;
  }
  if (typeof value === "string") {
    const byName = STATUS_BY_NAME[value];
    if (byName !== undefined) return byName;
    const numeric = Number(value);
    if (numeric in BOOKING_STATUS_LABEL) return numeric as BookingStatusCode;
  }
  return BOOKING_STATUS.reserved;
}
