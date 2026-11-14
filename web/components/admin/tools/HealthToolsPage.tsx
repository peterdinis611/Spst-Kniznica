"use client";

import { useCallback, useEffect, useState } from "react";
import { useNotify } from "react-admin";
import Button from "@mui/material/Button";
import { fetchAdminProbe, type AdminProbe } from "@/lib/admin/ops";
import { ToolCard, ToolShell } from "@/components/admin/tools/ToolShell";
import { cn } from "@/lib/utils";

export function HealthToolsPage() {
  const notify = useNotify();
  const [data, setData] = useState<AdminProbe | null>(null);
  const [busy, setBusy] = useState(false);

  const run = useCallback(async () => {
    setBusy(true);
    try {
      setData(await fetchAdminProbe());
    } catch (err) {
      notify(err instanceof Error ? err.message : "Probe zlyhal", {
        type: "error",
      });
    } finally {
      setBusy(false);
    }
  }, [notify]);

  useEffect(() => {
    void run();
  }, [run]);

  const probes = data?.services ?? [];
  const okCount = data?.healthyCount ?? 0;

  return (
    <ToolShell
      title="Health probe"
      eyebrow="AdminService · /api/admin/probe"
      lead="Paralelné overenie /health všetkých služieb zo servera AdminService (s latenciou)."
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-mono text-xs text-muted-foreground">
          {probes.length
            ? `${okCount}/${probes.length} OK`
            : "Čakám na výsledky…"}
        </p>
        <Button
          variant="contained"
          color="secondary"
          disabled={busy}
          onClick={() => void run()}
          sx={{ borderRadius: 0 }}
        >
          {busy ? "Testujem…" : "Spustiť znova"}
        </Button>
      </div>

      <ToolCard title="Výsledky">
        {probes.length === 0 ? (
          <p className="text-sm text-muted-foreground">Zatiaľ prázdne.</p>
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
                    {probe.healthy ? "ok" : "fail"} · {probe.status}
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
