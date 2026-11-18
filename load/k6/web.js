/**
 * Frontend smoke load — Next.js pages (SSR/assets).
 *
 *   k6 run load/k6/web.js
 */
import http from "k6/http";
import { check, sleep } from "k6";
import { WEB_URL } from "./lib/config.js";

export const options = {
  vus: 5,
  duration: "1m",
  thresholds: {
    http_req_failed: ["rate<0.05"],
    http_req_duration: ["p(95)<2000"],
    checks: ["rate>0.95"],
  },
};

const PATHS = ["/", "/books", "/authors", "/categories", "/bookings"];

export default function () {
  const path = PATHS[Math.floor(Math.random() * PATHS.length)];
  const res = http.get(`${WEB_URL}${path}`, {
    tags: { name: `web_${path === "/" ? "home" : path.slice(1)}` },
    redirects: 5,
  });
  check(res, {
    "web 2xx": (r) => r.status >= 200 && r.status < 400,
  });
  sleep(0.5 + Math.random());
}
