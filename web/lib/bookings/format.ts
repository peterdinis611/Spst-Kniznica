import { BOOKING_STATUS, type BookingStatusCode } from "./status";

export function toDueDateIso(date: string): string {
  return `${date}T15:00:00.000Z`;
}

export function formatDeskDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("sk-SK", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function daysUntil(iso: string): number {
  const due = new Date(iso);
  if (Number.isNaN(due.getTime())) return 0;
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(due);
  end.setHours(0, 0, 0, 0);
  return Math.round((end.getTime() - start.getTime()) / 86_400_000);
}

export function duePhrase(iso: string, status: BookingStatusCode): string {
  if (
    status === BOOKING_STATUS.returned ||
    status === BOOKING_STATUS.cancelled
  ) {
    return `termín bol ${formatDeskDate(iso)}`;
  }
  const days = daysUntil(iso);
  if (days === 0) return "termín je dnes";
  if (days === 1) return "ostáva 1 deň";
  if (days > 1) return `ostáva ${days} dní`;
  if (days === -1) return "1 deň po termíne";
  return `${Math.abs(days)} dní po termíne`;
}
