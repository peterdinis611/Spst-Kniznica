/**
 * Shared k6 config for SPST knižnica load tests.
 *
 * Env:
 *   BASE_URL   – gateway (default http://127.0.0.1:5200)
 *   WEB_URL    – Next.js (default http://127.0.0.1:3000)
 *   TOKEN      – optional Bearer JWT for authenticated scenarios
 */

export const BASE_URL = (__ENV.BASE_URL || "http://127.0.0.1:5200").replace(/\/$/, "");
export const WEB_URL = (__ENV.WEB_URL || "http://127.0.0.1:3000").replace(/\/$/, "");
export const TOKEN = (__ENV.TOKEN || "").trim();

export function authHeaders() {
  const headers = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };
  if (TOKEN) {
    headers.Authorization = `Bearer ${TOKEN}`;
  }
  return headers;
}

/** Default SLA-style thresholds for API scenarios. */
export const apiThresholds = {
  http_req_failed: ["rate<0.02"],
  http_req_duration: ["p(95)<800", "p(99)<2000"],
  checks: ["rate>0.98"],
};

export const stressThresholds = {
  http_req_failed: ["rate<0.05"],
  http_req_duration: ["p(95)<1500", "p(99)<4000"],
  checks: ["rate>0.95"],
};
