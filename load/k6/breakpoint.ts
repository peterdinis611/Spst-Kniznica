/**
 * Breakpoint — stupňujúci arrival-rate, kým p95 / fail rate neprerazí prahy.
 * Cieľ: odhad max udržateľného RPS na katalógu.
 *
 *   PROFILE=stress ./scripts/load-test.sh breakpoint
 */
import { sleep } from "k6";
import type { Options } from "k6/options";
import { stressThresholds, think } from "./lib/config.ts";
import { browseCatalog, getHealth } from "./lib/catalog.ts";

export const options: Options = {
  scenarios: {
    climb: {
      executor: "ramping-arrival-rate",
      startRate: 10,
      timeUnit: "1s",
      preAllocatedVUs: 50,
      maxVUs: 200,
      stages: [
        { duration: "30s", target: 30 },
        { duration: "30s", target: 60 },
        { duration: "30s", target: 100 },
        { duration: "30s", target: 140 },
        { duration: "30s", target: 180 },
        { duration: "20s", target: 0 },
      ],
    },
  },
  thresholds: {
    ...stressThresholds,
    "http_req_duration{name:books_page}": ["p(95)<2000"],
  },
};

export default function (): void {
  if (Math.random() < 0.02) getHealth();
  browseCatalog();
  sleep(think(0.01, 0.08));
}
