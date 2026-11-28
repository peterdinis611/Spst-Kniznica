/**
 * Categories catalog — list + detail.
 *
 *   ./scripts/load-test.sh categories
 */
import { sleep } from "k6";
import { apiThresholds, think } from "./lib/config.js";
import { browseCategories, getHealth } from "./lib/catalog.js";

export const options = {
  scenarios: {
    categories: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "15s", target: 6 },
        { duration: "45s", target: 15 },
        { duration: "20s", target: 0 },
      ],
    },
  },
  thresholds: {
    ...apiThresholds,
    "http_req_duration{name:categories_page}": ["p(95)<600"],
    "http_req_duration{name:categories_detail}": ["p(95)<500"],
  },
};

export default function () {
  if (Math.random() < 0.05) getHealth();
  browseCategories();
  sleep(think(0.2, 0.8));
}
