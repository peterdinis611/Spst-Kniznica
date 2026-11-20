import { describe, expect, it } from "vitest";
import {
  BOOKING_STATUS,
  BOOKING_STATUS_LABEL,
  normalizeBookingStatus,
} from "@/lib/bookings/status";

describe("booking status labels (desk/UI)", () => {
  it("maps every status code to a Slovak label", () => {
    expect(BOOKING_STATUS_LABEL[BOOKING_STATUS.reserved]).toBe("Rezervované");
    expect(BOOKING_STATUS_LABEL[BOOKING_STATUS.active]).toBe("Požičané");
    expect(BOOKING_STATUS_LABEL[BOOKING_STATUS.returned]).toBe("Vrátené");
    expect(BOOKING_STATUS_LABEL[BOOKING_STATUS.cancelled]).toBe("Zrušené");
    expect(BOOKING_STATUS_LABEL[BOOKING_STATUS.overdue]).toBe("Po termíne");
  });

  it("normalizes API string names used by checkout/return responses", () => {
    expect(normalizeBookingStatus("Active")).toBe(BOOKING_STATUS.active);
    expect(normalizeBookingStatus("Returned")).toBe(BOOKING_STATUS.returned);
    expect(normalizeBookingStatus("Overdue")).toBe(BOOKING_STATUS.overdue);
  });
});
