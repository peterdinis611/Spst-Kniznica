import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  daysUntil,
  duePhrase,
  formatDeskDate,
  toDueDateIso,
} from "@/lib/bookings/format";
import { BOOKING_STATUS } from "@/lib/bookings/status";

describe("toDueDateIso", () => {
  it("appends afternoon UTC time", () => {
    expect(toDueDateIso("2026-11-20")).toBe("2026-11-20T15:00:00.000Z");
  });
});

describe("formatDeskDate", () => {
  it("formats a valid ISO date in sk-SK", () => {
    const formatted = formatDeskDate("2026-03-15T15:00:00.000Z");
    expect(formatted).toMatch(/15/);
    expect(formatted).toMatch(/2026/);
  });

  it("returns the original string for invalid input", () => {
    expect(formatDeskDate("not-a-date")).toBe("not-a-date");
  });
});

describe("daysUntil / duePhrase", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-12T10:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("counts whole days until due date", () => {
    expect(daysUntil("2026-11-12T15:00:00.000Z")).toBe(0);
    expect(daysUntil("2026-11-13T15:00:00.000Z")).toBe(1);
    expect(daysUntil("2026-11-10T15:00:00.000Z")).toBe(-2);
  });

  it("phrases open loans relative to today", () => {
    expect(duePhrase("2026-11-12T15:00:00.000Z", BOOKING_STATUS.active)).toBe(
      "termín je dnes",
    );
    expect(duePhrase("2026-11-13T15:00:00.000Z", BOOKING_STATUS.reserved)).toBe(
      "ostáva 1 deň",
    );
    expect(duePhrase("2026-11-15T15:00:00.000Z", BOOKING_STATUS.active)).toBe(
      "ostáva 3 dní",
    );
    expect(duePhrase("2026-11-11T15:00:00.000Z", BOOKING_STATUS.overdue)).toBe(
      "1 deň po termíne",
    );
    expect(duePhrase("2026-11-10T15:00:00.000Z", BOOKING_STATUS.overdue)).toBe(
      "2 dní po termíne",
    );
  });

  it("uses past tense for closed statuses", () => {
    const phrase = duePhrase(
      "2026-11-01T15:00:00.000Z",
      BOOKING_STATUS.returned,
    );
    expect(phrase.startsWith("termín bol ")).toBe(true);
  });
});
