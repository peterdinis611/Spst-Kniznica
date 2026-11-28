/**
 * Chaos-read — náhodné verejné + 404 + cursor okraje (robustnosť gateway).
 *
 *   ./scripts/load-test.sh chaos-read
 */
import { check, sleep } from "k6";
import type { Options } from "k6/options";
import { apiThresholds, think } from "./lib/config.ts";
import { apiGet } from "./lib/http.ts";
import { browseCatalog, getHealth } from "./lib/catalog.ts";

export const options: Options = {
  scenarios: {
    chaos: {
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
    // 404s are intentional — don't count as check failures for status
    checks: ["rate>0.9"],
  },
};

type EdgeCase = {
  path: string;
  name: string;
  ok: number[];
};

const EDGE: EdgeCase[] = [
  { path: "/api/books?page=0&pageSize=40", name: "edge_page0", ok: [200, 400] },
  { path: "/api/books?page=1&pageSize=0", name: "edge_size0", ok: [200, 400] },
  {
    path: "/api/books?page=9999&pageSize=10",
    name: "edge_far_page",
    ok: [200],
  },
  {
    path: "/api/books/00000000-0000-0000-0000-000000000000",
    name: "edge_missing_book",
    ok: [404],
  },
  {
    path: "/api/authors/not-a-guid",
    name: "edge_bad_guid",
    ok: [400, 404],
  },
  { path: "/api/nope", name: "edge_404_route", ok: [404] },
  {
    path: "/api/books/cursor?limit=1&sortBy=title",
    name: "edge_cursor_min",
    ok: [200],
  },
  {
    path: "/api/books/lookup/isbn/9780000000000",
    name: "edge_isbn_miss",
    ok: [200, 404],
  },
];

export default function (): void {
  const roll = Math.random();
  if (roll < 0.45) {
    browseCatalog();
  } else if (roll < 0.55) {
    getHealth();
  } else {
    const pick = EDGE[Math.floor(Math.random() * EDGE.length)];
    const res = apiGet(pick.path, pick.name);
    check(res, {
      [`${pick.name} expected`]: (r) => pick.ok.includes(r.status),
    });
  }
  sleep(think(0.15, 0.6));
}
