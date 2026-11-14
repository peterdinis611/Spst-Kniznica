"use client";

import { useCallback, useEffect, useState } from "react";
import { useNotify } from "react-admin";
import Button from "@mui/material/Button";
import {
  fetchAdminServices,
  type ServiceRegistry,
} from "@/lib/admin/ops";
import { ToolCard, ToolShell } from "@/components/admin/tools/ToolShell";

export function ServicesRegistryPage() {
  const notify = useNotify();
  const [data, setData] = useState<ServiceRegistry | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setBusy(true);
    try {
      setData(await fetchAdminServices());
    } catch (err) {
      notify(err instanceof Error ? err.message : "Registry zlyhal", {
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
      title="Služby"
      eyebrow="AdminService · registry"
      lead="Konfigurované base URL sibling mikroslužieb z AdminService."
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

      <ToolCard title={`Endpointy (${data?.services.length ?? 0})`}>
        {!data ? (
          <p className="text-sm text-muted-foreground">Načítavam…</p>
        ) : (
          <ul className="divide-y divide-rule dark:divide-white/10">
            {data.services.map((service) => (
              <li
                key={service.name}
                className="flex flex-wrap items-baseline justify-between gap-2 py-3"
              >
                <div className="min-w-0">
                  <p className="font-display text-lg text-ink">{service.name}</p>
                  <p className="font-mono text-[11px] text-muted-foreground">
                    {service.configKey}
                  </p>
                </div>
                <div className="text-right font-mono text-xs text-muted-foreground">
                  <p>{service.baseUrl}</p>
                  <p className="text-[10px]">{service.healthUrl}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </ToolCard>
      {data ? (
        <p className="font-mono text-[10px] text-muted-foreground">
          generated · {new Date(data.generatedAt).toLocaleString("sk-SK")}
        </p>
      ) : null}
    </ToolShell>
  );
}
