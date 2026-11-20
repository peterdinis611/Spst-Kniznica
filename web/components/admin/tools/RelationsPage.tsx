"use client";

import { useCallback, useEffect, useState } from "react";
import { Link as RaLink } from "react-router-dom";
import { useNotify } from "react-admin";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import { adminHttp } from "@/lib/admin/http";
import { ToolCard, ToolShell } from "@/components/admin/tools/ToolShell";

type RelationSummary = {
  categoryCount: number;
  authorCount: number;
  bookCount: number;
  linkedBookCount: number;
  unlinkedBookCount: number;
};

type ExplorerKind = "authors" | "categories" | "books";

type ExplorerResult = {
  path: string;
  payload: unknown;
};

export function RelationsPage() {
  const notify = useNotify();
  const [summary, setSummary] = useState<RelationSummary | null>(null);
  const [busy, setBusy] = useState(false);
  const [kind, setKind] = useState<ExplorerKind>("books");
  const [entityId, setEntityId] = useState("");
  const [withBooks, setWithBooks] = useState(false);
  const [result, setResult] = useState<ExplorerResult | null>(null);

  const load = useCallback(async () => {
    setBusy(true);
    try {
      setSummary(await adminHttp<RelationSummary>("/api/relations/summary"));
    } catch (err) {
      notify(err instanceof Error ? err.message : "Súhrn zlyhal", {
        type: "error",
      });
    } finally {
      setBusy(false);
    }
  }, [notify]);

  useEffect(() => {
    void load();
  }, [load]);

  async function explore() {
    const id = entityId.trim();
    if (!id) {
      notify("Zadaj UUID entity", { type: "warning" });
      return;
    }
    setBusy(true);
    try {
      const path =
        kind !== "books" && withBooks
          ? `/api/relations/${kind}/${id}/books`
          : `/api/relations/${kind}/${id}`;
      const payload = await adminHttp<unknown>(path);
      setResult({ path, payload });
    } catch (err) {
      setResult(null);
      notify(err instanceof Error ? err.message : "Relácia nenájdená", {
        type: "warning",
      });
    } finally {
      setBusy(false);
    }
  }

  const cards = summary
    ? [
        { label: "Kategórie", value: summary.categoryCount },
        { label: "Autori", value: summary.authorCount },
        { label: "Knihy", value: summary.bookCount },
        { label: "Prepojené", value: summary.linkedBookCount },
        { label: "Bez väzby", value: summary.unlinkedBookCount },
      ]
    : [];

  const adminLink =
    kind === "books"
      ? `/books/${entityId.trim()}/show`
      : kind === "authors"
        ? `/authors/${entityId.trim()}/show`
        : `/categories/${entityId.trim()}/show`;

  return (
    <ToolShell
      title="Relácie fondu"
      eyebrow="MessagingService · graf"
      lead="Súhrn väzieb kníh ↔ autori ↔ kategórie a prieskumník podľa ID."
    >
      <div className="flex justify-end">
        <Button
          variant="outlined"
          disabled={busy}
          onClick={() => void load()}
          sx={{ borderRadius: 0 }}
        >
          {busy ? "Obnovujem…" : "Obnoviť súhrn"}
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

      <ToolCard title="Prieskumník relácií">
        <ToggleButtonGroup
          exclusive
          size="small"
          value={kind}
          onChange={(_, next: ExplorerKind | null) => {
            if (next) setKind(next);
          }}
          sx={{ mb: 2, "& .MuiToggleButton-root": { borderRadius: 0 } }}
        >
          <ToggleButton value="books">Kniha</ToggleButton>
          <ToggleButton value="authors">Autor</ToggleButton>
          <ToggleButton value="categories">Kategória</ToggleButton>
        </ToggleButtonGroup>
        <TextField
          size="small"
          fullWidth
          label="UUID"
          value={entityId}
          onChange={(e) => setEntityId(e.target.value)}
          sx={{ mb: 2, "& .MuiOutlinedInput-root": { borderRadius: 0 } }}
        />
        {kind !== "books" ? (
          <label className="mb-3 flex items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={withBooks}
              onChange={(e) => setWithBooks(e.target.checked)}
            />
            Načítať aj zoznam kníh (`…/books`)
          </label>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="contained"
            color="secondary"
            disabled={busy || !entityId.trim()}
            onClick={() => void explore()}
            sx={{ borderRadius: 0 }}
          >
            Načítať
          </Button>
          {entityId.trim() ? (
            <Button
              component={RaLink}
              to={adminLink}
              variant="outlined"
              sx={{ borderRadius: 0 }}
            >
              Otvoriť v admin
            </Button>
          ) : null}
        </div>
      </ToolCard>

      {result ? (
        <ToolCard title={result.path}>
          <pre className="max-h-96 overflow-auto bg-paper-deep/80 p-3 font-mono text-xs text-ink dark:bg-black/30">
            {JSON.stringify(result.payload, null, 2)}
          </pre>
        </ToolCard>
      ) : null}
    </ToolShell>
  );
}
