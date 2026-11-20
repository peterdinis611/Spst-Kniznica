/**
 * Stress — vyššia záťaž na katalóg (nájdenie limitu / degradácie).
 *
 *   k6 run load/k6/stress.js
 *   PROFILE=stress k6 run load/k6/stress.js
 */
import { sleep } from "k6";
import { stressThresholds, think } from "./lib/config.js";
import { browseCatalog } from "./lib/catalog.js";

export const options = {
  scenarios: {
    stress: {
      executor: "ramping-arrival-rate",
      startRate: 5,
      timeUnit: "1s",
      preAllocatedVUs: 50,
      maxVUs: 200,
      stages: [
        { duration: "30s", target: 20 },
        { duration: "1m", target: 50 },
        { duration: "1m", target: 100 },
        { duration: "30s", target: 150 },
        { duration: "1m", target: 50 },
        { duration: "30s", target: 0 },
      ],
    },
  },
  thresholds: stressThresholds,
};

export default function () {
  browseCatalog();
  sleep(think(0.02, 0.08));
}
