"use client";

import { useMemo } from "react";
import { useTheme } from "@mui/material/styles";
import { barY, defineChart } from "@tanstack/charts";
import { Chart } from "@tanstack/charts/react";
import { scaleBand } from "@tanstack/charts/scales/band";
import { scaleLinear } from "@tanstack/charts/scales/linear";
import { tooltip } from "@tanstack/charts/tooltip";

type ServiceRow = {
  name: string;
  healthy: boolean;
  status: string;
};

type AdminHealthChartProps = {
  services: ServiceRow[];
  healthyCount: number;
  unhealthyCount: number;
};

function shortName(name: string) {
  return name.replace(/Service$/i, "").replace(/Gateway/i, "Gateway");
}

export function AdminHealthChart({
  services,
  healthyCount,
  unhealthyCount,
}: AdminHealthChartProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const ok = isDark ? "#8fb896" : "#4d7356";
  const down = isDark ? "#ff7a59" : "#b42318";

  const rows = useMemo(
    () =>
      services.map((service) => ({
        name: shortName(service.name),
        score: service.healthy ? 1 : 0,
        status: service.status,
      })),
    [services],
  );

  const summary = useMemo(
    () => [
      { label: "Healthy", count: healthyCount },
      { label: "Down", count: unhealthyCount },
    ],
    [healthyCount, unhealthyCount],
  );

  const serviceChart = useMemo(
    () =>
      defineChart({
        marks: [
          barY(rows, {
            x: "name",
            y: "score",
            fill: (d) => (d.score === 1 ? ok : down),
          }),
        ],
        scales: {
          x: {
            scale: () => scaleBand().padding(0.32),
            axis: {
              ticks: {
                format: (value) => String(value),
              },
            },
          },
          y: {
            scale: scaleLinear,
            domain: [0, 1],
            nice: false,
            grid: true,
            axis: {
              ticks: {
                format: (value) => (Number(value) >= 1 ? "OK" : ""),
              },
            },
          },
        },
        tooltip,
      }),
    [rows, ok, down],
  );

  const summaryChart = useMemo(
    () =>
      defineChart({
        marks: [
          barY(summary, {
            x: "label",
            y: "count",
            fill: (d) => (d.label === "Healthy" ? ok : down),
          }),
        ],
        scales: {
          x: {
            scale: () => scaleBand().padding(0.4),
          },
          y: {
            scale: scaleLinear,
            nice: true,
            grid: true,
            axis: { label: "Počet" },
          },
        },
        tooltip,
      }),
    [summary, ok, down],
  );

  if (services.length === 0) return null;

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.55fr)_minmax(11rem,0.45fr)]">
      <section className="border border-rule bg-card/80 p-4 dark:border-white/10 dark:bg-paper-deep/80">
        <p className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase">
          Stav služieb
        </p>
        <div className="mt-3 min-h-[200px]">
          <Chart
            definition={serviceChart}
            height={200}
            ariaLabel="Zdravie mikroslužieb"
          />
        </div>
      </section>
      <section className="border border-rule bg-card/80 p-4 dark:border-white/10 dark:bg-paper-deep/80">
        <p className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase">
          Súhrn
        </p>
        <div className="mt-3 min-h-[200px]">
          <Chart
            definition={summaryChart}
            height={200}
            ariaLabel="Počet healthy a down služieb"
          />
        </div>
        <dl className="mt-2 flex gap-4 font-mono text-[11px] tracking-wide text-muted-foreground">
          <div>
            <dt className="uppercase opacity-70">OK</dt>
            <dd className="text-lg text-sage tabular-nums">{healthyCount}</dd>
          </div>
          <div>
            <dt className="uppercase opacity-70">Down</dt>
            <dd className="text-lg text-stair-2 tabular-nums">{unhealthyCount}</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
