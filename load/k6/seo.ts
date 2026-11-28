/**
 * Public SEO / AI discovery routes on Next (no gateway required).
 *
 *   ./scripts/load-test.sh seo
 */
import http from "k6/http";
import { check, sleep } from "k6";
import type { Options } from "k6/options";
import { WEB_URL, webThresholds, think } from "./lib/config.ts";

export const options: Options = {
  scenarios: {
    seo: {
      executor: "constant-vus",
      vus: 4,
      duration: "1m",
    },
  },
  thresholds: webThresholds,
};

type SeoPath = {
  path: string;
  name: string;
  expect: "xml" | "text" | "md" | "auth";
};

const PATHS: SeoPath[] = [
  { path: "/sitemap.xml", name: "seo_sitemap", expect: "xml" },
  { path: "/robots.txt", name: "seo_robots", expect: "text" },
  { path: "/llms.txt", name: "seo_llms", expect: "md" },
  { path: "/llms-full.txt", name: "seo_llms_full", expect: "md" },
  { path: "/overview.md", name: "seo_overview", expect: "md" },
  { path: "/api/seo-discovery", name: "seo_discovery", expect: "auth" },
];

export default function (): void {
  const pick = PATHS[Math.floor(Math.random() * PATHS.length)];
  const res = http.get(`${WEB_URL}${pick.path}`, {
    tags: { name: pick.name },
  });

  if (pick.expect === "auth") {
    check(res, {
      "seo-discovery rejects anon": (r) =>
        r.status === 401 || r.status === 403,
    });
  } else {
    check(res, {
      "seo 200": (r) => r.status === 200,
      "seo has body": (r) => String(r.body || "").length > 20,
    });
  }
  sleep(think(0.4, 1));
}
