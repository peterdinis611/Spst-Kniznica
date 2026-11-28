/**
 * Authors catalog — page / cursor / detail.
 *
 *   ./scripts/load-test.sh authors
 */
import { sleep } from "k6";
import type { Options } from "k6/options";
import { apiThresholds, think } from "./lib/config.ts";
import { browseAuthors, getHealth } from "./lib/catalog.ts";

export const options: Options = {
  scenarios: {
    authors: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "20s", target: 8 },
        { duration: "1m", target: 20 },
        { duration: "30s", target: 0 },
      ],
    },
  },
  thresholds: {
    ...apiThresholds,
    "http_req_duration{name:authors_page}": ["p(95)<700"],
    "http_req_duration{name:authors_detail}": ["p(95)<600"],
  },
};

export default function (): void {
  if (Math.random() < 0.05) getHealth();
  browseAuthors();
  sleep(think(0.25, 0.9));
}
