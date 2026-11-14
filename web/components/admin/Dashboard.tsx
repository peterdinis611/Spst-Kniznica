"use client";

import { useEffect, useState } from "react";
import { Title, useGetIdentity } from "react-admin";
import { Link as RaLink } from "react-router-dom";
import Button from "@mui/material/Button";
import Link from "next/link";
import { AdminHealthChart } from "@/components/auth/AdminHealthChart";
import {
  fetchAdminOverview,
  type AdminOverview,
} from "@/lib/admin/ops";
import {
  BOOKING_STATUS_LABEL,
  normalizeBookingStatus,
  type BookingStatusCode,
} from "@/lib/bookings/status";
import { cn } from "@/lib/utils";

const TOOL_LINKS = [
  { to: "/audit-logs", label: "Audit" },
  { to: "/tools/export", label: "Export" },
  { to: "/tools/import", label: "Import" },
  { to: "/tools/gateway", label: "Gateway" },
  { to: "/tools/health", label: "Health" },
  { to: "/tools/services", label: "Služby" },
  { to: "/tools/cache", label: "Cache" },
  { to: "/tools/messaging", label: "Messaging" },
  { to: "/tools/relations", label: "Relácie" },
  { to: "/tools/orders", label: "Workers" },
  { to: "/tools/links", label: "Odkazy" },
  { to: "/tools/account", label: "Účet" },
] as const;

function CatalogWidgets({ data }: { data: AdminOverview }) {
  const tiles = [
    {
      to: "/books",
      label: "Knihy",
      total: data.catalog.books,
    },
    {
      to: "/books",
      label: "Dostupné tituly",
      total: data.catalog.availableBooks,
      tone: "sage" as const,
    },
    {
      to: "/authors",
      label: "Autori",
      total: data.catalog.authors,
    },
    {
      to: "/categories",
      label: "Kategórie",
      total: data.catalog.categories,
    },
    {
      to: "/bookings",
      label: "Rezervácie",
      total: data.bookings.total,
    },
    {
      to: "/bookings?filter=%7B%22status%22%3A1%7D",
      label: "Požičané",
      total: data.bookings.active,
      tone: "sage" as const,
    },
    {
      to: "/bookings?filter=%7B%22status%22%3A4%7D",
      label: "Po termíne",
      total: data.bookings.overdue,
      tone: "warn" as const,
    },
    {
      to: "/bookings?filter=%7B%22status%22%3A0%7D",
      label: "Čakajúce",
      total: data.bookings.reserved,
    },
  ];

  return (
    <section>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <p className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase">
          Katalóg · výpožičky
        </p>
        {data.catalog.partial || data.bookings.partial ? (
          <p className="font-mono text-[10px] text-stair-2 uppercase">
            čiastočné dáta
          </p>
        ) : null}
      </div>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((tile) => (
          <li key={tile.label}>
            <Button
              component={RaLink}
              to={tile.to}
              fullWidth
              sx={{
                borderRadius: 0,
                justifyContent: "flex-start",
                px: 2.5,
                py: 2,
                border: "1px solid",
                borderColor: "divider",
                textAlign: "left",
                display: "block",
              }}
            >
              <span className="block font-mono text-[10px] tracking-[0.16em] text-muted-foreground uppercase">
                {tile.label}
              </span>
              <span
                className={cn(
                  "mt-1 block font-display text-3xl tabular-nums tracking-tight",
                  tile.tone === "warn" && "text-stair-2",
                  tile.tone === "sage" && "text-sage",
                  !tile.tone && "text-ink",
                )}
              >
                {tile.total}
              </span>
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function AttentionList({ data }: { data: AdminOverview }) {
  if (data.attention.length === 0) {
    return (
      <section>
        <p className="mb-3 font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase">
          Pozornosť
        </p>
        <p className="text-sm text-muted-foreground">
          Žiadne po termíne ani blížiace sa termíny.
        </p>
      </section>
    );
  }

  return (
    <section>
      <p className="mb-3 font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase">
        Pozornosť · overdue / due soon
      </p>
      <ul className="divide-y divide-rule border border-rule dark:divide-white/10 dark:border-white/10">
        {data.attention.map((item) => {
          const status = normalizeBookingStatus(item.status) as BookingStatusCode;
          return (
            <li key={item.id}>
              <Button
                component={RaLink}
                to={`/bookings/${item.id}/show`}
                fullWidth
                sx={{
                  borderRadius: 0,
                  justifyContent: "space-between",
                  px: 2,
                  py: 1.5,
                  textAlign: "left",
                }}
              >
                <span className="min-w-0">
                  <span className="block truncate font-display text-lg text-ink">
                    {item.borrowerName}
                  </span>
                  <span className="block truncate font-mono text-[11px] text-muted-foreground">
                    {item.borrowerEmail}
                  </span>
                </span>
                <span className="shrink-0 text-right font-mono text-[11px]">
                  <span
                    className={cn(
                      "block uppercase tracking-wide",
                      status === 4 ? "text-stair-2" : "text-muted-foreground",
                    )}
                  >
                    {BOOKING_STATUS_LABEL[status]}
                  </span>
                  <span className="block tabular-nums text-muted-foreground">
                    {new Date(item.dueDate).toLocaleString("sk-SK")}
                  </span>
                </span>
              </Button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function AdminRaDashboard() {
  const { data: identity } = useGetIdentity();
  const [data, setData] = useState<AdminOverview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const overview = await fetchAdminOverview();
        if (!cancelled) setData(overview);
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
            AdminService · overview
          </p>
          <h1 className="mt-2 font-display text-[clamp(1.9rem,4vw,2.75rem)] leading-none tracking-tight text-ink">
            Prevádzkový pult
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            {identity?.fullName ?? data?.actor}
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
                    data.unhealthyCount > 0
                      ? "text-stair-2"
                      : "text-muted-foreground",
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

      <nav className="flex flex-wrap gap-2" aria-label="Admin nástroje">
        {TOOL_LINKS.map((item) => (
          <Button
            key={item.to}
            component={RaLink}
            to={item.to}
            variant="outlined"
            size="small"
            sx={{ borderRadius: 0 }}
          >
            {item.label}
          </Button>
        ))}
      </nav>

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
          <CatalogWidgets data={data} />
          <AttentionList data={data} />

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
                    service.healthy ? "before:bg-sage" : "before:bg-stair-2",
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
                  {typeof service.latencyMs === "number" ? (
                    <p className="mt-1 pl-1 font-mono text-[10px] text-muted-foreground tabular-nums">
                      {service.latencyMs} ms
                    </p>
                  ) : null}
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
