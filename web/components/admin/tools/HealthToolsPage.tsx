"use client";

import { useEffect, useRef } from "react";
import { useNotify } from "react-admin";
import Button from "@mui/material/Button";
import { useAdminProbe } from "@/hooks/use-admin-ops";
import { ToolCard, ToolShell } from "@/components/admin/tools/ToolShell";
import { cn } from "@/lib/utils";

export function HealthToolsPage() {
  const notify = useNotify();
  const { data, isFetching, isPending, dataUpdatedAt, refetch, error } =
    useAdminProbe();
  const lastError = useRef<unknown>(null);

  useEffect(() => {
    if (!error || error === lastError.current) return;
    lastError.current = error;
    notify(error instanceof Error ? error.message : "Kontrola zlyhala", {
      type: "error",
    });
  }, [error, notify]);

  const probes = data?.services ?? [];
  const okCount = data?.healthyCount ?? 0;

  return (
    <ToolShell
      title="Kontrola zdravia služieb"
      eyebrow="AdminService · /api/admin/probe"
      lead="Paralelné overenie /health všetkých služieb zo servera AdminService (s latenciou). Obnovuje sa automaticky každých ~20 s a pri návrate na tab."
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-mono text-xs text-muted-foreground">
          {probes.length
            ? `${okCount}/${probes.length} v poriadku`
            : isPending
              ? "Čakám na výsledky…"
              : "Zatiaľ prázdne"}
          {dataUpdatedAt ? (
            <span className="ml-2 tabular-nums">
              · {new Date(dataUpdatedAt).toLocaleTimeString("sk-SK")}
              {isFetching ? " · obnovujem…" : ""}
            </span>
          ) : null}
        </p>
        <Button
          variant="contained"
          color="secondary"
          disabled={isFetching}
          onClick={() => void refetch()}
          sx={{ borderRadius: 0 }}
        >
          {isFetching ? "Testujem…" : "Spustiť znova"}
        </Button>
      </div>

      <ToolCard title="Výsledky">
        {probes.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {isPending ? "Načítavam…" : "Zatiaľ prázdne."}
          </p>
        ) : (
          <ul className="divide-y divide-rule dark:divide-white/10">
            {probes.map((probe) => (
              <li
                key={probe.name}
                className="flex flex-wrap items-center justify-between gap-2 py-3"
              >
                <div className="min-w-0">
                  <p className="font-display text-lg text-ink">{probe.name}</p>
                  <p className="truncate font-mono text-[11px] text-muted-foreground">
                    {probe.url}
                  </p>
                </div>
                <div className="flex items-center gap-3 font-mono text-xs">
                  <span className="text-muted-foreground tabular-nums">
                    {probe.latencyMs ?? "—"} ms
                  </span>
                  <span
                    className={cn(
                      "tracking-[0.14em] uppercase",
                      probe.healthy ? "text-sage" : "text-stair-2",
                    )}
                  >
                    {probe.healthy ? "v poriadku" : "zlyhalo"} · {probe.status}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </ToolCard>
    </ToolShell>
  );
}
