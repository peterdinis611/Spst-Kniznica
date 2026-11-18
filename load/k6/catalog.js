/**
 * Catalog load — verejné čítanie cez gateway (ramping VUs).
 *
 *   k6 run load/k6/catalog.js
 *   k6 run -e BASE_URL=http://127.0.0.1:5200 load/k6/catalog.js
 */
import { sleep } from "k6";
import { apiThresholds } from "./lib/config.js";
import { browseCatalog, getHealth } from "./lib/catalog.js";

export const options = {
  scenarios: {
    catalog: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "30s", target: 10 },
        { duration: "1m", target: 25 },
        { duration: "1m", target: 25 },
        { duration: "30s", target: 0 },
      ],
      gracefulRampDown: "15s",
    },
    health: {
      executor: "constant-vus",
      vus: 2,
      duration: "3m",
      exec: "healthProbe",
      startTime: "0s",
    },
  },
  thresholds: apiThresholds,
};

export default function () {
  browseCatalog();
  sleep(0.3 + Math.random() * 0.7);
}

export function healthProbe() {
  getHealth();
  sleep(1);
}
