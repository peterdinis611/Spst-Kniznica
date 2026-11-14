"use client";

import { useMemo } from "react";
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

export function AdminHealthChart({
  services,
  healthyCount,
  unhealthyCount,
}: AdminHealthChartProps) {
  const rows = useMemo(
    () =>
      services.map((service) => ({
        name: service.name,
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
            fill: (d) => (d.score === 1 ? "#2f6f4e" : "#b42318"),
          }),
        ],
        scales: {
          x: {
            scale: () => scaleBand().padding(0.28),
            axis: {
              label: "Služba",
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
              label: "Stav",
              ticks: {
                format: (value) => (Number(value) >= 1 ? "OK" : "0"),
              },
            },
          },
        },
        tooltip,
      }),
    [rows],
  );

  const summaryChart = useMemo(
    () =>
      defineChart({
        marks: [
          barY(summary, {
            x: "label",
            y: "count",
            fill: (d) => (d.label === "Healthy" ? "#2f6f4e" : "#b42318"),
          }),
        ],
        scales: {
          x: {
            scale: () => scaleBand().padding(0.35),
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
    [summary],
  );

  if (services.length === 0) return null;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(12rem,0.6fr)]">
      <div className="border border-rule p-4 dark:border-white/10">
        <p className="text-[11px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
          Stav služieb
        </p>
        <div className="mt-3 min-h-[220px]">
          <Chart
            definition={serviceChart}
            height={220}
            ariaLabel="Zdravie mikroslužieb"
          />
        </div>
      </div>
      <div className="border border-rule p-4 dark:border-white/10">
        <p className="text-[11px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
          Súhrn
        </p>
        <div className="mt-3 min-h-[220px]">
          <Chart
            definition={summaryChart}
            height={220}
            ariaLabel="Počet healthy a down služieb"
          />
        </div>
      </div>
    </div>
  );
}
