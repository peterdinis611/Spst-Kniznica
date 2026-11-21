"use client";

import { useEffect, useRef } from "react";
import { useNotify } from "react-admin";
import Button from "@mui/material/Button";
import { useAdminServices } from "@/hooks/use-admin-ops";
import { ToolCard, ToolShell } from "@/components/admin/tools/ToolShell";

export function ServicesRegistryPage() {
  const notify = useNotify();
  const { data, isFetching, isPending, dataUpdatedAt, refetch, error } =
    useAdminServices();
  const lastError = useRef<unknown>(null);

  useEffect(() => {
    if (!error || error === lastError.current) return;
    lastError.current = error;
    notify(error instanceof Error ? error.message : "Register služieb zlyhal", {
      type: "error",
    });
  }, [error, notify]);

  return (
    <ToolShell
      title="Služby"
      eyebrow="AdminService · registry"
      lead="Nakonfigurované základné URL súvisiacich mikroslužieb z AdminService. Obnovuje sa pri fokuse a každú minútu."
    >
      <div className="flex justify-end">
        <Button
          variant="outlined"
          disabled={isFetching}
          onClick={() => void refetch()}
          sx={{ borderRadius: 0 }}
        >
          {isFetching ? "Obnovujem…" : "Obnoviť"}
        </Button>
      </div>

      <ToolCard title={`Endpointy (${data?.services.length ?? 0})`}>
        {!data ? (
          <p className="text-sm text-muted-foreground">
            {isPending ? "Načítavam…" : "Bez dát"}
          </p>
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
          vygenerované · {new Date(data.generatedAt).toLocaleString("sk-SK")}
          {dataUpdatedAt ? (
            <span className="tabular-nums">
              {" "}
              · UI {new Date(dataUpdatedAt).toLocaleTimeString("sk-SK")}
              {isFetching ? " · obnovujem…" : ""}
            </span>
          ) : null}
        </p>
      ) : null}
    </ToolShell>
  );
}
