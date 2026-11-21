"use client";

import { useEffect, useRef } from "react";
import { Link as RaLink } from "react-router-dom";
import { useNotify } from "react-admin";
import Button from "@mui/material/Button";
import { useAdminDeskDaily } from "@/hooks/use-admin-ops";
import {
  BOOKING_STATUS_LABEL,
  type DeskBooking,
} from "@/lib/bookings";
import { ToolCard, ToolShell } from "@/components/admin/tools/ToolShell";

function DeskList({
  title,
  items,
  tone,
}: {
  title: string;
  items: DeskBooking[];
  tone?: "warn" | "sage";
}) {
  return (
    <ToolCard title={`${title} · ${items.length}`}>
      <ul className="divide-y divide-rule dark:divide-white/10">
        {items.length === 0 ? (
          <li className="py-2 text-sm text-muted-foreground">Prázdne</li>
        ) : (
          items.map((item) => (
            <li key={item.id}>
              <Button
                component={RaLink}
                to={`/bookings/${item.id}/show`}
                fullWidth
                sx={{
                  borderRadius: 0,
                  justifyContent: "space-between",
                  px: 0,
                  py: 1.25,
                  textAlign: "left",
                }}
              >
                <span className="min-w-0">
                  <span className="block truncate font-display text-base text-ink">
                    {item.bookTitle?.trim() || item.bookId}
                  </span>
                  <span className="block truncate font-mono text-[11px] text-muted-foreground">
                    {item.borrowerName} · {item.borrowerEmail}
                  </span>
                </span>
                <span className="shrink-0 text-right font-mono text-[11px]">
                  <span
                    className={
                      tone === "warn"
                        ? "text-stair-2"
                        : tone === "sage"
                          ? "text-sage"
                          : "text-muted-foreground"
                    }
                  >
                    {BOOKING_STATUS_LABEL[item.status]}
                  </span>
                  <span className="block tabular-nums text-muted-foreground">
                    {new Date(item.dueDate).toLocaleString("sk-SK")}
                  </span>
                </span>
              </Button>
            </li>
          ))
        )}
      </ul>
    </ToolCard>
  );
}

export function DeskToolsPage() {
  const notify = useNotify();
  const {
    data: board,
    isFetching,
    isPending,
    dataUpdatedAt,
    refetch,
    error,
  } = useAdminDeskDaily();
  const lastError = useRef<unknown>(null);

  useEffect(() => {
    if (!error || error === lastError.current) return;
    lastError.current = error;
    notify(error instanceof Error ? error.message : "Denný pult zlyhal", {
      type: "error",
    });
  }, [error, notify]);

  const counts = board
    ? [
        { label: "Po termíne", value: board.overdueCount, tone: "warn" as const },
        { label: "Blíži sa", value: board.dueSoonCount },
        {
          label: "Na vyzdvihnutie",
          value: board.reservedCount,
          tone: "sage" as const,
        },
        { label: "Aktívne", value: board.activeCount },
      ]
    : [];

  return (
    <ToolShell
      title="Denný pult"
      eyebrow="BookingService · desk/daily"
      lead="Dnešný prehľad: po termíne, blízke termíny a rezervácie na vyzdvihnutie. Obnovuje sa každých ~30 s a pri návrate na tab."
    >
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outlined"
          disabled={isFetching}
          onClick={() => void refetch()}
          sx={{ borderRadius: 0 }}
        >
          {isFetching ? "Obnovujem…" : "Obnoviť"}
        </Button>
        <Button
          component={RaLink}
          to="/tools/barcode"
          variant="contained"
          color="secondary"
          sx={{ borderRadius: 0 }}
        >
          Skener / čiarový kód
        </Button>
        <Button
          component={RaLink}
          to="/bookings"
          variant="outlined"
          sx={{ borderRadius: 0 }}
        >
          Všetky rezervácie
        </Button>
      </div>

      {board ? (
        <>
          <p className="font-mono text-[11px] text-muted-foreground">
            generované {new Date(board.generatedAt).toLocaleString("sk-SK")}
            {dataUpdatedAt ? (
              <span className="tabular-nums">
                {" "}
                · UI {new Date(dataUpdatedAt).toLocaleTimeString("sk-SK")}
                {isFetching ? " · obnovujem…" : ""}
              </span>
            ) : null}
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {counts.map((c) => (
              <ToolCard key={c.label} title={c.label}>
                <p
                  className={
                    c.tone === "warn"
                      ? "font-display text-3xl tabular-nums text-stair-2"
                      : c.tone === "sage"
                        ? "font-display text-3xl tabular-nums text-sage"
                        : "font-display text-3xl tabular-nums text-ink"
                  }
                >
                  {c.value}
                </p>
              </ToolCard>
            ))}
          </div>
          <DeskList title="Po termíne" items={board.overdue} tone="warn" />
          <DeskList title="Blíži sa termín" items={board.dueSoon} />
          <DeskList
            title="Na vyzdvihnutie"
            items={board.pickupReady}
            tone="sage"
          />
        </>
      ) : (
        <p className="text-sm text-muted-foreground">
          {isPending || isFetching ? "Načítavam denný pult…" : "Bez dát"}
        </p>
      )}
    </ToolShell>
  );
}
