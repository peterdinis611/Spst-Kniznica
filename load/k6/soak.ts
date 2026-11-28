/**
 * Soak — dlhší mierny beh (memory / connection leaks).
 * Predvolene 10 min; predĺž: -e SOAK_MINUTES=30
 *
 *   k6 run load/k6/soak.ts
 */
import { sleep } from "k6";
import type { Options } from "k6/options";
import { apiThresholds, think } from "./lib/config.ts";
import { browseCatalog, getHealth, getReady } from "./lib/catalog.ts";

const minutes = Number(__ENV.SOAK_MINUTES || 10);
const duration = `${Math.max(2, minutes)}m`;

export const options: Options = {
  scenarios: {
    soak: {
      executor: "constant-vus",
      vus: 8,
      duration,
      gracefulStop: "30s",
    },
    heartbeat: {
      executor: "constant-vus",
      vus: 1,
      duration,
      exec: "heartbeat",
    },
  },
  thresholds: {
    ...apiThresholds,
    http_req_failed: ["rate<0.03"],
  },
};

export default function (): void {
  browseCatalog();
  sleep(think(0.8, 1.8));
}

export function heartbeat(): void {
  getHealth();
  getReady();
  sleep(5);
}
