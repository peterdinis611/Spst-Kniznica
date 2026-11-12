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
    if (value in STATUS_BY_NAME) return STATUS_BY_NAME[value];
    const numeric = Number(value);
    if (numeric in BOOKING_STATUS_LABEL) return numeric as BookingStatusCode;
  }
  return BOOKING_STATUS.reserved;
}

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

const READER_KEY = "spst-reader";

export type ReaderCard = {
  name: string;
  email: string;
};

const readerListeners = new Set<() => void>();
let readerRaw: string | null | undefined;
let readerSnapshot: ReaderCard | null = null;

function parseReader(raw: string | null): ReaderCard | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<ReaderCard>;
    if (!parsed.name?.trim() || !parsed.email?.trim()) return null;
    return { name: parsed.name.trim(), email: parsed.email.trim() };
  } catch {
    return null;
  }
}

function emitReader() {
  for (const listener of readerListeners) listener();
}

export function subscribeReader(onStoreChange: () => void) {
  readerListeners.add(onStoreChange);
  const onStorage = (event: StorageEvent) => {
    if (event.key === READER_KEY) {
      readerRaw = undefined;
      onStoreChange();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    readerListeners.delete(onStoreChange);
    window.removeEventListener("storage", onStorage);
  };
}

export function getReaderSnapshot(): ReaderCard | null {
  const raw = window.localStorage.getItem(READER_KEY);
  if (raw !== readerRaw) {
    readerRaw = raw;
    readerSnapshot = parseReader(raw);
  }
  return readerSnapshot;
}

export function getServerReaderSnapshot(): ReaderCard | null {
  return null;
}

export function writeReader(card: ReaderCard): void {
  const next = { name: card.name.trim(), email: card.email.trim() };
  const raw = JSON.stringify(next);
  window.localStorage.setItem(READER_KEY, raw);
  readerRaw = raw;
  readerSnapshot = next;
  emitReader();
}

export function explainBookingError(message: string): string {
  if (/\bborroweremail\b/i.test(message)) {
    return "Email nie je v správnom tvare.";
  }
  if (/\bborrowername\b/i.test(message)) return "Meno čitateľa je povinné.";
  if (/\bduedate\b/i.test(message)) return "Vyber termín vrátenia.";
  if (/\bbookcopyid\b/i.test(message) || /active reservation/i.test(message)) {
    return "Tento exemplár už má aktívnu výpožičku.";
  }
  if (
    message.startsWith("API ") ||
    /fetch failed/i.test(message) ||
    /ECONNREFUSED/i.test(message) ||
    /\b502\b/.test(message) ||
    /\b503\b/.test(message)
  ) {
    return "Výpožičný pult neodpovedá. Skontroluj, či beží gateway na porte 5200.";
  }
  return message;
}
