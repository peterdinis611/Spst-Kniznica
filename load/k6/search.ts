/**
 * Search-heavy catalog — books/authors/categories with ?search=.
 *
 *   ./scripts/load-test.sh search
 */
import { sleep } from "k6";
import type { Options } from "k6/options";
import { apiThresholds, think } from "./lib/config.ts";
import { browseSearch } from "./lib/catalog.ts";

export const options: Options = {
  scenarios: {
    search: {
      executor: "ramping-arrival-rate",
      startRate: 5,
      timeUnit: "1s",
      preAllocatedVUs: 20,
      maxVUs: 60,
      stages: [
        { duration: "20s", target: 15 },
        { duration: "1m", target: 40 },
        { duration: "30s", target: 10 },
        { duration: "10s", target: 0 },
      ],
    },
  },
  thresholds: {
    ...apiThresholds,
    "http_req_duration{name:books_search}": ["p(95)<900"],
    "http_req_duration{name:books_cursor_search}": ["p(95)<900"],
  },
};

export default function (): void {
  browseSearch();
  sleep(think(0.1, 0.4));
}
