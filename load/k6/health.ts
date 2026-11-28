/**
 * Health / ready / metrics probe storm (ops + scrape path).
 *
 *   ./scripts/load-test.sh health
 */
import { check, sleep } from "k6";
import type { Options } from "k6/options";
import { apiThresholds, think } from "./lib/config.ts";
import { getHealth, getReady } from "./lib/catalog.ts";
import { apiGet } from "./lib/http.ts";

export const options: Options = {
  scenarios: {
    live: {
      executor: "constant-arrival-rate",
      rate: 20,
      timeUnit: "1s",
      duration: "1m",
      preAllocatedVUs: 10,
      maxVUs: 30,
      exec: "liveProbe",
    },
    ready: {
      executor: "constant-vus",
      vus: 5,
      duration: "1m",
      exec: "readyProbe",
      startTime: "5s",
    },
    metrics: {
      executor: "constant-vus",
      vus: 2,
      duration: "1m",
      exec: "metricsProbe",
      startTime: "5s",
    },
  },
  thresholds: {
    ...apiThresholds,
    "http_req_duration{name:health}": ["p(95)<200"],
    "http_req_duration{name:health_ready}": ["p(95)<800"],
  },
};

export function liveProbe(): void {
  getHealth();
  sleep(think(0.05, 0.15));
}

export function readyProbe(): void {
  getReady();
  sleep(think(0.3, 0.8));
}

export function metricsProbe(): void {
  const res = apiGet("/metrics?format=prom", "metrics_prom");
  check(res, {
    "metrics 200/401": (r) => r.status === 200 || r.status === 401,
    "metrics text-ish": (r) =>
      r.status !== 200 ||
      String(r.body || "").includes("spst_") ||
      String(r.body || "").length > 0,
  });
  sleep(think(1, 2));
}

export default liveProbe;
