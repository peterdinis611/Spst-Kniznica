/**
 * Rate-limit probe — zámerný burst (LoadTest / Production limity).
 * Očakáva niektoré 429; fail rate threshold je voľnejší.
 *
 *   ./start.sh --detach --loadtest
 *   ./scripts/load-test.sh rate-limit
 */
import { check, sleep } from "k6";
import { Counter, Rate } from "k6/metrics";
import type { Options } from "k6/options";
import { think } from "./lib/config.ts";
import { apiGet } from "./lib/http.ts";

const limited = new Counter("spst_http_429");
const limitedRate = new Rate("spst_rate_limited");

export const options: Options = {
  scenarios: {
    burst: {
      executor: "constant-arrival-rate",
      rate: 80,
      timeUnit: "1s",
      duration: "45s",
      preAllocatedVUs: 40,
      maxVUs: 100,
    },
  },
  thresholds: {
    // Burst may trip gateway public-read limiter under --loadtest.
    http_req_failed: ["rate<0.5"],
    checks: ["rate>0.7"],
    spst_rate_limited: ["rate>=0"], // informational
  },
};

export default function (): void {
  const res = apiGet("/api/books?page=1&pageSize=10", "books_burst");
  const is429 = res.status === 429;
  if (is429) limited.add(1);
  limitedRate.add(is429);
  check(res, {
    "burst 200 or 429": (r) => r.status === 200 || r.status === 429,
  });
  sleep(think(0.01, 0.05));
}
