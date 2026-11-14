"use client";

import { useState } from "react";
import { useNotify } from "react-admin";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import { adminHttpDownload } from "@/lib/admin/http";
import { withQuery } from "@/lib/api/client";
import { ToolCard, ToolShell } from "@/components/admin/tools/ToolShell";

type ExportTarget = {
  id: string;
  label: string;
  path: string;
  note: string;
  adminOnly?: boolean;
};

const TARGETS: ExportTarget[] = [
  {
    id: "books",
    label: "Knihy",
    path: "/api/books/export",
    note: "Katalóg (max 5000 riadkov). Staff.",
  },
  {
    id: "authors",
    label: "Autori",
    path: "/api/authors/export",
    note: "Autori. Staff.",
  },
  {
    id: "categories",
    label: "Kategórie",
    path: "/api/categories/export",
    note: "Kategórie. Staff.",
  },
  {
    id: "bookings",
    label: "Rezervácie / výpožičky",
    path: "/api/bookings/export",
    note: "Obsahuje PII (meno, email). Staff · auditované.",
  },
  {
    id: "desk",
    label: "Denný pult",
    path: "/api/bookings/desk/daily.csv",
    note: "Overdue / due soon / pickup. Len CSV. Staff · PII.",
  },
  {
    id: "audit",
    label: "Audit logy",
    path: "/api/admin/audit-logs/export",
    note: "Len Admin (nie Librarian). Auditované.",
    adminOnly: true,
  },
];

function triggerDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function DataExportPage() {
  const notify = useNotify();
  const [format, setFormat] = useState<"csv" | "xml">("csv");
  const [take, setTake] = useState(2000);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function onExport(target: ExportTarget) {
    setBusyId(target.id);
    try {
      const isDesk = target.id === "desk";
      const path = isDesk
        ? target.path
        : withQuery(target.path, {
            format: format,
            take: Math.min(5000, Math.max(1, take)),
          });
      const fallback = `${target.id}-export.${isDesk ? "csv" : format}`;
      const { blob, fileName } = await adminHttpDownload(path, fallback);
      triggerDownload(blob, fileName);
      notify(`Export ${target.label} stiahnutý`, { type: "success" });
    } catch (err) {
      notify(err instanceof Error ? err.message : "Export zlyhal", {
        type: "error",
      });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <ToolShell
      title="Export dát"
      eyebrow="CSV · XML · pen-test ready"
      lead="Serverové exporty so Staff/Admin oprávnením, rate limitom (data-export), audit logom a ochranou proti CSV formula injection. Max 5000 riadkov na request."
    >
      <ToolCard title="Formát">
        <div className="flex flex-wrap gap-3">
          <TextField
            select
            label="Formát"
            size="small"
            value={format}
            onChange={(e) => setFormat(e.target.value as "csv" | "xml")}
            sx={{ minWidth: 140 }}
          >
            <MenuItem value="csv">CSV</MenuItem>
            <MenuItem value="xml">XML</MenuItem>
          </TextField>
          <TextField
            type="number"
            label="Max riadkov"
            size="small"
            value={take}
            onChange={(e) => setTake(Number(e.target.value) || 2000)}
            slotProps={{ htmlInput: { min: 1, max: 5000 } }}
            sx={{ width: 140 }}
          />
        </div>
        <p className="mt-3 font-mono text-[11px] text-muted-foreground">
          Denný pult je vždy CSV. Audit export vyžaduje AdminOnly. Cache-Control:
          no-store.
        </p>
      </ToolCard>

      <ToolCard title="Dataset">
        <ul className="space-y-3">
          {TARGETS.map((target) => (
            <li
              key={target.id}
              className="flex flex-col gap-2 border border-rule p-3 sm:flex-row sm:items-center sm:justify-between dark:border-white/10"
            >
              <div className="min-w-0">
                <p className="font-display text-lg text-ink">{target.label}</p>
                <p className="font-mono text-[11px] text-muted-foreground">
                  {target.note}
                </p>
              </div>
              <Button
                variant="contained"
                color="secondary"
                disabled={busyId !== null}
                onClick={() => void onExport(target)}
                sx={{ borderRadius: 0, shrink: 0 }}
              >
                {busyId === target.id
                  ? "Sťahujem…"
                  : `Stiahnuť ${target.id === "desk" ? "CSV" : format.toUpperCase()}`}
              </Button>
            </li>
          ))}
        </ul>
      </ToolCard>
    </ToolShell>
  );
}
