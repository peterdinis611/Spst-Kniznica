"use client";

import { useEffect, useState } from "react";
import { Title, useGetIdentity } from "react-admin";
import Button from "@mui/material/Button";
import Link from "next/link";
import { AdminHealthChart } from "@/components/auth/AdminHealthChart";
import { fetchAdminDashboard } from "@/lib/auth/client";
import { cn } from "@/lib/utils";

type Dashboard = Awaited<ReturnType<typeof fetchAdminDashboard>>;

export function AdminRaDashboard() {
  const { data: identity } = useGetIdentity();
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const dashboard = await fetchAdminDashboard();
        if (!cancelled) setData(dashboard);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Načítanie zlyhalo");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-4 md:p-8">
      <Title title="Prehľad" />

      <header className="flex flex-col gap-5 border-b border-rule pb-6 sm:flex-row sm:items-end sm:justify-between dark:border-white/10">
        <div className="min-w-0">
          <p className="font-mono text-[10px] tracking-[0.22em] text-sage uppercase">
            AdminService · prevádzka
          </p>
          <h1 className="mt-2 font-display text-[clamp(1.9rem,4vw,2.75rem)] leading-none tracking-tight text-ink">
            Prevádzkový pult
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            {identity?.fullName}
            {data ? (
              <>
                {" · "}
                <span className="text-sage tabular-nums">
                  {data.healthyCount} healthy
                </span>
                {" / "}
                <span
                  className={cn(
                    "tabular-nums",
                    data.unhealthyCount > 0 ? "text-stair-2" : "text-muted-foreground",
                  )}
                >
                  {data.unhealthyCount} down
                </span>
              </>
            ) : null}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            component={Link}
            href="/books"
            variant="outlined"
            color="primary"
            sx={{ borderRadius: 0, px: 2.5 }}
          >
            Katalóg
          </Button>
          <Button
            component={Link}
            href="/bookings"
            variant="contained"
            color="secondary"
            sx={{ borderRadius: 0, px: 2.5 }}
          >
            Pult výpožičiek
          </Button>
        </div>
      </header>

      {error ? (
        <p
          className="border border-red-500/35 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      {data ? (
        <>
          <AdminHealthChart
            services={data.services}
            healthyCount={data.healthyCount}
            unhealthyCount={data.unhealthyCount}
          />

          <section>
            <p className="mb-3 font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase">
              Mikroslužby
            </p>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {data.services.map((service) => (
                <li
                  key={service.name}
                  className={cn(
                    "relative border border-rule bg-card/70 px-4 py-4 dark:border-white/10 dark:bg-paper-deep/70",
                    "before:absolute before:inset-y-0 before:left-0 before:w-[3px]",
                    service.healthy
                      ? "before:bg-sage"
                      : "before:bg-stair-2",
                  )}
                >
                  <div className="flex items-start justify-between gap-3 pl-1">
                    <h2 className="font-display text-xl leading-tight tracking-tight text-ink">
                      {service.name.replace(/Service$/i, "")}
                      <span className="font-sans text-sm font-normal text-muted-foreground">
                        Service
                      </span>
                    </h2>
                    <span
                      className={cn(
                        "shrink-0 font-mono text-[10px] tracking-[0.16em] uppercase",
                        service.healthy ? "text-sage" : "text-stair-2",
                      )}
                    >
                      {service.healthy ? "healthy" : service.status}
                    </span>
                  </div>
                  <p className="mt-2 truncate pl-1 font-mono text-[11px] text-muted-foreground">
                    {service.url}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">Kontrolujem služby…</p>
      )}
    </div>
  );
}
