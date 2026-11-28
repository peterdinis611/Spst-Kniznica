/**
 * Summaries — záťaž na POST /api/books/summaries (library/desk hot path).
 *
 *   k6 run load/k6/summaries.ts
 */
import { check, sleep } from "k6";
import type { Options } from "k6/options";
import { apiThresholds, think, safeJson, itemsOf } from "./lib/config.ts";
import {
  getBooksPage,
  postBookSummaries,
  warmCatalogBatch,
} from "./lib/catalog.ts";

export const options: Options = {
  scenarios: {
    summaries: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "15s", target: 10 },
        { duration: "45s", target: 30 },
        { duration: "30s", target: 30 },
        { duration: "15s", target: 0 },
      ],
    },
  },
  thresholds: {
    ...apiThresholds,
    "http_req_duration{name:books_summaries}": ["p(95)<400", "p(99)<900"],
    "http_req_failed{name:books_summaries}": ["rate<0.02"],
  },
};

type SummariesData = { ids: string[] };

export function setup(): SummariesData {
  warmCatalogBatch();
  const page = getBooksPage(1, 50);
  const ids = itemsOf(safeJson(page))
    .map((i) => i.id || i.Id)
    .filter((x): x is string => Boolean(x));
  console.log(`summaries setup: ${ids.length} book ids`);
  return { ids };
}

export default function (data: SummariesData): void {
  const pool = data.ids || [];
  if (!pool.length) {
    getBooksPage(1, 20);
    sleep(think(0.5, 1));
    return;
  }
  const n = 5 + Math.floor(Math.random() * 20);
  const start = Math.floor(Math.random() * Math.max(1, pool.length - n));
  const slice = pool.slice(start, start + n);
  const res = postBookSummaries(slice);
  check(res, {
    "summaries count <= request": (r) => {
      const body = safeJson(r);
      return Array.isArray(body) && body.length <= slice.length;
    },
  });
  sleep(think(0.2, 0.6));
}
