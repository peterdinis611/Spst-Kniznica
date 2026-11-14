"use client";

import { useCallback, useEffect, useState } from "react";
import { useNotify } from "react-admin";
import Button from "@mui/material/Button";
import { adminHttp } from "@/lib/admin/http";
import { ToolCard, ToolShell } from "@/components/admin/tools/ToolShell";

type RelationSummary = {
  categoryCount: number;
  authorCount: number;
  bookCount: number;
  linkedBookCount: number;
  unlinkedBookCount: number;
};

export function RelationsPage() {
  const notify = useNotify();
  const [summary, setSummary] = useState<RelationSummary | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setBusy(true);
    try {
      setSummary(await adminHttp<RelationSummary>("/api/relations/summary"));
    } catch (err) {
      notify(err instanceof Error ? err.message : "Summary zlyhalo", {
        type: "error",
      });
    } finally {
      setBusy(false);
    }
  }, [notify]);

  useEffect(() => {
    void load();
  }, [load]);

  const cards = summary
    ? [
        { label: "Kategórie", value: summary.categoryCount },
        { label: "Autori", value: summary.authorCount },
        { label: "Knihy", value: summary.bookCount },
        { label: "Prepojené", value: summary.linkedBookCount },
        { label: "Bez väzby", value: summary.unlinkedBookCount },
      ]
    : [];

  return (
    <ToolShell
      title="Relácie fondu"
      eyebrow="MessagingService · graph"
      lead="Súhrn väzieb kníh ↔ autori ↔ kategórie (cache ~1 min)."
    >
      <div className="flex justify-end">
        <Button
          variant="outlined"
          disabled={busy}
          onClick={() => void load()}
          sx={{ borderRadius: 0 }}
        >
          {busy ? "Obnovujem…" : "Obnoviť"}
        </Button>
      </div>

      {summary ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {cards.map((card) => (
            <ToolCard key={card.label} title={card.label}>
              <p className="font-display text-3xl tabular-nums text-ink">
                {card.value}
              </p>
            </ToolCard>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Načítavam súhrn…</p>
      )}

      {summary && summary.unlinkedBookCount > 0 ? (
        <p className="border border-stair-1/40 bg-stair-1/10 px-3 py-2 text-sm text-ink">
          {summary.unlinkedBookCount} kníh nemá autora ani kategóriu — skontroluj
          import alebo editáciu v Knihách.
        </p>
      ) : null}
    </ToolShell>
  );
}
