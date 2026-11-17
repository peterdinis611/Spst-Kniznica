"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAction } from "next-safe-action/hooks";
import { Download, ScanLine } from "lucide-react";
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
import { CatalogSkeleton } from "@/components/catalog/CatalogSkeleton";
import { WaitlistBoard } from "@/components/catalog/WaitlistBoard";
import { useCatalogRefs } from "@/hooks/use-catalog-refs";

type CatalogRef = { id: string; title: string; author: string };

function DeskSection({
  title,
  items,
  titles,
}: {
  title: string;
  items: DeskBooking[];
  titles: Map<string, CatalogRef>;
}) {
  const headingId = `desk-section-${title.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <section className="mt-8" aria-labelledby={headingId}>
      <h2
        id={headingId}
        className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase"
      >
        {title} · {items.length}
      </h2>
      <ul
        className="mt-3 divide-y divide-rule border border-rule dark:divide-white/10 dark:border-white/10"
        aria-label={title}
      >
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
                    ) : item.bookTitle ? (
                      <Link href={`/books/${item.bookId}`}>{item.bookTitle}</Link>
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

export function DeskDailyBoard() {
  const { user, getAccessToken, ready, entraEnabled } = useAuth();
  const ability = useAbility();
  const canManage = ability.can("manage", "BookingsDesk");
  const { catalog } = useCatalogRefs();
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
    return <CatalogSkeleton rows={5} variant="desk" />;
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
        <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap">
          <Button
            type="button"
            variant="outline"
            className="w-full rounded-none sm:w-auto"
            onClick={() => void downloadCsv()}
          >
            <Download className="size-4" aria-hidden />
            CSV
          </Button>
          <Button
            render={<Link href="/bookings" />}
            className="w-full rounded-none bg-ink text-paper hover:bg-ink/90 sm:w-auto"
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

      <div className="mt-6 flex flex-col gap-3 border border-ink bg-paper-deep px-4 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-white/15">
        <div className="flex items-start gap-3 sm:items-center">
          <ScanLine className="mt-0.5 size-5 shrink-0 text-accent sm:mt-0" aria-hidden />
          <p className="text-sm text-muted-foreground">
            Naskenuj inventárne číslo alebo čiarový kód pri výdaji a vrátení.
          </p>
        </div>
        <Button
          render={<Link href="/bookings?scan=1" />}
          className="h-11 w-full shrink-0 rounded-none bg-ink text-paper hover:bg-ink/90 sm:h-10 sm:w-auto"
        >
          Otvoriť pult so skenerom
        </Button>
      </div>

      {board ? (
        <>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
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
          <DeskSection title="Po termíne" items={board.overdue} titles={titles} />
          <DeskSection title="Blíži sa termín" items={board.dueSoon} titles={titles} />
          <DeskSection
            title="Pripravené na vyzdvihnutie"
            items={board.pickupReady}
            titles={titles}
          />
          <WaitlistBoard
            titles={titles}
            getAccessToken={getAccessToken}
            entraEnabled={entraEnabled}
          />
        </>
      ) : (
        <div className="mt-6">
          <CatalogSkeleton rows={4} variant="desk" />
        </div>
      )}
    </>
  );
}
