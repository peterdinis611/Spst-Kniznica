"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { ArrowRight, Search } from "lucide-react";
import { CatalogBreadcrumb } from "@/components/catalog/CatalogBreadcrumb";
import { CatalogEmpty } from "@/components/catalog/CatalogEmpty";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  searchBookingsAction,
  updateBookingAction,
  type DeskBooking,
} from "@/lib/actions/bookings";
import {
  BOOKING_STATUS,
  BOOKING_STATUS_LABEL,
  duePhrase,
  formatDeskDate,
  getReaderSnapshot,
  getServerReaderSnapshot,
  subscribeReader,
  type BookingStatusCode,
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
  catalog: CatalogRef[];
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
  1: "border-black bg-accent text-black",
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
  catalog,
}: BookingsDeskProps) {
  const searchParams = useSearchParams();
  const bookId = searchParams.get("book") ?? "";
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | BookingStatusCode>("all");
  const [page, setPage] = useState(1);
  const [pageBookId, setPageBookId] = useState(bookId);
  const [mineOnly, setMineOnly] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const reader = useSyncExternalStore(
    subscribeReader,
    getReaderSnapshot,
    getServerReaderSnapshot,
  );

  if (pageBookId !== bookId) {
    setPageBookId(bookId);
    setPage(1);
  }

  const search = useAction(searchBookingsAction);
  const filtersRef = useRef({
    search: undefined as string | undefined,
    borrowerEmail: undefined as string | undefined,
    bookId: undefined as string | undefined,
    status: undefined as BookingStatusCode | undefined,
    page: 1,
    pageSize: 40,
  });
  const update = useAction(updateBookingAction, {
    onSuccess() {
      setPendingId(null);
      search.execute(filtersRef.current);
    },
    onError() {
      setPendingId(null);
    },
  });

  const titles = useMemo(() => {
    const map = new Map<string, CatalogRef>();
    for (const book of catalog) map.set(book.id, book);
    return map;
  }, [catalog]);

  const focusedBook = bookId ? titles.get(bookId) : undefined;

  const input = useMemo(
    () => ({
      search: query.trim() || undefined,
      borrowerEmail: mineOnly ? reader?.email : undefined,
      bookId: bookId || undefined,
      status: status === "all" ? undefined : status,
      page,
      pageSize: 40,
    }),
    [query, mineOnly, reader?.email, bookId, status, page],
  );

  const inputKey = JSON.stringify(input);
  const executeSearch = search.execute;

  useEffect(() => {
    const payload = JSON.parse(inputKey) as typeof input;
    filtersRef.current = payload;
    const timer = window.setTimeout(() => executeSearch(payload), 180);
    return () => window.clearTimeout(timer);
  }, [inputKey, executeSearch]);

  const result = search.result.data;
  const items = result?.items ?? initialBookings;
  const total = result?.totalCount ?? initialTotal;
  const totalPages = result?.totalPages ?? 1;
  const live = openCount(items);
  const late = items.filter(
    (item) => item.status === BOOKING_STATUS.overdue,
  ).length;

  function changeStatus(booking: DeskBooking, next: BookingStatusCode) {
    setPendingId(booking.id);
    update.execute({
      id: booking.id,
      bookId: booking.bookId,
      bookCopyId: booking.bookCopyId,
      borrowerName: booking.borrowerName,
      borrowerEmail: booking.borrowerEmail,
      status: next,
      dueDate: booking.dueDate,
      notes: booking.notes,
    });
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
          <div className="border-r border-rule px-4 py-5 dark:border-white/10">
            <p className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground uppercase">
              Otvorené
            </p>
            <p className="mt-2 font-display text-5xl leading-none text-ink">
              {String(live).padStart(2, "0")}
            </p>
          </div>
          <div className="bg-accent px-4 py-5 text-black">
            <p className="font-mono text-[10px] tracking-[0.18em] uppercase">
              Po termíne
            </p>
            <p className="mt-2 font-display text-5xl leading-none">
              {String(late).padStart(2, "0")}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
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
            className="h-12 rounded-full border-rule bg-paper-deep pr-4 pl-11 dark:border-white/15"
          />
        </label>
        <div className="flex flex-wrap items-center gap-2">
          {reader ? (
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
              onClick={() => {
                setMineOnly((value) => !value);
                setPage(1);
              }}
            >
              {mineOnly ? "Môj preukaz" : reader.name.split(" ")[0]}
            </Button>
          ) : null}
          {search.isPending ? (
            <span className="text-xs text-muted-foreground">hľadám…</span>
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

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((filter) => {
          const active = status === filter.id;
          return (
            <Button
              key={filter.label}
              type="button"
              size="sm"
              variant={active ? "default" : "outline"}
              className={cn(
                "rounded-full",
                active
                  ? "bg-accent text-black hover:bg-accent-deep"
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

      {update.result.serverError ? (
        <p className="mt-4 text-sm text-stair-2" role="alert">
          {update.result.serverError}
        </p>
      ) : null}
      {search.result.serverError ? (
        <p className="mt-4 text-sm text-stair-2" role="alert">
          {search.result.serverError}
        </p>
      ) : null}

      <Separator className="mt-8" />

      {items.length === 0 ? (
        <CatalogEmpty
          title={search.isPending ? "Hľadám lístky" : "Pult je prázdny"}
          description={
            search.isPending
              ? "BookingService ešte vracia výber."
              : "Žiadny lístok nezodpovedá filtru. Rezerváciu vystavíš na detaile knihy."
          }
          resetHref="/books"
          resetLabel="Do katalógu"
        />
      ) : (
        <ul className="mt-2">
          {items.map((booking, index) => {
            const book = titles.get(booking.bookId);
            const statusCode = booking.status as BookingStatusCode;
            const busy = pendingId === booking.id && update.isPending;
            return (
              <li
                key={booking.id}
                className={cn(
                  "relative grid gap-5 border-b border-rule py-7 md:grid-cols-[1fr_auto] md:items-center dark:border-white/10",
                  index < 4 && "reveal",
                  index === 1 && "reveal-delay-1",
                  index === 2 && "reveal-delay-2",
                  index === 3 && "reveal-delay-3",
                )}
              >
                <span
                  aria-hidden
                  className="absolute top-7 bottom-7 left-0 border-l border-dashed border-ink/20"
                />
                <div className="min-w-0 pl-5">
                  <div className="flex flex-wrap items-center gap-3">
                    <span
                      className={cn(
                        "inline-flex -rotate-3 border-2 px-2 py-0.5 font-display text-[11px] tracking-[0.18em] uppercase",
                        STAMP[statusCode],
                      )}
                    >
                      {BOOKING_STATUS_LABEL[statusCode]}
                    </span>
                    <span className="font-mono text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
                      {duePhrase(booking.dueDate, statusCode)}
                    </span>
                  </div>
                  <h2 className="mt-3 font-display text-3xl leading-none tracking-tight text-ink">
                    {book ? (
                      <Link
                        href={`/books/${book.id}`}
                        className="hover:text-ink/70"
                      >
                        {book.title}
                      </Link>
                    ) : (
                      "Titul mimo katalógu"
                    )}
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {booking.borrowerName}
                    <span className="px-1.5 text-ink/30">/</span>
                    {booking.borrowerEmail}
                    {book ? (
                      <>
                        <span className="px-1.5 text-ink/30">/</span>
                        {book.author}
                      </>
                    ) : null}
                  </p>
                  {booking.notes ? (
                    <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                      {booking.notes}
                    </p>
                  ) : null}
                </div>

                <div className="flex flex-col items-start gap-3 pl-5 md:items-end md:pl-0">
                  <p className="font-display text-4xl leading-none tracking-tight text-ink">
                    {formatDeskDate(booking.dueDate)}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {statusCode === BOOKING_STATUS.reserved ? (
                      <>
                        <Button
                          type="button"
                          disabled={busy}
                          className="h-10 rounded-none bg-ink px-4 text-paper hover:bg-ink/85"
                          onClick={() =>
                            changeStatus(booking, BOOKING_STATUS.active)
                          }
                        >
                          {busy ? "Ukladám…" : "Vydať"}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          disabled={busy}
                          className="h-10 rounded-none border-ink"
                          onClick={() =>
                            changeStatus(booking, BOOKING_STATUS.cancelled)
                          }
                        >
                          Zrušiť
                        </Button>
                      </>
                    ) : null}
                    {statusCode === BOOKING_STATUS.active ||
                    statusCode === BOOKING_STATUS.overdue ? (
                      <Button
                        type="button"
                        disabled={busy}
                        className="h-10 rounded-none bg-accent px-4 text-black hover:bg-accent-deep"
                        onClick={() =>
                          changeStatus(booking, BOOKING_STATUS.returned)
                        }
                      >
                        {busy ? "Ukladám…" : "Vrátiť"}
                        <ArrowRight className="size-4" aria-hidden />
                      </Button>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {totalPages > 1 ? (
        <div className="mt-8 flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            className="rounded-none border-ink"
            disabled={page <= 1 || search.isPending}
            onClick={() => setPage((value) => Math.max(1, value - 1))}
          >
            Predošlé
          </Button>
          <p className="font-mono text-xs tracking-[0.16em] text-muted-foreground uppercase">
            {page} / {totalPages}
          </p>
          <Button
            type="button"
            variant="outline"
            className="rounded-none border-ink"
            disabled={page >= totalPages || search.isPending}
            onClick={() => setPage((value) => value + 1)}
          >
            Ďalšie
          </Button>
        </div>
      ) : null}
    </>
  );
}
