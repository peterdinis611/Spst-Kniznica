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
