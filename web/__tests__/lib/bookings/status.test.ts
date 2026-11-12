import { describe, expect, it } from "vitest";
import {
  BOOKING_STATUS,
  BOOKING_STATUS_LABEL,
  normalizeBookingStatus,
} from "@/lib/bookings/status";

describe("normalizeBookingStatus", () => {
  it("keeps known numeric codes", () => {
    expect(normalizeBookingStatus(BOOKING_STATUS.active)).toBe(1);
    expect(normalizeBookingStatus(4)).toBe(BOOKING_STATUS.overdue);
  });

  it("maps enum names from the API", () => {
    expect(normalizeBookingStatus("Reserved")).toBe(BOOKING_STATUS.reserved);
    expect(normalizeBookingStatus("Active")).toBe(BOOKING_STATUS.active);
    expect(normalizeBookingStatus("Returned")).toBe(BOOKING_STATUS.returned);
    expect(normalizeBookingStatus("Cancelled")).toBe(BOOKING_STATUS.cancelled);
    expect(normalizeBookingStatus("Overdue")).toBe(BOOKING_STATUS.overdue);
  });

  it("parses numeric strings", () => {
    expect(normalizeBookingStatus("2")).toBe(BOOKING_STATUS.returned);
  });

  it("falls back to reserved for unknown values", () => {
    expect(normalizeBookingStatus("Nope")).toBe(BOOKING_STATUS.reserved);
    expect(normalizeBookingStatus(99)).toBe(BOOKING_STATUS.reserved);
  });
});

describe("BOOKING_STATUS_LABEL", () => {
  it("covers every status code", () => {
    for (const code of Object.values(BOOKING_STATUS)) {
      expect(BOOKING_STATUS_LABEL[code]).toBeTruthy();
    }
  });
});
