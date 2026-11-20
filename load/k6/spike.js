/**
 * Spike — náhly skok záťaže (burst) a návrat.
 *
 *   k6 run load/k6/spike.js
 */
import { sleep } from "k6";
import { stressThresholds, think } from "./lib/config.js";
import { browseCatalog, warmCatalogBatch } from "./lib/catalog.js";

export const options = {
  scenarios: {
    spike: {
      executor: "ramping-arrival-rate",
      startRate: 2,
      timeUnit: "1s",
      preAllocatedVUs: 80,
      maxVUs: 250,
      stages: [
        { duration: "20s", target: 10 },
        { duration: "10s", target: 120 }, // spike
        { duration: "30s", target: 120 },
        { duration: "20s", target: 10 },
        { duration: "20s", target: 0 },
      ],
    },
  },
  thresholds: {
    ...stressThresholds,
    http_req_failed: ["rate<0.08"],
  },
};

export function setup() {
  warmCatalogBatch();
  return {};
}

export default function () {
  browseCatalog();
  sleep(think(0.01, 0.05));
}
