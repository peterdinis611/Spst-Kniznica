"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useAction } from "next-safe-action/hooks";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Bookmark,
  Clock,
  Heart,
  Hourglass,
  Ticket,
} from "@/components/icons";
import { SignInRequiredNotice } from "@/components/auth/NotAuthorizedNotice";
import { useAuth } from "@/components/auth/AuthProvider";
import { CatalogBreadcrumb } from "@/components/catalog/CatalogBreadcrumb";
import { CatalogSkeleton } from "@/components/catalog/CatalogSkeleton";
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
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type CatalogRef = { id: string; title: string; author: string };

type MyLibraryProps = {
  initialBookings: DeskBooking[];
  catalog: CatalogRef[];
};

const EASE_OUT = [0.22, 1, 0.36, 1] as const;

const pageShow = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.1, delayChildren: 0.06 },
  },
};

const rise = {
  hidden: { opacity: 0, y: 22 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: EASE_OUT },
  },
};

const listStagger = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.07, delayChildren: 0.04 },
  },
};

const listItem = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: EASE_OUT },
  },
};

function padCount(n: number) {
  return String(n).padStart(2, "0");
}

function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="relative overflow-hidden border border-dashed border-rule/80 bg-paper-deep/40 px-5 py-10 text-center dark:border-white/12 dark:bg-white/[0.02]">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        aria-hidden
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, color-mix(in srgb, var(--rule) 70%, transparent) 1px, transparent 0)",
          backgroundSize: "18px 18px",
          maskImage:
            "radial-gradient(ellipse 70% 60% at 50% 40%, black 20%, transparent 75%)",
        }}
      />
      <div className="relative mx-auto flex size-12 items-center justify-center border border-rule bg-paper text-sage dark:border-white/15 dark:bg-ink/40">
        {icon}
      </div>
      <p className="relative mt-4 font-display text-xl text-ink">{title}</p>
      <p className="relative mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
        {description}
      </p>
      {action ? <div className="relative mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}

function SectionShell({
  id,
  title,
  count,
  accent,
  children,
  className,
}: {
  id: string;
  title: string;
  count: number;
  accent?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.section
      variants={rise}
      aria-labelledby={id}
      className={cn(
        "group relative overflow-hidden border border-rule bg-paper/60 dark:border-white/10 dark:bg-white/[0.02]",
        className,
      )}
    >
      <span
        className={cn(
          "absolute inset-y-0 left-0 w-[3px] transition-colors duration-300",
          accent ? "bg-accent" : "bg-sage/70 group-hover:bg-sage",
        )}
        aria-hidden
      />
      <div className="flex items-end justify-between gap-3 border-b border-rule px-5 py-4 pl-6 dark:border-white/10">
        <h2
          id={id}
          className="font-mono text-[10px] tracking-[0.22em] text-muted-foreground uppercase"
        >
          {title}
        </h2>
        <span
          className={cn(
            "font-display text-3xl leading-none tabular-nums",
            accent ? "text-accent" : "text-ink",
          )}
        >
          {padCount(count)}
        </span>
      </div>
      <div className="px-5 py-4 pl-6">{children}</div>
    </motion.section>
  );
}

export function MyLibrary({ initialBookings, catalog }: MyLibraryProps) {
  const { user, getAccessToken, ready, entraEnabled } = useAuth();
  const reduceMotion = useReducedMotion();
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

  const stats = [
    { label: "Otvorené", value: open.length, tone: "default" as const },
    { label: "Čakanie", value: waitlist.length, tone: "default" as const },
    { label: "Obľúbené", value: favorites.length, tone: "accent" as const },
    { label: "História", value: history.length, tone: "default" as const },
  ];

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
    return <CatalogSkeleton rows={4} variant="library" />;
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
    <motion.div
      variants={reduceMotion ? undefined : pageShow}
      initial={reduceMotion ? false : "hidden"}
      animate={reduceMotion ? undefined : "show"}
    >
      <CatalogBreadcrumb
        items={[{ label: "Katalóg", href: "/books" }, { label: "Moja knižnica" }]}
      />

      <div className="mt-4 grid items-end gap-8 border-b border-rule pb-8 md:grid-cols-[1.35fr_0.65fr] dark:border-white/10">
        <motion.header variants={rise}>
          <p className="font-mono text-[10px] tracking-[0.22em] text-sage uppercase">
            Čitateľský pult
          </p>
          <h1 className="mt-3 font-display text-[clamp(2.4rem,6vw,4.2rem)] leading-[0.95] tracking-tight text-ink">
            Moja knižnica
            <span className="text-accent">.</span>
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Otvorené lístky, história, čakací zoznam a obľúbené tituly — všetko na
            jednom mieste.
          </p>
        </motion.header>

        <motion.div
          variants={rise}
          className="grid grid-cols-2 border border-rule dark:border-white/10"
        >
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className={cn(
                "px-4 py-4",
                index % 2 === 0 && "border-r border-rule dark:border-white/10",
                index < 2 && "border-b border-rule dark:border-white/10",
                stat.tone === "accent" && "bg-accent text-accent-foreground",
              )}
            >
              <p
                className={cn(
                  "font-mono text-[10px] tracking-[0.18em] uppercase",
                  stat.tone === "accent"
                    ? "text-accent-foreground/80"
                    : "text-muted-foreground",
                )}
              >
                {stat.label}
              </p>
              <p className="mt-2 font-display text-4xl leading-none tabular-nums">
                {padCount(stat.value)}
              </p>
            </div>
          ))}
        </motion.div>
      </div>

      {error ? (
        <motion.p
          variants={rise}
          className="mt-4 text-sm text-stair-2"
          role="alert"
        >
          {error}
        </motion.p>
      ) : null}

      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        <SectionShell
          id="library-open-heading"
          title="Otvorené"
          count={open.length}
          accent={open.some((b) => b.status === BOOKING_STATUS.overdue)}
          className="lg:col-span-2"
        >
          {open.length === 0 ? (
            <EmptyState
              icon={<Ticket className="size-5" aria-hidden />}
              title="Žiadne otvorené výpožičky"
              description="Keď si rezervuješ alebo vypožičiaš knihu, lístok sa objaví tu."
              action={
                <Button
                  render={<Link href="/books" />}
                  className="rounded-none bg-accent text-accent-foreground hover:bg-accent-deep"
                >
                  Do katalógu
                  <ArrowRight className="size-4" aria-hidden />
                </Button>
              }
            />
          ) : (
            <motion.ul
              variants={reduceMotion ? undefined : listStagger}
              initial={reduceMotion ? false : "hidden"}
              animate={reduceMotion ? undefined : "show"}
              className="divide-y divide-rule dark:divide-white/10"
              aria-label="Otvorené výpožičky"
            >
              {open.map((booking) => {
                const book = titles.get(booking.bookId);
                const busy = pendingId === booking.id;
                const overdue = booking.status === BOOKING_STATUS.overdue;
                return (
                  <motion.li
                    key={booking.id}
                    variants={listItem}
                    className="flex flex-col gap-4 py-5 first:pt-1 last:pb-1 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <Badge
                        variant="outline"
                        className={cn(
                          "rounded-none",
                          overdue && "border-stair-2 text-stair-2",
                        )}
                      >
                        {BOOKING_STATUS_LABEL[booking.status as 0 | 1 | 2 | 3 | 4]}
                      </Badge>
                      <p className="mt-2 font-display text-2xl text-ink transition-colors hover:text-sage">
                        {book ? (
                          <Link href={`/books/${book.id}`}>{book.title}</Link>
                        ) : booking.bookTitle ? (
                          <Link href={`/books/${booking.bookId}`}>
                            {booking.bookTitle}
                          </Link>
                        ) : (
                          "Titul"
                        )}
                      </p>
                      <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Clock className="size-3.5 shrink-0" aria-hidden />
                        {duePhrase(
                          booking.dueDate,
                          booking.status as 0 | 1 | 2 | 3 | 4,
                        )}{" "}
                        · {formatDeskDate(booking.dueDate)}
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
                  </motion.li>
                );
              })}
            </motion.ul>
          )}
        </SectionShell>

        <SectionShell
          id="library-waitlist-heading"
          title="Čakací zoznam"
          count={waitlist.length}
        >
          {waitlist.length === 0 && loadWaitlist.isPending ? (
            <div className="space-y-2" aria-hidden>
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : waitlist.length === 0 ? (
            <EmptyState
              icon={<Hourglass className="size-5" aria-hidden />}
              title="Nie si v poradovníku"
              description="Ak je titul vypožičaný, môžeš sa zaradiť do čakacieho zoznamu z detailu knihy."
            />
          ) : (
            <motion.ul
              variants={reduceMotion ? undefined : listStagger}
              initial={reduceMotion ? false : "hidden"}
              animate={reduceMotion ? undefined : "show"}
              className="space-y-3"
              aria-label="Čakací zoznam"
            >
              {waitlist.map((entry) => {
                const book = titles.get(entry.bookId);
                return (
                  <motion.li
                    key={entry.id}
                    variants={listItem}
                    whileHover={reduceMotion ? undefined : { x: 3 }}
                    className="flex flex-wrap items-center justify-between gap-3 border border-rule bg-paper-deep/50 px-4 py-3 transition-colors hover:border-sage dark:border-white/10 dark:bg-white/[0.03]"
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
                        await leaveWait.executeAsync({
                          id: entry.id,
                          accessToken,
                        });
                        setWaitlist((prev) =>
                          prev.filter((w) => w.id !== entry.id),
                        );
                      }}
                    >
                      Opustiť
                    </Button>
                  </motion.li>
                );
              })}
            </motion.ul>
          )}
        </SectionShell>

        <SectionShell
          id="library-favorites-heading"
          title="Obľúbené"
          count={favorites.length}
          accent
        >
          {favorites.length === 0 && loadFavorites.isPending ? (
            <div className="grid gap-2 sm:grid-cols-2" aria-hidden>
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : favorites.length === 0 ? (
            <EmptyState
              icon={<Heart className="size-5" aria-hidden />}
              title="Zatiaľ prázdne"
              description="Pridaj si obľúbené z detailu knihy — budú tu pripravené na ďalšie čítanie."
              action={
                <Button
                  variant="outline"
                  render={<Link href="/books" />}
                  className="rounded-none"
                >
                  Prehliadať katalóg
                  <ArrowRight className="size-4" aria-hidden />
                </Button>
              }
            />
          ) : (
            <motion.ul
              variants={reduceMotion ? undefined : listStagger}
              initial={reduceMotion ? false : "hidden"}
              animate={reduceMotion ? undefined : "show"}
              className="grid gap-2 sm:grid-cols-2"
              aria-label="Obľúbené knihy"
            >
              {favorites.map((fav) => {
                const book = titles.get(fav.bookId);
                return (
                  <motion.li key={fav.id} variants={listItem}>
                    <Link
                      href={`/books/${fav.bookId}`}
                      className="group/fav flex items-start gap-3 border border-rule px-4 py-3 transition hover:border-sage hover:bg-sage/5 dark:border-white/10"
                    >
                      <Bookmark
                        className="mt-0.5 size-4 shrink-0 text-sage transition group-hover/fav:scale-110"
                        aria-hidden
                      />
                      <span className="min-w-0">
                        <span className="block font-display text-lg text-ink">
                          {book?.title ?? "Titul"}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {fav.listName}
                        </span>
                      </span>
                    </Link>
                  </motion.li>
                );
              })}
            </motion.ul>
          )}
        </SectionShell>

        <SectionShell
          id="library-history-heading"
          title="História"
          count={history.length}
          className="lg:col-span-2"
        >
          {history.length === 0 ? (
            <EmptyState
              icon={<Clock className="size-5" aria-hidden />}
              title="História je prázdna"
              description="Vrátené a zrušené výpožičky sa tu zobrazia automaticky."
            />
          ) : (
            <motion.ul
              variants={reduceMotion ? undefined : listStagger}
              initial={reduceMotion ? false : "hidden"}
              animate={reduceMotion ? undefined : "show"}
              className="divide-y divide-rule dark:divide-white/10"
              aria-label="História výpožičiek"
            >
              {history.slice(0, 20).map((booking) => {
                const book = titles.get(booking.bookId);
                return (
                  <motion.li
                    key={booking.id}
                    variants={listItem}
                    className="flex flex-wrap items-baseline gap-x-2 gap-y-1 py-3 text-sm first:pt-1 last:pb-1"
                  >
                    <span className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
                      {BOOKING_STATUS_LABEL[booking.status as 0 | 1 | 2 | 3 | 4]}
                    </span>
                    <span className="text-muted-foreground" aria-hidden>
                      ·
                    </span>
                    {book ? (
                      <Link
                        href={`/books/${book.id}`}
                        className="font-display text-base text-ink underline-offset-4 hover:underline"
                      >
                        {book.title}
                      </Link>
                    ) : booking.bookTitle ? (
                      <Link
                        href={`/books/${booking.bookId}`}
                        className="font-display text-base text-ink underline-offset-4 hover:underline"
                      >
                        {booking.bookTitle}
                      </Link>
                    ) : (
                      <span className="text-ink">{booking.bookId}</span>
                    )}
                  </motion.li>
                );
              })}
            </motion.ul>
          )}
        </SectionShell>
      </div>
    </motion.div>
  );
}
