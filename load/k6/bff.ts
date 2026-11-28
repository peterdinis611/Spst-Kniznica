/**
 * Next BFF — allowlist books + deny internal + parallel with gateway.
 *
 *   ./scripts/load-test.sh bff
 */
import { check, sleep } from "k6";
import type { Options } from "k6/options";
import { webThresholds, think } from "./lib/config.ts";
import { bffGet, apiGet } from "./lib/http.ts";

export const options: Options = {
  scenarios: {
    bff_read: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "15s", target: 5 },
        { duration: "45s", target: 12 },
        { duration: "20s", target: 0 },
      ],
      exec: "bffRead",
    },
    bff_guard: {
      executor: "constant-vus",
      vus: 2,
      duration: "1m",
      exec: "bffGuard",
      startTime: "5s",
    },
    compare: {
      executor: "constant-vus",
      vus: 3,
      duration: "1m",
      exec: "bffVsGateway",
      startTime: "10s",
    },
  },
  thresholds: {
    ...webThresholds,
    "http_req_duration{name:bff_books}": ["p(95)<1500"],
    "http_req_failed{name:bff_denied_internal}": ["rate<0.01"],
  },
};

export function bffRead(): void {
  const paths: Array<[string, string]> = [
    ["/api/books?page=1&pageSize=10", "bff_books"],
    ["/api/authors?page=1&pageSize=10", "bff_authors"],
    ["/api/categories?page=1&pageSize=10", "bff_categories"],
    ["/api/auth/config", "bff_auth_config"],
  ];
  const [path, name] = paths[Math.floor(Math.random() * paths.length)];
  const res = bffGet(path, name);
  check(res, { "bff 200": (r) => r.status === 200 });
  sleep(think(0.3, 0.9));
}

export function bffGuard(): void {
  const denied = bffGet("/api/internal/emails/send", "bff_denied_internal");
  check(denied, {
    "bff blocks internal": (r) => r.status === 403 || r.status === 404,
  });
  const denied2 = bffGet("/api/internal/books/x", "bff_denied_books_internal");
  check(denied2, {
    "bff blocks books internal": (r) =>
      r.status === 403 || r.status === 404 || r.status === 400,
  });
  sleep(think(0.8, 1.5));
}

export function bffVsGateway(): void {
  const g = apiGet("/api/books?page=1&pageSize=5", "gw_books_cmp");
  const b = bffGet("/api/books?page=1&pageSize=5", "bff_books_cmp");
  check(g, { "gateway books 200": (r) => r.status === 200 });
  check(b, { "bff books 200": (r) => r.status === 200 });
  sleep(think(0.5, 1));
}

export default bffRead;
