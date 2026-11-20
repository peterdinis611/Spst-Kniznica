/**
 * Frontend smoke load — Next.js pages (SSR/assets) + BFF probe.
 *
 *   k6 run load/k6/web.js
 */
import http from "k6/http";
import { check, sleep } from "k6";
import { WEB_URL, webThresholds, think } from "./lib/config.js";
import { bffGet } from "./lib/http.js";

export const options = {
  scenarios: {
    pages: {
      executor: "constant-vus",
      vus: 5,
      duration: "1m",
      exec: "pageFlow",
    },
    bff: {
      executor: "constant-vus",
      vus: 2,
      duration: "1m",
      exec: "bffFlow",
      startTime: "5s",
    },
  },
  thresholds: webThresholds,
};

const PATHS = ["/", "/books", "/authors", "/categories", "/library", "/bookings"];

export function pageFlow() {
  const path = PATHS[Math.floor(Math.random() * PATHS.length)];
  const res = http.get(`${WEB_URL}${path}`, {
    tags: { name: `web_${path === "/" ? "home" : path.slice(1)}` },
    redirects: 5,
  });
  check(res, {
    "web 2xx": (r) => r.status >= 200 && r.status < 400,
  });
  sleep(think(0.5, 1.2));
}

export function bffFlow() {
  const res = bffGet("/api/books?page=1&pageSize=10", "bff_books");
  check(res, {
    "bff books ok": (r) => r.status === 200,
  });
  const denied = bffGet("/api/internal/emails/send", "bff_denied_internal");
  check(denied, {
    "bff blocks internal": (r) => r.status === 403 || r.status === 404,
  });
  sleep(think(0.8, 1.5));
}

export default pageFlow;
