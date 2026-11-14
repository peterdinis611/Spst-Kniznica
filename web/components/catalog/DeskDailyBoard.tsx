"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAction } from "next-safe-action/hooks";
import { Download } from "lucide-react";
import { useAbility } from "@/components/auth/AbilityProvider";
import { SignInRequiredNotice } from "@/components/auth/NotAuthorizedNotice";
import { useAuth } from "@/components/auth/AuthProvider";
import { CatalogBreadcrumb } from "@/components/catalog/CatalogBreadcrumb";
import { resolveActionAccessToken } from "@/lib/auth/access-token";
import {
  BOOKING_STATUS_LABEL,
  formatDeskDate,
  getDeskDailyAction,
  type DeskBooking,
  type DeskDaily,
} from "@/lib/bookings";
import { apiUrl } from "@/lib/api/client";
import { Button } from "@/components/ui/button";

type CatalogRef = { id: string; title: string; author: string };

export function DeskDailyBoard({ catalog }: { catalog: CatalogRef[] }) {
  const { user, getAccessToken, ready, entraEnabled } = useAuth();
  const ability = useAbility();
  const canManage = ability.can("manage", "BookingsDesk");
  const [board, setBoard] = useState<DeskDaily | null>(null);
  const [error, setError] = useState<string | null>(null);
  const load = useAction(getDeskDailyAction);

  const titles = useMemo(
    () => new Map(catalog.map((item) => [item.id, item])),
    [catalog],
  );

  useEffect(() => {
    if (!user?.isAuthenticated || !canManage) return;
    void (async () => {
      const accessToken = await resolveActionAccessToken({
        entraEnabled,
        getAccessToken,
      });
      const result = await load.executeAsync({ accessToken });
      if (result?.data) setBoard(result.data);
      else if (result?.serverError) setError(result.serverError);
    })();
  }, [user?.isAuthenticated, canManage, entraEnabled, getAccessToken]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!ready) {
    return <p className="text-sm text-muted-foreground">Načítavam…</p>;
  }

  if (!user?.isAuthenticated) {
    return (
      <SignInRequiredNotice
        eyebrow="Denná tabuľa"
        title="Prihlásenie je povinné"
        description="Prihlás sa ako knihovník alebo admin."
      />
    );
  }

  if (!canManage) {
    return (
      <p className="text-sm text-stair-2">
        Denná tabuľa je len pre personál knižnice.
      </p>
    );
  }

  async function downloadCsv() {
    const accessToken = await resolveActionAccessToken({
      entraEnabled,
      getAccessToken,
    });
    const response = await fetch(apiUrl("/api/bookings/desk/daily.csv"), {
      credentials: "same-origin",
      headers: accessToken
        ? { Authorization: `Bearer ${accessToken}` }
        : undefined,
    });
    if (!response.ok) {
      setError(`CSV export zlyhal (${response.status})`);
      return;
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `desk-daily-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function Section({
    title,
    items,
  }: {
    title: string;
    items: DeskBooking[];
  }) {
    return (
      <section className="mt-8">
        <h2 className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase">
          {title} · {items.length}
        </h2>
        <ul className="mt-3 divide-y divide-rule border border-rule dark:divide-white/10 dark:border-white/10">
          {items.length === 0 ? (
            <li className="px-4 py-3 text-sm text-muted-foreground">Prázdne</li>
          ) : (
            items.map((item) => {
              const book = titles.get(item.bookId);
              return (
                <li
                  key={item.id}
                  className="flex flex-wrap items-baseline justify-between gap-3 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="font-display text-lg text-ink">
                      {book ? (
                        <Link href={`/books/${book.id}`}>{book.title}</Link>
                      ) : (
                        item.bookId
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {item.borrowerName} · {item.borrowerEmail}
                    </p>
                  </div>
                  <div className="text-right font-mono text-xs">
                    <p>{BOOKING_STATUS_LABEL[item.status as 0 | 1 | 2 | 3 | 4]}</p>
                    <p className="text-muted-foreground">
                      {formatDeskDate(item.dueDate)}
                    </p>
                  </div>
                </li>
              );
            })
          )}
        </ul>
      </section>
    );
  }

  return (
    <>
      <CatalogBreadcrumb
        items={[
          { label: "Výpožičky", href: "/bookings" },
          { label: "Denná tabuľa" },
        ]}
      />

      <header className="mt-4 flex flex-col gap-4 border-b border-rule pb-6 sm:flex-row sm:items-end sm:justify-between dark:border-white/10">
        <div>
          <p className="font-mono text-[10px] tracking-[0.22em] text-sage uppercase">
            Knihovnícky pult
          </p>
          <h1 className="mt-2 font-display text-[clamp(2rem,5vw,3rem)] leading-none tracking-tight text-ink">
            Denná tabuľa
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            {board
              ? `Aktualizované ${new Date(board.generatedAt).toLocaleString("sk-SK")}`
              : "Načítavam prehľad…"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            className="rounded-none"
            onClick={() => void downloadCsv()}
          >
            <Download className="size-4" aria-hidden />
            CSV
          </Button>
          <Button
            render={<Link href="/bookings" />}
            className="rounded-none bg-ink text-paper hover:bg-ink/90"
          >
            Celý pult
          </Button>
        </div>
      </header>

      {error ? (
        <p className="mt-4 text-sm text-stair-2" role="alert">
          {error}
        </p>
      ) : null}

      {board ? (
        <>
          <div className="mt-6 grid gap-3 sm:grid-cols-4">
            {[
              { label: "Po termíne", value: board.overdueCount },
              { label: "Čoskoro", value: board.dueSoonCount },
              { label: "Na vyzdvihnutie", value: board.reservedCount },
              { label: "Požičané", value: board.activeCount },
            ].map((tile) => (
              <div
                key={tile.label}
                className="border border-rule px-4 py-3 dark:border-white/10"
              >
                <p className="font-mono text-[10px] tracking-[0.16em] text-muted-foreground uppercase">
                  {tile.label}
                </p>
                <p className="mt-1 font-display text-3xl tabular-nums text-ink">
                  {tile.value}
                </p>
              </div>
            ))}
          </div>
          <Section title="Po termíne" items={board.overdue} />
          <Section title="Blíži sa termín" items={board.dueSoon} />
          <Section title="Pripravené na vyzdvihnutie" items={board.pickupReady} />
        </>
      ) : (
        <p className="mt-6 text-sm text-muted-foreground">Kontrolujem BookingService…</p>
      )}
    </>
  );
}
