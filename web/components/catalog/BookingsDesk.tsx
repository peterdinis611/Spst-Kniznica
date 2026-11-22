"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useAction } from "next-safe-action/hooks";
import { useDebouncedCallback } from "@tanstack/react-pacer";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { useQueryStates } from "nuqs";
import { ArrowRight, Search } from "@/components/icons";
import { useAbility } from "@/components/auth/AbilityProvider";
import { useAuth } from "@/components/auth/AuthProvider";
import { resolveActionAccessToken } from "@/lib/auth/access-token";
import { CatalogBreadcrumb } from "@/components/catalog/CatalogBreadcrumb";
import { DeskScanPanel } from "@/components/catalog/DeskScanPanel";
import { CatalogEmpty } from "@/components/catalog/CatalogEmpty";
import { CatalogSkeleton } from "@/components/catalog/CatalogSkeleton";
import { useWindowScrollMargin } from "@/hooks/use-window-scroll-margin";
import { bookingsDeskParsers } from "@/lib/catalog/catalog-url";
import { VirtualList, VirtualRow } from "@/components/styled/primitives";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useBookSummaries } from "@/hooks/use-book-summaries";
import {
  BOOKING_STATUS,
  BOOKING_STATUS_LABEL,
  cancelBookingAction,
  checkoutBookingAction,
  duePhrase,
  formatDeskDate,
  renewBookingAction,
  returnBookingAction,
  searchBookingsAction,
  type BookingStatusCode,
  type DeskBooking,
} from "@/lib/bookings";
import { cn } from "@/lib/utils";

type CatalogRef = {
  id: string;
  title: string;
  author: string;
};

type BookingsDeskProps = {
  initialBookings: DeskBooking[];
  initialTotal: number;
  /** Optional seed; titles otherwise come from POST /api/books/summaries. */
  catalog?: CatalogRef[];
};

const FILTERS: Array<{ id: "all" | BookingStatusCode; label: string }> = [
  { id: "all", label: "Všetky" },
  { id: BOOKING_STATUS.reserved, label: "Rezervované" },
  { id: BOOKING_STATUS.active, label: "Požičané" },
  { id: BOOKING_STATUS.overdue, label: "Po termíne" },
  { id: BOOKING_STATUS.returned, label: "Vrátené" },
  { id: BOOKING_STATUS.cancelled, label: "Zrušené" },
];

const STAMP: Record<BookingStatusCode, string> = {
  0: "border-ink text-ink",
  1: "border-ink bg-accent text-accent-foreground",
  2: "border-rule text-muted-foreground",
  3: "border-rule text-muted-foreground line-through decoration-1",
  4: "border-stair-2 text-stair-2",
};

function openCount(items: DeskBooking[]): number {
  return items.filter(
    (item) =>
      item.status === BOOKING_STATUS.reserved ||
      item.status === BOOKING_STATUS.active ||
      item.status === BOOKING_STATUS.overdue,
  ).length;
}

