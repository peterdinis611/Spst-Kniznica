"use client";

import { useCallback, useEffect, useState } from "react";
import { useNotify } from "react-admin";
import Button from "@mui/material/Button";
import { adminHttp } from "@/lib/admin/http";
import { ToolCard, ToolShell } from "@/components/admin/tools/ToolShell";

type GatewayStatus = {
  application: string;
  routes: Array<{ routeId: string; path?: string; clusterId?: string }>;
  clusters: Array<{
    clusterId: string;
    destinations?: Array<{ key: string; address?: string }>;
  }>;
  services: Record<string, string | undefined>;
};

export function GatewayToolsPage() {
  const notify = useNotify();
  const [data, setData] = useState<GatewayStatus | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setBusy(true);
    try {
      setData(await adminHttp<GatewayStatus>("/api/gateway/status"));
    } catch (err) {
      notify(err instanceof Error ? err.message : "Gateway status zlyhal", {
        type: "error",
      });
    } finally {
      setBusy(false);
    }
  }, [notify]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <ToolShell
      title="Gateway"
      eyebrow="YARP · routing"
      lead="Aktívne routes, clustre a upstream adresy mikroslužieb."
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

      {data ? (
        <>
          <ToolCard title="Upstream služby">
            <ul className="divide-y divide-rule dark:divide-white/10">
              {Object.entries(data.services ?? {}).map(([name, url]) => (
                <li
                  key={name}
                  className="flex flex-wrap items-baseline justify-between gap-2 py-2 text-sm"
                >
                  <span className="font-display text-lg text-ink">{name}</span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {url ?? "—"}
                  </span>
                </li>
              ))}
            </ul>
          </ToolCard>

          <ToolCard title={`Routes (${data.routes?.length ?? 0})`}>
            <div className="max-h-80 overflow-auto">
              <table className="w-full text-left text-sm">
                <thead className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
                  <tr>
                    <th className="py-1 pr-3">Route</th>
                    <th className="py-1 pr-3">Path</th>
                    <th className="py-1">Cluster</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.routes ?? []).map((route) => (
                    <tr
                      key={route.routeId}
                      className="border-t border-rule dark:border-white/10"
                    >
                      <td className="py-1.5 pr-3 font-mono text-xs">
                        {route.routeId}
                      </td>
                      <td className="py-1.5 pr-3 font-mono text-xs text-muted-foreground">
                        {route.path}
                      </td>
                      <td className="py-1.5 font-mono text-xs">
                        {route.clusterId}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ToolCard>

          <ToolCard title={`Clusters (${data.clusters?.length ?? 0})`}>
            <ul className="space-y-3">
              {(data.clusters ?? []).map((cluster) => (
                <li key={cluster.clusterId}>
                  <p className="font-mono text-xs tracking-wide text-sage uppercase">
                    {cluster.clusterId}
                  </p>
                  <ul className="mt-1 space-y-0.5">
                    {(cluster.destinations ?? []).map((d) => (
                      <li
                        key={`${cluster.clusterId}-${d.key}`}
                        className="font-mono text-xs text-muted-foreground"
                      >
                        {d.key}: {d.address}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </ToolCard>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">Načítavam…</p>
      )}
    </ToolShell>
  );
}
