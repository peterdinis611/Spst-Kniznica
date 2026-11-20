"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAction } from "next-safe-action/hooks";
import { resolveActionAccessToken } from "@/lib/auth/access-token";
import { useBookSummaries } from "@/hooks/use-book-summaries";
import {
  leaveWaitlistAction,
  listStaffWaitlistAction,
  promoteWaitlistAction,
  type WaitlistEntry,
} from "@/lib/bookings";
import { Button } from "@/components/ui/button";

type CatalogRef = { id: string; title: string; author?: string };

export function WaitlistBoard({
  titles: seedTitles,
  getAccessToken,
  entraEnabled,
  heading = "Fronta čakateľov",
  allowPromote = true,
}: {
  titles?: Map<string, CatalogRef>;
  getAccessToken: () => Promise<string | null | undefined>;
  entraEnabled: boolean;
  heading?: string;
  allowPromote?: boolean;
}) {
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [promotingBookId, setPromotingBookId] = useState<string | null>(null);
  const load = useAction(listStaffWaitlistAction);
  const leave = useAction(leaveWaitlistAction);
  const promote = useAction(promoteWaitlistAction);

  const tokenGetter = useCallback(
    async () => (await getAccessToken()) ?? null,
    [getAccessToken],
  );

  const refresh = useCallback(async () => {
    const accessToken = await resolveActionAccessToken({
      entraEnabled,
      getAccessToken: tokenGetter,
    });
    const result = await load.executeAsync({ accessToken, limit: 200 });
    if (result?.data) setEntries(result.data);
    else if (result?.serverError) setError(result.serverError);
  }, [entraEnabled, tokenGetter, load]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const summaryIds = useMemo(
    () => entries.map((entry) => entry.bookId),
    [entries],
  );
  const { catalog: summaryCatalog } = useBookSummaries(summaryIds);

  const titles = useMemo(() => {
    const map = new Map<string, CatalogRef>(seedTitles ?? []);
    for (const book of summaryCatalog) map.set(book.id, book);
    return map;
  }, [seedTitles, summaryCatalog]);

  const headingId = "staff-waitlist-heading";

  return (
    <section className="mt-10" aria-labelledby={headingId}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2
          id={headingId}
          className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase"
        >
          {heading} · {entries.length}
        </h2>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-none"
          disabled={load.isPending}
          onClick={() => void refresh()}
        >
          Obnoviť
        </Button>
      </div>

      {error ? (
        <p className="mt-2 text-sm text-stair-2" role="alert">
          {error}
        </p>
      ) : null}

      <ul
        className="mt-3 divide-y divide-rule border border-rule dark:divide-white/10 dark:border-white/10"
        aria-label={heading}
      >
        {load.isPending && entries.length === 0 ? (
          <li className="px-4 py-3 text-sm text-muted-foreground">Načítavam…</li>
        ) : entries.length === 0 ? (
          <li className="px-4 py-3 text-sm text-muted-foreground">
            Čakací zoznam je prázdny.
          </li>
        ) : (
          entries.map((entry) => {
            const book = titles.get(entry.bookId);
            const isFirst =
              entries.find((e) => e.bookId === entry.bookId)?.id === entry.id;
            return (
              <li
                key={entry.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="font-display text-lg text-ink">
                    {book ? (
                      <Link href={`/books/${book.id}`}>{book.title}</Link>
                    ) : (
                      <span className="font-mono text-sm">{entry.bookId}</span>
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {entry.borrowerName} · {entry.borrowerEmail}
                  </p>
                  <p className="font-mono text-[11px] text-muted-foreground">
                    pozícia #{entry.position} ·{" "}
                    {new Date(entry.createdAt).toLocaleString("sk-SK")}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {allowPromote && isFirst ? (
                    <Button
                      type="button"
                      size="sm"
                      className="rounded-none"
                      disabled={
                        promote.isPending && promotingBookId === entry.bookId
                      }
                      onClick={async () => {
                        setError(null);
                        setPromotingBookId(entry.bookId);
                        const accessToken = await resolveActionAccessToken({
                          entraEnabled,
                          getAccessToken: tokenGetter,
                        });
                        const result = await promote.executeAsync({
                          bookId: entry.bookId,
                          accessToken,
                        });
                        setPromotingBookId(null);
                        if (result?.serverError) {
                          setError(result.serverError);
                          return;
                        }
                        if (result?.data && !result.data.promoted) {
                          setError(
                            "Promote neprebehlo (žiadny čakateľ alebo plná kapacita).",
                          );
                        }
                        await refresh();
                      }}
                    >
                      Promote
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-none"
                    disabled={leave.isPending}
                    onClick={async () => {
                      const accessToken = await resolveActionAccessToken({
                        entraEnabled,
                        getAccessToken: tokenGetter,
                      });
                      await leave.executeAsync({ id: entry.id, accessToken });
                      setEntries((prev) =>
                        prev.filter((e) => e.id !== entry.id),
                      );
                    }}
                  >
                    Odstrániť
                  </Button>
                </div>
              </li>
            );
          })
        )}
      </ul>
    </section>
  );
}
