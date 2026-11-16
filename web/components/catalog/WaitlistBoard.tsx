"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAction } from "next-safe-action/hooks";
import { resolveActionAccessToken } from "@/lib/auth/access-token";
import { leaveWaitlistAction, listStaffWaitlistAction, type WaitlistEntry } from "@/lib/bookings";
import { Button } from "@/components/ui/button";

type CatalogRef = { id: string; title: string; author?: string };

export function WaitlistBoard({
  titles,
  getAccessToken,
  entraEnabled,
  heading = "Fronta čakateľov",
}: {
  titles: Map<string, CatalogRef>;
  getAccessToken: () => Promise<string | null | undefined>;
  entraEnabled: boolean;
  heading?: string;
}) {
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const load = useAction(listStaffWaitlistAction);
  const leave = useAction(leaveWaitlistAction);

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
                    setEntries((prev) => prev.filter((e) => e.id !== entry.id));
                  }}
                >
                  Odstrániť
                </Button>
              </li>
            );
          })
        )}
      </ul>
    </section>
  );
}