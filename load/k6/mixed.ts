/**
 * Mixed — katalóg + summaries + health v jednom behu (realistickejší mix).
 *
 *   k6 run load/k6/mixed.ts
 *   TOKEN=… k6 run load/k6/mixed.ts   # zapne aj reader/staff VUs
 */
import { sleep } from "k6";
import type { Options } from "k6/options";
import { TOKEN, apiThresholds, think } from "./lib/config.ts";
import {
  browseCatalog,
  browseSearch,
  getHealth,
  getReady,
  warmCatalogBatch,
} from "./lib/catalog.ts";
import {
  readerOpsFlow,
  readerExtrasFlow,
  staffOpsFlow,
} from "./lib/ops.ts";

const hasAuth = Boolean(TOKEN) || __ENV.SPST_DEV_ADMIN === "1";

export const options: Options = {
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
            executor: "constant-vus" as const,
            vus: 3,
            duration: "1m20s",
            exec: "readerFlow",
            startTime: "10s",
          },
          staff: {
            executor: "constant-vus" as const,
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

export function setup(): Record<string, never> {
  warmCatalogBatch();
  if (!hasAuth) {
    console.log("mixed: no TOKEN — public + health only");
  }
  return {};
}

export function publicFlow(): void {
  if (Math.random() < 0.35) browseSearch();
  else browseCatalog();
  sleep(think(0.3, 0.9));
}

export function healthFlow(): void {
  getHealth();
  getReady();
  sleep(2);
}

export function readerFlow(): void {
  browseCatalog();
  readerOpsFlow();
  readerExtrasFlow();
  sleep(think(0.6, 1.2));
}

export function staffFlow(): void {
  staffOpsFlow();
  sleep(think(1, 2));
}

export default publicFlow;