export function BookingsDesk({
  initialBookings,
  initialTotal,
  catalog = [],
}: BookingsDeskProps) {
  const [deskQuery] = useQueryStates(bookingsDeskParsers, {
    history: "replace",
    scroll: false,
  });
  const bookId = deskQuery.book ?? "";
  const scanFocus = Boolean(deskQuery.scan) || Boolean(deskQuery.code);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | BookingStatusCode>("all");
  const [page, setPage] = useState(1);
  const [pageBookId, setPageBookId] = useState(bookId);
  const [mineOnly, setMineOnly] = useState(true);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [deskError, setDeskError] = useState<string | null>(null);
  const { entraEnabled, user, getAccessToken } = useAuth();
  const ability = useAbility();
  const userEmail = user?.email ?? null;
  const canManageDesk = ability.can("manage", "BookingsDesk");

  if (pageBookId !== bookId) {
    setPageBookId(bookId);
    setPage(1);
  }

  const search = useAction(searchBookingsAction);
  const cancelMine = useAction(cancelBookingAction);
  const renewMine = useAction(renewBookingAction);
  const refreshAfterMutation = {
    onSuccess() {
      setPendingId(null);
      search.execute(filtersRef.current);
    },
    onError() {
      setPendingId(null);
    },
  };
  const checkout = useAction(checkoutBookingAction, refreshAfterMutation);
  const returnLoan = useAction(returnBookingAction, refreshAfterMutation);
  const cancelStaff = useAction(cancelBookingAction, refreshAfterMutation);
  const filtersRef = useRef({
    search: undefined as string | undefined,
    borrowerEmail: undefined as string | undefined,
    bookId: undefined as string | undefined,
    status: undefined as BookingStatusCode | undefined,
    page: 1,
    pageSize: 40,
  });

  const effectiveMineOnly = canManageDesk ? mineOnly : true;

  const input = useMemo(
    () => ({
      search: query.trim() || undefined,
      borrowerEmail:
        effectiveMineOnly && userEmail ? userEmail : undefined,
      bookId: bookId || undefined,
      status: status === "all" ? undefined : status,
      page,
      pageSize: 40,
    }),
    [query, effectiveMineOnly, userEmail, bookId, status, page],
  );

  const inputKey = JSON.stringify(input);
  const inputRef = useRef(input);
  const executeSearch = search.execute;
  const searchGeneration = useRef(0);

  useEffect(() => {
    inputRef.current = input;
  });

  const runDebouncedSearch = useDebouncedCallback(
    (payload: typeof input) => {
      const generation = ++searchGeneration.current;
      void (async () => {
        try {
          const accessToken = await resolveActionAccessToken({
            entraEnabled,
            getAccessToken,
          });
          if (generation !== searchGeneration.current) return;
          executeSearch({
            ...payload,
            accessToken: accessToken ?? undefined,
          });
        } catch {
          if (generation !== searchGeneration.current) return;
          executeSearch(payload);
        }
      })();
    },
    { wait: 180 },
  );

  useEffect(() => {
    const payload = inputRef.current;
    filtersRef.current = payload;
    runDebouncedSearch(payload);
  }, [inputKey, runDebouncedSearch]);

  const result = search.result.data;
  const items = result?.items ?? initialBookings;
  const total = result?.totalCount ?? initialTotal;
  const totalPages = result?.totalPages ?? 1;
  const live = openCount(items);
  const late = items.filter(
    (item) => item.status === BOOKING_STATUS.overdue,
  ).length;

  const summaryIds = useMemo(() => {
    const ids = items.map((item) => item.bookId);
    if (bookId) ids.push(bookId);
    return ids;
  }, [items, bookId]);
  const { catalog: summaryCatalog } = useBookSummaries(summaryIds);

  const titles = useMemo(() => {
    const map = new Map<string, CatalogRef>();
    for (const book of catalog) map.set(book.id, book);
    for (const book of summaryCatalog) map.set(book.id, book);
    return map;
  }, [catalog, summaryCatalog]);

  const focusedBook = bookId ? titles.get(bookId) : undefined;

  const listRef = useRef<HTMLUListElement>(null);
  const scrollMargin = useWindowScrollMargin(listRef, [items.length, status, page]);
  const virtualizer = useWindowVirtualizer({
    count: items.length,
    estimateSize: () => 180,
    overscan: 6,
    scrollMargin,
  });

  async function checkoutBooking(booking: DeskBooking) {
    setDeskError(null);
    setPendingId(booking.id);
    try {
      const accessToken = await resolveActionAccessToken({
        entraEnabled,
        getAccessToken,
      });
      checkout.execute({
        accessToken,
        id: booking.id,
        bookCopyId: booking.bookCopyId,
      });
    } catch (err) {
      setPendingId(null);
      setDeskError(err instanceof Error ? err.message : "Akcia zlyhala.");
    }
  }

  async function returnBooking(booking: DeskBooking) {
    setDeskError(null);
    setPendingId(booking.id);
    try {
      const accessToken = await resolveActionAccessToken({
        entraEnabled,
        getAccessToken,
      });
      returnLoan.execute({ accessToken, id: booking.id });
    } catch (err) {
      setPendingId(null);
      setDeskError(err instanceof Error ? err.message : "Akcia zlyhala.");
    }
  }

  async function cancelBooking(booking: DeskBooking) {
    setDeskError(null);
    setPendingId(booking.id);
    try {
      const accessToken = await resolveActionAccessToken({
        entraEnabled,
        getAccessToken,
      });
      cancelStaff.execute({ accessToken, id: booking.id });
    } catch (err) {
      setPendingId(null);
      setDeskError(err instanceof Error ? err.message : "Akcia zlyhala.");
    }
  }

  return (
    <>
      <CatalogBreadcrumb
        items={[{ label: "Katalóg", href: "/books" }, { label: "Výpožičky" }]}
      />

      <div className="grid items-end gap-8 md:grid-cols-[1.3fr_0.7fr]">
        <div>
          <p className="reveal text-[11px] font-semibold tracking-[0.22em] text-muted-foreground uppercase">
            Výpožičný pult
          </p>
          <h1 className="reveal reveal-delay-1 mt-3 font-display text-[clamp(2.4rem,6vw,4.4rem)] leading-[0.95] tracking-tight text-ink">
            Lístky
            <span className="text-accent">.</span>
          </h1>
          <p className="reveal reveal-delay-2 mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Rezervácie z detailu knihy. Tu ich vydáš, vrátiš alebo zrušíš.
            Najskôr sú tie, ktorým sa blíži termín.
          </p>
        </div>

        <div className="reveal reveal-delay-3 grid grid-cols-2 border border-rule dark:border-white/10">
          <div className="border-r border-rule px-3 py-4 sm:px-4 sm:py-5 dark:border-white/10">
            <p className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground uppercase">
              Otvorené
            </p>
            <p className="mt-2 font-display text-[clamp(1.75rem,6vw,3rem)] leading-none text-ink">
              {String(live).padStart(2, "0")}
            </p>
          </div>
          <div className="bg-accent px-3 py-4 text-accent-foreground sm:px-4 sm:py-5">
            <p className="font-mono text-[10px] tracking-[0.18em] uppercase">
              Po termíne
            </p>
            <p className="mt-2 font-display text-[clamp(1.75rem,6vw,3rem)] leading-none">
              {String(late).padStart(2, "0")}
            </p>
          </div>
        </div>
      </div>

      <DeskScanPanel
        deskBookings={items}
        scanFocus={scanFocus}
        onBookingsChanged={() => runDebouncedSearch(filtersRef.current)}
      />

      <div
        className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
        role="search"
        aria-label="Filtrovanie lístkov"
      >
        <label className="relative block w-full max-w-xl">
          <span className="sr-only">Hľadať lístok</span>
          <Search
            className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
            placeholder="Meno, email alebo poznámka"
            aria-label="Hľadať lístok podľa mena, emailu alebo poznámky"
            className="h-12 rounded-full border-rule bg-paper-deep pr-4 pl-11 dark:border-white/15"
          />
        </label>
        <div className="flex flex-wrap items-center gap-2">
          {canManageDesk ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="rounded-full border-rule"
              render={<Link href="/desk" />}
            >
              Denná tabuľa
            </Button>
          ) : null}
          {canManageDesk && userEmail ? (
            <Button
              type="button"
              size="sm"
              variant={mineOnly ? "default" : "outline"}
              className={cn(
                "rounded-full",
                mineOnly
                  ? "bg-ink text-paper hover:bg-ink/90"
                  : "border-rule bg-paper-deep text-muted-foreground dark:border-white/10",
              )}
              aria-pressed={mineOnly}
              onClick={() => {
                setMineOnly((value) => !value);
                setPage(1);
              }}
            >
              {mineOnly ? "Moje lístky" : "Celý pult"}
            </Button>
          ) : null}
          {search.isPending ? (
            <span
              className="text-xs text-muted-foreground"
              role="status"
              aria-live="polite"
            >
              hľadám…
            </span>
          ) : null}
          <Badge
            variant="secondary"
            className="h-auto rounded-full bg-paper-deep px-3 py-1 font-display text-sm tabular-nums text-ink ring-1 ring-rule dark:ring-white/10"
          >
            {total}{" "}
            <span className="font-sans font-normal text-muted-foreground">
              {total === 1 ? "lístok" : "lístkov"}
            </span>
          </Badge>
        </div>
      </div>

      <div
        className="mt-4 flex flex-wrap gap-1.5 sm:gap-2"
        role="group"
        aria-label="Filtrovať podľa stavu lístka"
      >
        {FILTERS.map((filter) => {
          const active = status === filter.id;
          return (
            <Button
              key={filter.label}
              type="button"
              size="sm"
              variant={active ? "default" : "outline"}
              aria-pressed={active}
              className={cn(
                "h-9 rounded-full px-3 text-xs sm:h-8 sm:text-sm",
                active
                  ? "bg-accent text-accent-foreground hover:bg-accent-deep"
                  : "border-rule bg-paper-deep text-muted-foreground dark:border-white/10",
              )}
              onClick={() => {
                setStatus(filter.id);
                setPage(1);
              }}
            >
              {filter.label}
            </Button>
          );
        })}
      </div>

      {focusedBook ? (
        <p className="mt-4 text-sm text-muted-foreground">
          Len titul{" "}
          <Link href={`/books/${focusedBook.id}`} className="text-ink underline-offset-4 hover:underline">
            {focusedBook.title}
          </Link>
          .{" "}
          <Link href="/bookings" className="text-ink underline-offset-4 hover:underline">
            Zobraziť celý pult
          </Link>
        </p>
      ) : null}

      {deskError ? (
        <p className="mt-4 text-sm text-stair-2" role="alert">
          {deskError}
        </p>
      ) : null}
      {checkout.result.serverError ||
      returnLoan.result.serverError ||
      cancelStaff.result.serverError ? (
        <p className="mt-4 text-sm text-stair-2" role="alert">
          {checkout.result.serverError ??
            returnLoan.result.serverError ??
            cancelStaff.result.serverError}
        </p>
      ) : null}
      {search.result.serverError ? (
        <p className="mt-4 text-sm text-stair-2" role="alert">
          {search.result.serverError}
        </p>
      ) : null}

      <Separator className="mt-8" />

      {items.length === 0 && search.isPending ? (
        <div className="mt-4">
          <CatalogSkeleton rows={4} variant="desk" />
        </div>
      ) : items.length === 0 ? (
        <CatalogEmpty
          title="Pult je prázdny"
          description="Žiadny lístok nezodpovedá filtru. Rezerváciu vystavíš na detaile knihy."
          resetHref="/books"
          resetLabel="Do katalógu"
        />
      ) : (
        <VirtualList
          ref={listRef}
          className={`relative mt-2 transition-opacity duration-200 ${search.isPending ? "opacity-55" : "opacity-100"}`}
          $height={virtualizer.getTotalSize()}
          aria-label="Zoznam výpožičných lístkov"
          aria-busy={search.isPending || undefined}
        >
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const booking = items[virtualRow.index];
            if (!booking) return null;
            const book = titles.get(booking.bookId);
            const statusCode = booking.status as BookingStatusCode;
            const busy =
              pendingId === booking.id &&
              (checkout.isPending ||
                returnLoan.isPending ||
                cancelStaff.isPending);
            return (
              <VirtualRow
                key={booking.id}
                data-index={virtualRow.index}
                ref={virtualizer.measureElement}
                className="absolute inset-x-0 top-0"
                $start={virtualRow.start - scrollMargin}
              >
                <div className="relative grid gap-4 border-b border-rule py-6 sm:gap-5 sm:py-7 md:grid-cols-[1fr_auto] md:items-center dark:border-white/10">
                  <span
                    aria-hidden
                    className="absolute top-6 bottom-6 left-0 border-l border-dashed border-ink/20 sm:top-7 sm:bottom-7"
                  />
                  <div className="min-w-0 pl-4 sm:pl-5">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <span
                        className={cn(
                          "inline-flex -rotate-3 border-2 px-2 py-0.5 font-display text-[11px] tracking-[0.18em] uppercase",
                          STAMP[statusCode],
                        )}
                      >
                        {BOOKING_STATUS_LABEL[statusCode]}
                      </span>
                      <span className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase sm:text-[11px]">
                        {duePhrase(booking.dueDate, statusCode)}
                      </span>
                    </div>
                    <h2 className="mt-3 font-display text-[clamp(1.35rem,4.5vw,1.875rem)] leading-[1.15] tracking-tight text-balance text-ink">
                      {book ? (
                        <Link
                          href={`/books/${book.id}`}
                          className="hover:text-ink/70"
                        >
                          {book.title}
                        </Link>
                      ) : booking.bookTitle ? (
                        <Link
                          href={`/books/${booking.bookId}`}
                          className="hover:text-ink/70"
                        >
                          {booking.bookTitle}
                        </Link>
                      ) : (
                        "Titul mimo katalógu"
                      )}
                    </h2>
                    <dl className="mt-2.5 space-y-1 text-sm">
                      <div className="min-w-0">
                        <dt className="sr-only">Čitateľ</dt>
                        <dd className="truncate font-medium text-ink/85">
                          {booking.borrowerName}
                        </dd>
                      </div>
                      <div className="min-w-0">
                        <dt className="sr-only">Email</dt>
                        <dd className="truncate font-mono text-[12px] tracking-tight text-muted-foreground">
                          {booking.borrowerEmail}
                        </dd>
                      </div>
                      {book?.author || booking.bookAuthor ? (
                        <div className="min-w-0">
                          <dt className="sr-only">Autor</dt>
                          <dd className="truncate text-muted-foreground">
                            {book?.author ?? booking.bookAuthor}
                          </dd>
                        </div>
                      ) : null}
                    </dl>
                    {booking.notes ? (
                      <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
                        {booking.notes}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex flex-col items-stretch gap-3 pl-4 sm:pl-5 md:items-end md:pl-0">
                    <p className="font-display text-[clamp(1.5rem,5vw,2.25rem)] leading-none tracking-tight text-ink md:text-right">
                      {formatDeskDate(booking.dueDate)}
                    </p>
                    <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap md:justify-end">
                      {canManageDesk &&
                      statusCode === BOOKING_STATUS.reserved ? (
                        <>
                          <Button
                            type="button"
                            disabled={busy}
                            className="h-11 rounded-none bg-ink px-4 text-paper hover:bg-ink/85 sm:h-10"
                            onClick={() => void checkoutBooking(booking)}
                          >
                            {busy ? "Ukladám…" : "Vydať"}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            disabled={busy}
                            className="h-11 rounded-none border-ink sm:h-10"
                            onClick={() => void cancelBooking(booking)}
                          >
                            Zrušiť
                          </Button>
                        </>
                      ) : null}
                      {canManageDesk &&
                      (statusCode === BOOKING_STATUS.active ||
                        statusCode === BOOKING_STATUS.overdue) ? (
                        <Button
                          type="button"
                          disabled={busy}
                          className="col-span-2 h-11 rounded-none bg-accent px-4 text-accent-foreground hover:bg-accent-deep sm:col-span-1 sm:h-10"
                          onClick={() => void returnBooking(booking)}
                        >
                          {busy ? "Ukladám…" : "Vrátiť"}
                          <ArrowRight className="size-4" aria-hidden />
                        </Button>
                      ) : null}
                      {!canManageDesk &&
                      statusCode === BOOKING_STATUS.reserved ? (
                        <Button
                          type="button"
                          variant="outline"
                          disabled={busy || cancelMine.isPending}
                          className="col-span-2 h-11 rounded-none border-ink sm:col-span-1 sm:h-10"
                          onClick={async () => {
                            setPendingId(booking.id);
                            setDeskError(null);
                            const accessToken =
                              await resolveActionAccessToken({
                                entraEnabled,
                                getAccessToken,
                              });
                            const result = await cancelMine.executeAsync({
                              id: booking.id,
                              accessToken,
                            });
                            setPendingId(null);
                            if (result?.serverError) {
                              setDeskError(result.serverError);
                            } else {
                              runDebouncedSearch(filtersRef.current);
                            }
                          }}
                        >
                          Zrušiť rezerváciu
                        </Button>
                      ) : null}
                      {!canManageDesk &&
                      (statusCode === BOOKING_STATUS.active ||
                        statusCode === BOOKING_STATUS.overdue) ? (
                        <Button
                          type="button"
                          disabled={busy || renewMine.isPending}
                          className="col-span-2 h-11 rounded-none bg-accent px-4 text-accent-foreground hover:bg-accent-deep sm:col-span-1 sm:h-10"
                          onClick={async () => {
                            setPendingId(booking.id);
                            setDeskError(null);
                            const accessToken =
                              await resolveActionAccessToken({
                                entraEnabled,
                                getAccessToken,
                              });
                            const result = await renewMine.executeAsync({
                              id: booking.id,
                              accessToken,
                            });
                            setPendingId(null);
                            if (result?.serverError) {
                              setDeskError(result.serverError);
                            } else {
                              runDebouncedSearch(filtersRef.current);
                            }
                          }}
                        >
                          Predĺžiť
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </div>
              </VirtualRow>
            );
          })}
        </VirtualList>
      )}

      {totalPages > 1 ? (
        <nav
          className="mt-8 flex items-center justify-between gap-2 sm:gap-3"
          aria-label="Stránkovanie lístkov"
        >
          <Button
            type="button"
            variant="outline"
            className="min-w-0 flex-1 rounded-none border-ink sm:flex-none"
            disabled={page <= 1 || search.isPending}
            aria-label="Predošlá stránka"
            onClick={() => setPage((value) => Math.max(1, value - 1))}
          >
            Predošlé
          </Button>
          <p
            className="shrink-0 font-mono text-[11px] tracking-[0.16em] text-muted-foreground uppercase sm:text-xs"
            aria-live="polite"
          >
            <span className="sr-only">Stránka </span>
            {page} / {totalPages}
          </p>
          <Button
            type="button"
            variant="outline"
            className="min-w-0 flex-1 rounded-none border-ink sm:flex-none"
            disabled={page >= totalPages || search.isPending}
            aria-label="Ďalšia stránka"
            onClick={() => setPage((value) => value + 1)}
          >
            Ďalšie
          </Button>
        </nav>
      ) : null}
    </>
  );
}
