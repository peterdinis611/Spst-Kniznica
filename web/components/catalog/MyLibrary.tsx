"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAction } from "next-safe-action/hooks";
import { ArrowRight } from "lucide-react";
import { SignInRequiredNotice } from "@/components/auth/NotAuthorizedNotice";
import { useAuth } from "@/components/auth/AuthProvider";
import { CatalogBreadcrumb } from "@/components/catalog/CatalogBreadcrumb";
import { resolveActionAccessToken } from "@/lib/auth/access-token";
import {
  BOOKING_STATUS,
  BOOKING_STATUS_LABEL,
  cancelBookingAction,
  duePhrase,
  formatDeskDate,
  listFavoritesAction,
  listMyWaitlistAction,
  leaveWaitlistAction,
  renewBookingAction,
  type DeskBooking,
  type FavoriteBook,
  type WaitlistEntry,
} from "@/lib/bookings";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type CatalogRef = { id: string; title: string; author: string };

type MyLibraryProps = {
  initialBookings: DeskBooking[];
  catalog: CatalogRef[];
};

export function MyLibrary({ initialBookings, catalog }: MyLibraryProps) {
  const { user, getAccessToken, ready, entraEnabled } = useAuth();
  const [bookings, setBookings] = useState(initialBookings);
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [favorites, setFavorites] = useState<FavoriteBook[]>([]);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const titles = useMemo(
    () => new Map(catalog.map((item) => [item.id, item])),
    [catalog],
  );

  const cancel = useAction(cancelBookingAction);
  const renew = useAction(renewBookingAction);
  const loadWaitlist = useAction(listMyWaitlistAction);
  const leaveWait = useAction(leaveWaitlistAction);
  const loadFavorites = useAction(listFavoritesAction);

  useEffect(() => {
    if (!user?.isAuthenticated) return;
    void (async () => {
      const accessToken = await resolveActionAccessToken({
        entraEnabled,
        getAccessToken,
      });
      loadWaitlist.execute({ accessToken });
      loadFavorites.execute({ accessToken });
    })();
  }, [user?.isAuthenticated, entraEnabled, getAccessToken]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (loadWaitlist.result.data) setWaitlist(loadWaitlist.result.data);
  }, [loadWaitlist.result.data]);

  useEffect(() => {
    if (loadFavorites.result.data) setFavorites(loadFavorites.result.data);
  }, [loadFavorites.result.data]);

  const open = bookings.filter(
    (b) =>
      b.status === BOOKING_STATUS.reserved ||
      b.status === BOOKING_STATUS.active ||
      b.status === BOOKING_STATUS.overdue,
  );
  const history = bookings.filter(
    (b) =>
      b.status === BOOKING_STATUS.returned ||
      b.status === BOOKING_STATUS.cancelled,
  );

  async function withToken() {
    return resolveActionAccessToken({ entraEnabled, getAccessToken });
  }

  async function onCancel(id: string) {
    setPendingId(id);
    setError(null);
    const accessToken = await withToken();
    const result = await cancel.executeAsync({ id, accessToken });
    setPendingId(null);
    if (result?.data) {
      setBookings((prev) => prev.map((b) => (b.id === id ? result.data! : b)));
    } else if (result?.serverError) {
      setError(result.serverError);
    }
  }

  async function onRenew(id: string) {
    setPendingId(id);
    setError(null);
    const accessToken = await withToken();
    const result = await renew.executeAsync({ id, accessToken });
    setPendingId(null);
    if (result?.data) {
      setBookings((prev) => prev.map((b) => (b.id === id ? result.data! : b)));
    } else if (result?.serverError) {
      setError(result.serverError);
    }
  }

  if (!ready) {
    return <p className="text-sm text-muted-foreground">Načítavam účet…</p>;
  }

  if (!user?.isAuthenticated) {
    return (
      <SignInRequiredNotice
        eyebrow="Moja knižnica"
        title="Prihlásenie je povinné"
        description="Prihlás sa, aby si videl svoje výpožičky, termíny a obľúbené."
      />
    );
  }

  return (
    <>
      <CatalogBreadcrumb
        items={[{ label: "Katalóg", href: "/books" }, { label: "Moja knižnica" }]}
      />

      <header className="mt-4 border-b border-rule pb-6 dark:border-white/10">
        <p className="font-mono text-[10px] tracking-[0.22em] text-sage uppercase">
          Čitateľský pult
        </p>
        <h1 className="mt-2 font-display text-[clamp(2rem,5vw,3rem)] leading-none tracking-tight text-ink">
          Moja knižnica
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
          Otvorené lístky, história, čakací zoznam a obľúbené tituly.
        </p>
      </header>

      {error ? (
        <p className="mt-4 text-sm text-stair-2" role="alert">
          {error}
        </p>
      ) : null}

      <section className="mt-8">
        <h2 className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase">
          Otvorené · {open.length}
        </h2>
        <ul className="mt-3 divide-y divide-rule dark:divide-white/10">
          {open.length === 0 ? (
            <li className="py-6 text-sm text-muted-foreground">
              Žiadne otvorené výpožičky.{" "}
              <Link href="/books" className="underline-offset-4 hover:underline">
                Do katalógu
              </Link>
            </li>
          ) : (
            open.map((booking) => {
              const book = titles.get(booking.bookId);
              const busy = pendingId === booking.id;
              return (
                <li
                  key={booking.id}
                  className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <Badge variant="outline" className="rounded-none">
                      {BOOKING_STATUS_LABEL[booking.status as 0 | 1 | 2 | 3 | 4]}
                    </Badge>
                    <p className="mt-2 font-display text-2xl text-ink">
                      {book ? (
                        <Link href={`/books/${book.id}`}>{book.title}</Link>
                      ) : (
                        "Titul"
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {duePhrase(booking.dueDate, booking.status as 0 | 1 | 2 | 3 | 4)} ·{" "}
                      {formatDeskDate(booking.dueDate)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {booking.status === BOOKING_STATUS.reserved ? (
                      <Button
                        type="button"
                        variant="outline"
                        disabled={busy}
                        className="rounded-none"
                        onClick={() => void onCancel(booking.id)}
                      >
                        Zrušiť rezerváciu
                      </Button>
                    ) : null}
                    {booking.status === BOOKING_STATUS.active ||
                    booking.status === BOOKING_STATUS.overdue ? (
                      <Button
                        type="button"
                        disabled={busy}
                        className="rounded-none bg-accent text-accent-foreground hover:bg-accent-deep"
                        onClick={() => void onRenew(booking.id)}
                      >
                        Požiadať o predĺženie
                        <ArrowRight className="size-4" aria-hidden />
                      </Button>
                    ) : null}
                  </div>
                </li>
              );
            })
          )}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase">
          Čakací zoznam · {waitlist.length}
        </h2>
        <ul className="mt-3 space-y-3">
          {waitlist.length === 0 ? (
            <li className="text-sm text-muted-foreground">Nie si v žiadnom poradovníku.</li>
          ) : (
            waitlist.map((entry) => {
              const book = titles.get(entry.bookId);
              return (
                <li
                  key={entry.id}
                  className="flex flex-wrap items-center justify-between gap-3 border border-rule px-4 py-3 dark:border-white/10"
                >
                  <div>
                    <p className="font-display text-lg text-ink">
                      {book?.title ?? entry.bookId}
                    </p>
                    <p className="font-mono text-xs text-muted-foreground">
                      pozícia #{entry.position}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-none"
                    onClick={async () => {
                      const accessToken = await withToken();
                      await leaveWait.executeAsync({ id: entry.id, accessToken });
                      setWaitlist((prev) => prev.filter((w) => w.id !== entry.id));
                    }}
                  >
                    Opustiť
                  </Button>
                </li>
              );
            })
          )}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase">
          Obľúbené · {favorites.length}
        </h2>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {favorites.length === 0 ? (
            <li className="text-sm text-muted-foreground">Zatiaľ prázdne — pridaj z detailu knihy.</li>
          ) : (
            favorites.map((fav) => {
              const book = titles.get(fav.bookId);
              return (
                <li key={fav.id}>
                  <Link
                    href={`/books/${fav.bookId}`}
                    className="block border border-rule px-4 py-3 transition hover:border-sage dark:border-white/10"
                  >
                    <p className="font-display text-lg text-ink">
                      {book?.title ?? "Titul"}
                    </p>
                    <p className="text-xs text-muted-foreground">{fav.listName}</p>
                  </Link>
                </li>
              );
            })
          )}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase">
          História · {history.length}
        </h2>
        <ul className="mt-3 divide-y divide-rule dark:divide-white/10">
          {history.slice(0, 20).map((booking) => {
            const book = titles.get(booking.bookId);
            return (
              <li key={booking.id} className="py-3 text-sm">
                <span className="text-muted-foreground">
                  {BOOKING_STATUS_LABEL[booking.status as 0 | 1 | 2 | 3 | 4]}
                </span>
                {" · "}
                {book ? (
                  <Link href={`/books/${book.id}`} className="text-ink underline-offset-4 hover:underline">
                    {book.title}
                  </Link>
                ) : (
                  booking.bookId
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </>
  );
}
