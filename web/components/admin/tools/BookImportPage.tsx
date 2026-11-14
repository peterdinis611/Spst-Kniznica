"use client";

import { useCallback, useState } from "react";
import { useNotify } from "react-admin";
import Button from "@mui/material/Button";
import {
  isTurnstileConfigured,
  TurnstileWidget,
} from "@/components/security/TurnstileWidget";
import { adminHttpForm } from "@/lib/admin/http";
import { ToolCard, ToolShell } from "@/components/admin/tools/ToolShell";

type ImportResult = {
  totalRows: number;
  importedCount: number;
  skippedCount: number;
  errors: Array<{ rowNumber: number; message: string }>;
};

export function BookImportPage() {
  const notify = useNotify();
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const turnstileRequired = isTurnstileConfigured();
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const onTurnstile = useCallback((token: string | null) => {
    setTurnstileToken(token);
  }, []);

  async function onImport() {
    if (!file) {
      notify("Vyber súbor .csv, .xml alebo .xlsx", { type: "warning" });
      return;
    }
    if (turnstileRequired && !turnstileToken) {
      notify("Dokonči Turnstile overenie", { type: "warning" });
      return;
    }
    setBusy(true);
    setResult(null);
    try {
      const body = new FormData();
      body.append("file", file);
      if (turnstileToken) body.append("turnstileToken", turnstileToken);
      const data = await adminHttpForm<ImportResult>("/api/books/import", body);
      setResult(data);
      notify(
        `Import: ${data.importedCount} OK, ${data.skippedCount} preskočených`,
        { type: data.skippedCount ? "warning" : "success" },
      );
    } catch (err) {
      notify(err instanceof Error ? err.message : "Import zlyhal", {
        type: "error",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <ToolShell
      title="Import kníh"
      eyebrow="BookService · bulk"
      lead="Nahraj CSV, XML alebo Excel (.xlsx). Súbor max. ~20 MB. Vyžaduje staff rolu. Turnstile sa vynúti, keď je nastavený kľúč."
    >
      <ToolCard title="Súbor">
        <input
          type="file"
          accept=".csv,.xml,.xlsx,text/csv,application/xml,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="block w-full text-sm text-muted-foreground file:mr-3 file:border file:border-rule file:bg-transparent file:px-3 file:py-2 file:text-ink dark:file:border-white/20"
        />
        {file ? (
          <p className="mt-2 font-mono text-xs text-muted-foreground">
            {file.name} · {(file.size / 1024).toFixed(1)} KB
          </p>
        ) : null}
        <TurnstileWidget onToken={onTurnstile} />
        <Button
          variant="contained"
          color="secondary"
          disabled={busy || !file || (turnstileRequired && !turnstileToken)}
          onClick={() => void onImport()}
          sx={{ mt: 2, borderRadius: 0 }}
        >
          {busy ? "Importujem…" : "Spustiť import"}
        </Button>
      </ToolCard>

      {result ? (
        <ToolCard title="Výsledok">
          <dl className="grid grid-cols-3 gap-3 font-mono text-sm">
            <div>
              <dt className="text-[10px] tracking-wider text-muted-foreground uppercase">
                Riadky
              </dt>
              <dd className="text-xl text-ink tabular-nums">{result.totalRows}</dd>
            </div>
            <div>
              <dt className="text-[10px] tracking-wider text-muted-foreground uppercase">
                Importované
              </dt>
              <dd className="text-xl text-sage tabular-nums">
                {result.importedCount}
              </dd>
            </div>
            <div>
              <dt className="text-[10px] tracking-wider text-muted-foreground uppercase">
                Preskočené
              </dt>
              <dd className="text-xl text-stair-1 tabular-nums">
                {result.skippedCount}
              </dd>
            </div>
          </dl>
          {result.errors.length > 0 ? (
            <ul className="mt-4 max-h-64 space-y-1 overflow-auto border-t border-rule pt-3 text-sm dark:border-white/10">
              {result.errors.map((err) => (
                <li key={`${err.rowNumber}-${err.message}`}>
                  <span className="font-mono text-xs text-muted-foreground">
                    r.{err.rowNumber}
                  </span>{" "}
                  {err.message}
                </li>
              ))}
            </ul>
          ) : null}
        </ToolCard>
      ) : null}
    </ToolShell>
  );
}
