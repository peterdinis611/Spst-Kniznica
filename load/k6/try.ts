/**
 * Short trial through the app the browser uses:
 * Next page + BFF catalog reads + summaries.
 *
 *   ./scripts/load-test.sh try
 */
import http from "k6/http";
import { check, sleep } from "k6";
import type { Options } from "k6/options";
import {
  BASE_URL,
  WEB_URL,
  think,
  safeJson,
  itemsOf,
  firstId,
} from "./lib/config.ts";
import { bffGet, bffPost } from "./lib/http.ts";

type MetricValues = { values?: Record<string, number> };
type SummaryData = {
  metrics: Record<string, MetricValues>;
};

export const options: Options = {
  scenarios: {
    app: {
      executor: "ramping-vus",
      startVUs: 1,
      stages: [
        { duration: "10s", target: 8 },
        { duration: "25s", target: 8 },
        { duration: "10s", target: 0 },
      ],
      gracefulRampDown: "5s",
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.1"],
    checks: ["rate>0.9"],
    "http_req_duration{name:bff_books}": ["p(95)<3000"],
    "http_req_duration{name:bff_summaries}": ["p(95)<3000"],
  },
};

type TryData = { ids: string[] };

export function setup(): TryData {
  const gateway = http.get(`${BASE_URL}/health`, {
    tags: { name: "setup_health" },
  });
  const home = http.get(`${WEB_URL}/`, { tags: { name: "setup_home" } });
  if (gateway.status !== 200) {
    throw new Error(
      `Gateway ${BASE_URL}/health returned ${gateway.status}. Start ./start.sh --detach`,
    );
  }
  if (home.status < 200 || home.status >= 400) {
    throw new Error(
      `App ${WEB_URL}/ returned ${home.status}. Start ./start.sh --detach`,
    );
  }

  const page = bffGet("/api/books?page=1&pageSize=40", "setup_books");
  const ids = itemsOf(safeJson(page))
    .map((item) => item.id || item.Id)
    .filter((x): x is string => Boolean(x));
  console.log(`try setup: ${ids.length} book ids via BFF`);
  return { ids };
}

export default function (data: TryData): void {
  const page = bffGet(
    "/api/books?page=1&pageSize=20&sortBy=title",
    "bff_books",
  );
  check(page, {
    "bff books 200": (r) => r.status === 200,
    "bff books cacheable": (r) =>
      /max-age=\d+/.test(
        r.headers["Cache-Control"] || r.headers["cache-control"] || "",
      ),
  });

  const cursor = bffGet(
    "/api/books/cursor?limit=20&sortBy=title",
    "bff_cursor",
  );
  check(cursor, { "bff cursor 200": (r) => r.status === 200 });

  const id = firstId(safeJson(page)) || (data.ids || [])[0];
  if (id) {
    const detail = bffGet(`/api/books/${id}`, "bff_detail");
    check(detail, {
      "bff detail 200": (r) => r.status === 200,
      "bff detail private": (r) =>
        /private/.test(
          r.headers["Cache-Control"] || r.headers["cache-control"] || "",
        ),
    });
  }

  const pool = data.ids || [];
  if (pool.length) {
    const slice = pool.slice(0, 8);
    const summaries = bffPost(
      "/api/books/summaries",
      { ids: slice },
      "bff_summaries",
    );
    check(summaries, {
      "bff summaries 200": (r) => r.status === 200,
    });
  }

  if (Math.random() < 0.25) {
    const html = http.get(`${WEB_URL}/books`, {
      tags: { name: "web_books" },
      redirects: 5,
    });
    check(html, {
      "books page html": (r) => r.status >= 200 && r.status < 400,
    });
  }

  sleep(think(0.2, 0.6));
}

export function handleSummary(data: SummaryData): Record<string, string> {
  const lines = [
    "",
    "SPST try — aplikácia (Next + BFF), nie priamy gateway",
    "----------------------------------------------------",
  ];
  const failed = data.metrics.http_req_failed?.values?.rate;
  const checksRate = data.metrics.checks?.values?.rate;
  if (failed != null)
    lines.push(`chyby požiadaviek: ${(failed * 100).toFixed(2)} %`);
  if (checksRate != null)
    lines.push(`kontroly v poriadku: ${(checksRate * 100).toFixed(1)} %`);

  const interesting = Object.keys(data.metrics)
    .filter((name) => name.startsWith("http_req_duration{name:"))
    .sort();
  for (const name of interesting) {
    const values = data.metrics[name].values || {};
    const label = name.slice("http_req_duration{name:".length, -1);
    if (label.startsWith("setup_")) continue;
    const avg =
      values.avg != null ? `${Math.round(values.avg)} ms` : "—";
    const p95 =
      values["p(95)"] != null
        ? `${Math.round(values["p(95)"])} ms`
        : "—";
    lines.push(
      `${label.padEnd(16)} avg ${avg.padStart(8)}   p95 ${p95.padStart(8)}`,
    );
  }

  lines.push("");
  lines.push("Ďalší beh: ./scripts/load-test.sh catalog");
  lines.push("Špička:    ./scripts/load-test.sh stress");
  lines.push("");
  return { stdout: `${lines.join("\n")}\n` };
}
