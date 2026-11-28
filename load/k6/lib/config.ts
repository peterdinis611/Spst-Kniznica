/**
 * Shared k6 config for SPST knižnica load tests.
 *
 * Env:
 *   BASE_URL   – gateway (default http://127.0.0.1:5200)
 *   WEB_URL    – Next.js (default http://127.0.0.1:3000)
 *   WEB_BFF    – Next BFF origin for /api/bff (default WEB_URL)
 *   TOKEN      – optional Bearer JWT for authenticated scenarios
 *   PROFILE    – smoke | load | stress (tweaks thresholds)
 */

import type { Response } from "k6/http";

export type Profile = "smoke" | "load" | "stress";

export type CatalogRow = {
  id?: string;
  Id?: string;
  bookId?: string;
  BookId?: string;
  [key: string]: unknown;
};

export type PagedBody = {
  items?: CatalogRow[];
  Items?: CatalogRow[];
  [key: string]: unknown;
};

export const BASE_URL = (__ENV.BASE_URL || "http://127.0.0.1:5200").replace(
  /\/$/,
  "",
);
export const WEB_URL = (__ENV.WEB_URL || "http://127.0.0.1:3000").replace(
  /\/$/,
  "",
);
export const WEB_BFF = (__ENV.WEB_BFF || WEB_URL).replace(/\/$/, "");
export const TOKEN = (__ENV.TOKEN || "").trim();
export const PROFILE = (
  __ENV.PROFILE || "load"
).toLowerCase() as Profile;

export function authHeaders(
  extra: Record<string, string> = {},
): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...extra,
  };
  if (TOKEN) {
    headers.Authorization = `Bearer ${TOKEN}`;
  }
  return headers;
}

/** Soft JSON parse — never throws into the VU loop. */
export function safeJson(res: Response): PagedBody | unknown[] | null {
  try {
    return res.json() as PagedBody | unknown[];
  } catch {
    return null;
  }
}

export function itemsOf(body: PagedBody | unknown[] | null): CatalogRow[] {
  if (!body) return [];
  if (Array.isArray(body)) return body as CatalogRow[];
  if (Array.isArray(body.items)) return body.items;
  if (Array.isArray(body.Items)) return body.Items;
  return [];
}

export function firstId(body: PagedBody | unknown[] | null): string | null {
  const items = itemsOf(body);
  if (!items.length) return null;
  return (items[0].id || items[0].Id || null) as string | null;
}

type ThresholdMap = Record<string, string[]>;

const byProfile: Record<Profile, ThresholdMap> = {
  smoke: {
    http_req_failed: ["rate<0.02"],
    http_req_duration: ["p(95)<600", "p(99)<1500"],
    checks: ["rate>0.98"],
  },
  load: {
    http_req_failed: ["rate<0.02"],
    http_req_duration: ["p(95)<800", "p(99)<2000"],
    checks: ["rate>0.98"],
  },
  stress: {
    http_req_failed: ["rate<0.05"],
    http_req_duration: ["p(95)<1500", "p(99)<4000"],
    checks: ["rate>0.95"],
  },
};

/** Default SLA-style thresholds for API scenarios. */
export const apiThresholds: ThresholdMap =
  byProfile[PROFILE] || byProfile.load;

export const stressThresholds: ThresholdMap = byProfile.stress;

export const webThresholds: ThresholdMap = {
  http_req_failed: ["rate<0.05"],
  http_req_duration: ["p(95)<2000", "p(99)<4000"],
  checks: ["rate>0.95"],
};

/** Think-time helper: PROFILE=smoke → shorter pauses. */
export function think(min = 0.3, max = 1.0): number {
  if (PROFILE === "smoke") return Math.min(min, 0.2);
  if (PROFILE === "stress") return Math.min(min, 0.05);
  return min + Math.random() * Math.max(0, max - min);
}
