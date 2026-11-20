/**
 * Mixed — katalóg + summaries + health v jednom behu (realistickejší mix).
 *
 *   k6 run load/k6/mixed.js
 *   TOKEN=… k6 run load/k6/mixed.js   # zapne aj reader/staff VUs
 */
import { sleep } from "k6";
import { TOKEN, apiThresholds, think } from "./lib/config.js";
import { browseCatalog, getHealth, getReady, warmCatalogBatch } from "./lib/catalog.js";
import { readerOpsFlow, staffOpsFlow } from "./lib/ops.js";

const hasAuth = Boolean(TOKEN) || __ENV.SPST_DEV_ADMIN === "1";

export const options = {
  scenarios: {
    public_browse: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "20s", target: 8 },
        { duration: "1m", target: 20 },
        { duration: "20s", target: 0 },
      ],
      exec: "publicFlow",
    },
    health: {
      executor: "constant-vus",
      vus: 1,
      duration: "1m40s",
      exec: "healthFlow",
    },
    ...(hasAuth
      ? {
          readers: {
            executor: "constant-vus",
            vus: 3,
            duration: "1m20s",
            exec: "readerFlow",
            startTime: "10s",
          },
          staff: {
            executor: "constant-vus",
            vus: 2,
            duration: "1m",
            exec: "staffFlow",
            startTime: "15s",
          },
        }
      : {}),
  },
  thresholds: {
    ...apiThresholds,
    "http_req_duration{name:books_summaries}": ["p(95)<500"],
  },
};

export function setup() {
  warmCatalogBatch();
  if (!hasAuth) {
    console.log("mixed: no TOKEN — public + health only");
  }
  return {};
}

export function publicFlow() {
  browseCatalog();
  sleep(think(0.3, 0.9));
}

export function healthFlow() {
  getHealth();
  getReady();
  sleep(2);
}

export function readerFlow() {
  browseCatalog();
  readerOpsFlow();
  sleep(think(0.6, 1.2));
}

export function staffFlow() {
  staffOpsFlow();
  sleep(think(1, 2));
}

export default publicFlow;
