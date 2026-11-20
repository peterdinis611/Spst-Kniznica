/**
 * Catalog load — verejné čítanie cez gateway (ramping VUs).
 *
 *   k6 run load/k6/catalog.js
 *   PROFILE=load k6 run -e BASE_URL=http://127.0.0.1:5200 load/k6/catalog.js
 */
import { sleep } from "k6";
import { apiThresholds, think } from "./lib/config.js";
import { browseCatalog, getHealth, getReady } from "./lib/catalog.js";

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
  thresholds: {
    ...apiThresholds,
    "http_req_duration{name:books_summaries}": ["p(95)<500"],
    "http_req_duration{name:books_page}": ["p(95)<800"],
  },
};

export default function () {
  browseCatalog();
  sleep(think(0.3, 1));
}

export function healthProbe() {
  getHealth();
  getReady();
  sleep(1);
}
