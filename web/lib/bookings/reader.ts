const READER_KEY = "spst-reader";

export type ReaderCard = {
  name: string;
  email: string;
};

const readerListeners = new Set<() => void>();
let readerRaw: string | null | undefined;
let readerSnapshot: ReaderCard | null = null;

function storage(): Storage | null {
  if (typeof window === "undefined") return null;
  // Prefer sessionStorage — avoid long-lived PII in localStorage
  return window.sessionStorage;
}

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

function migrateFromLocalStorage(store: Storage) {
  try {
    const legacy = window.localStorage.getItem(READER_KEY);
    if (!legacy) return;
    if (!store.getItem(READER_KEY)) {
      store.setItem(READER_KEY, legacy);
    }
    window.localStorage.removeItem(READER_KEY);
  } catch {
    // ignore quota / private mode
  }
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
  const store = storage();
  if (!store) return null;
  migrateFromLocalStorage(store);
  const raw = store.getItem(READER_KEY);
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
  const store = storage();
  if (!store) return;
  const next = { name: card.name.trim(), email: card.email.trim() };
  const raw = JSON.stringify(next);
  store.setItem(READER_KEY, raw);
  try {
    window.localStorage.removeItem(READER_KEY);
  } catch {
    // ignore
  }
  readerRaw = raw;
  readerSnapshot = next;
  emitReader();
}

export function clearReader(): void {
  const store = storage();
  store?.removeItem(READER_KEY);
  try {
    window.localStorage.removeItem(READER_KEY);
  } catch {
    // ignore
  }
  readerRaw = null;
  readerSnapshot = null;
  emitReader();
}
