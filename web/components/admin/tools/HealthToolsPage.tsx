"use client";

import { useCallback, useEffect, useState } from "react";
import { useNotify } from "react-admin";
import Button from "@mui/material/Button";
import { apiUrl } from "@/lib/api/client";
import { fetchAdminDashboard } from "@/lib/auth/client";
import { ToolCard, ToolShell } from "@/components/admin/tools/ToolShell";
import { cn } from "@/lib/utils";

type Probe = {
  name: string;
  url: string;
  ok: boolean;
  status: number | string;
  ms: number;
};

async function probeUrl(name: string, url: string): Promise<Probe> {
  const started = performance.now();
  try {
    // Prefer BFF when URL is absolute gateway health; otherwise hit as-is via browser.
    const path = url.includes("/health")
      ? url.replace(/^https?:\/\/[^/]+/, "")
      : url;
    const target = path.startsWith("/") ? apiUrl(path) : url;
    const res = await fetch(target, {
      cache: "no-store",
      credentials: "same-origin",
    });
    return {
      name,
      url,
      ok: res.ok,
      status: res.status,
      ms: Math.round(performance.now() - started),
    };
  } catch (err) {
    return {
      name,
      url,
      ok: false,
      status: err instanceof Error ? err.message : "error",
      ms: Math.round(performance.now() - started),
    };
  }
}

export function HealthToolsPage() {
  const notify = useNotify();
  const [probes, setProbes] = useState<Probe[]>([]);
  const [busy, setBusy] = useState(false);

  const run = useCallback(async () => {
    setBusy(true);
    try {
      const dashboard = await fetchAdminDashboard();
      const results = await Promise.all(
        dashboard.services.map((s) => probeUrl(s.name, s.url)),
      );
      setProbes(results);
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

  const okCount = probes.filter((p) => p.ok).length;

  return (
    <ToolShell
      title="Health probe"
      eyebrow="Live · /health"
      lead="Paralelné overenie health endpointov všetkých služieb cez BFF."
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
                    {probe.ms} ms
                  </span>
                  <span
                    className={cn(
                      "tracking-[0.14em] uppercase",
                      probe.ok ? "text-sage" : "text-stair-2",
                    )}
                  >
                    {probe.ok ? "ok" : "fail"} · {probe.status}
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
