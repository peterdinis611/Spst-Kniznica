"use client";

import { useEffect, useRef, useState } from "react";
import { useAction } from "next-safe-action/hooks";
import { Barcode, ScanLine } from "lucide-react";
import { useAbility } from "@/components/auth/AbilityProvider";
import { useAuth } from "@/components/auth/AuthProvider";
import { resolveActionAccessToken } from "@/lib/auth/access-token";
import {
  BOOKING_STATUS,
  searchBookingsAction,
  updateBookingAction,
  type DeskBooking,
} from "@/lib/bookings";
import {
  lookupBookCopyAction,
  type BookCopyLookup,
} from "@/lib/catalog/actions/copies";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type DeskScanPanelProps = {
  deskBookings: DeskBooking[];
  scanFocus?: boolean;
  onBookingsChanged?: () => void;
};

function pickReservedBooking(
  items: DeskBooking[],
  bookId: string,
): DeskBooking | undefined {
  const reserved = items.filter(
    (item) =>
      item.bookId === bookId &&
      item.status === BOOKING_STATUS.reserved &&
      !item.bookCopyId,
  );
  if (reserved.length === 0) return undefined;
  return [...reserved].sort(
    (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
  )[0];
}

export function DeskScanPanel({
  deskBookings,
  scanFocus = false,
  onBookingsChanged,
}: DeskScanPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [code, setCode] = useState("");
  const [lookup, setLookup] = useState<BookCopyLookup | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const ability = useAbility();
  const { entraEnabled, getAccessToken } = useAuth();
  const canManage = ability.can("manage", "BookingsDesk");

  const lookupCopy = useAction(lookupBookCopyAction);
  const search = useAction(searchBookingsAction);
  const update = useAction(updateBookingAction);

  useEffect(() => {
    if (scanFocus) inputRef.current?.focus();
  }, [scanFocus]);

  useEffect(() => {
    if (canManage) inputRef.current?.focus();
  }, [canManage]);

  if (!canManage) return null;

  async function resolveToken() {
    return resolveActionAccessToken({ entraEnabled, getAccessToken });
  }

  async function runLookup() {
    const trimmed = code.trim();
    if (!trimmed) return;
    setError(null);
    setMessage(null);
    setLookup(null);
    const accessToken = await resolveToken();
    const result = await lookupCopy.executeAsync({ code: trimmed, accessToken });
    if (result?.serverError) {
      setError(result.serverError);
      return;
    }
    if (result?.validationErrors) {
      setError("Zadaj platný kód výtlačku.");
      return;
    }
    if (result?.data) {
      setLookup(result.data);
      setCode("");
    }
  }

  async function issueCopy() {
    if (!lookup) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const accessToken = await resolveToken();
      let booking = pickReservedBooking(deskBookings, lookup.bookId);
      if (!booking) {
        const found = await search.executeAsync({
          accessToken: accessToken ?? undefined,
          bookId: lookup.bookId,
          status: BOOKING_STATUS.reserved,
          page: 1,
          pageSize: 50,
        });
        if (found?.serverError) {
          setError(found.serverError);
          return;
        }
        booking = pickReservedBooking(found?.data?.items ?? [], lookup.bookId);
      }
      if (!booking) {
        setError("Pre tento titul nie je rezervácia bez priradeného výtlačku.");
        return;
      }
      const result = await update.executeAsync({
        accessToken: accessToken ?? undefined,
        id: booking.id,
        bookId: booking.bookId,
        bookCopyId: lookup.copyId,
        borrowerName: booking.borrowerName,
        borrowerEmail: booking.borrowerEmail,
        status: BOOKING_STATUS.active,
        dueDate: booking.dueDate,
        notes: booking.notes,
      });
      if (result?.serverError) {
        setError(result.serverError);
        return;
      }
      setMessage(`Vydané: ${lookup.bookTitle} (${lookup.inventoryNumber})`);
      setLookup(null);
      onBookingsChanged?.();
    } finally {
      setBusy(false);
    }
  }

  async function returnCopy() {
    if (!lookup) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const accessToken = await resolveToken();
      const found = await search.executeAsync({
        accessToken: accessToken ?? undefined,
        bookCopyId: lookup.copyId,
        page: 1,
        pageSize: 20,
      });
      if (found?.serverError) {
        setError(found.serverError);
        return;
      }
      const items = found?.data?.items ?? [];
      const booking = items.find(
        (item) =>
          item.status === BOOKING_STATUS.active ||
          item.status === BOOKING_STATUS.overdue,
      );
      if (!booking) {
        setError("Pre tento výtlačok nie je aktívna výpožička.");
        return;
      }
      const result = await update.executeAsync({
        accessToken: accessToken ?? undefined,
        id: booking.id,
        bookId: booking.bookId,
        bookCopyId: lookup.copyId,
        borrowerName: booking.borrowerName,
        borrowerEmail: booking.borrowerEmail,
        status: BOOKING_STATUS.returned,
        dueDate: booking.dueDate,
        notes: booking.notes,
      });
      if (result?.serverError) {
        setError(result.serverError);
        return;
      }
      setMessage(`Vrátené: ${lookup.bookTitle} (${lookup.inventoryNumber})`);
      setLookup(null);
      onBookingsChanged?.();
    } finally {
      setBusy(false);
    }
  }

  return (
    <section
      className="reveal reveal-delay-2 mt-8 border border-ink bg-paper-deep p-5 dark:border-white/15"
      aria-label="Skener výtlačkov"
    >
      <div className="flex flex-wrap items-center gap-3">
        <ScanLine className="size-5 text-accent" aria-hidden />
        <div>
          <p className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase">
            Skener
          </p>
          <h2 className="font-display text-2xl text-ink">Výdaj a vrátenie</h2>
        </div>
      </div>

      <form
        className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-stretch"
        onSubmit={(event) => {
          event.preventDefault();
          void runLookup();
        }}
      >
        <label className="relative block min-w-0 flex-1">
          <span className="sr-only">Inventárne číslo alebo čiarový kód</span>
          <Barcode
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            ref={inputRef}
            value={code}
            onChange={(event) => setCode(event.target.value)}
            placeholder="Inventárne číslo / čiarový kód"
            autoComplete="off"
            spellCheck={false}
            className="h-12 rounded-none border-ink bg-paper pr-3 pl-10 font-mono text-sm dark:border-white/20"
          />
        </label>
        <Button
          type="submit"
          disabled={lookupCopy.isPending || !code.trim()}
          className="h-12 rounded-none bg-ink px-6 text-paper hover:bg-ink/90"
        >
          {lookupCopy.isPending ? "Hľadám…" : "Vyhľadať"}
        </Button>
      </form>

      {error ? (
        <p className="mt-3 text-sm text-stair-2" role="alert">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="mt-3 text-sm text-sage" role="status">
          {message}
        </p>
      ) : null}

      {lookup ? (
        <div className="mt-5 border border-rule bg-paper p-4 dark:border-white/10">
          <p className="font-display text-xl text-ink">{lookup.bookTitle}</p>
          <p className="mt-1 text-sm text-muted-foreground">{lookup.bookAuthor}</p>
          <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 font-mono text-xs text-muted-foreground">
            <div>
              <dt className="inline">Inventárne č. </dt>
              <dd className="inline text-ink">{lookup.inventoryNumber}</dd>
            </div>
            {lookup.barcode ? (
              <div>
                <dt className="inline">Čiarový kód </dt>
                <dd className="inline text-ink">{lookup.barcode}</dd>
              </div>
            ) : null}
            <div>
              <dt className="inline">Stav výtlačku </dt>
              <dd
                className={cn(
                  "inline",
                  lookup.status === 0 ? "text-sage" : "text-ink",
                )}
              >
                {lookup.statusLabel}
              </dd>
            </div>
          </dl>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              type="button"
              disabled={busy || update.isPending}
              className="h-10 rounded-none bg-ink px-4 text-paper hover:bg-ink/85"
              onClick={() => void issueCopy()}
            >
              {busy ? "Ukladám…" : "Vydať"}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={busy || update.isPending}
              className="h-10 rounded-none border-ink"
              onClick={() => void returnCopy()}
            >
              Vrátiť
            </Button>
          </div>
        </div>
      ) : null}
    </section>
  );
}