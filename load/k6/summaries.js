/**
 * Summaries — záťaž na POST /api/books/summaries (library/desk hot path).
 *
 *   k6 run load/k6/summaries.js
 */
import { check, sleep } from "k6";
import { apiThresholds, think, safeJson, itemsOf } from "./lib/config.js";
import { getBooksPage, postBookSummaries, warmCatalogBatch } from "./lib/catalog.js";

export const options = {
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

let cachedIds = [];

export function setup() {
  warmCatalogBatch();
  const page = getBooksPage(1, 50);
  cachedIds = itemsOf(safeJson(page))
    .map((i) => i.id || i.Id)
    .filter(Boolean);
  console.log(`summaries setup: ${cachedIds.length} book ids`);
  return { ids: cachedIds };
}

export default function (data) {
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
