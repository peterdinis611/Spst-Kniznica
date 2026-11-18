/**
 * Authenticated — výpožičky + staff export (vyžaduje TOKEN).
 *
 * Predpoklad:
 *   - stack beží
 *   - export TOKEN=<Entra JWT>  ALEBO Entra:Enabled=false + DevelopmentAuth
 *     (pri Entra:Enabled=false stačí spustiť služby s SPST_DEV_ADMIN=1;
 *      DevelopmentAuthHandler autentifikuje bez Beareru, TOKEN nechaj prázdny)
 *
 *   TOKEN=… k6 run load/k6/authenticated.js
 *   k6 run load/k6/authenticated.js   # len DevelopmentAuth
 */
import http from "k6/http";
import { check, sleep } from "k6";
import { BASE_URL, TOKEN, authHeaders, apiThresholds } from "./lib/config.js";
import { browseCatalog, getBooksPage } from "./lib/catalog.js";

export const options = {
  scenarios: {
    reader_bookings: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "20s", target: 5 },
        { duration: "40s", target: 10 },
        { duration: "20s", target: 0 },
      ],
      exec: "readerFlow",
    },
    staff_export: {
      executor: "constant-vus",
      vus: 2,
      duration: "1m",
      exec: "staffExport",
      startTime: "10s",
    },
  },
  thresholds: {
    ...apiThresholds,
    // 401 without proper auth should fail the run loudly
    "http_req_failed{name:bookings_list}": ["rate<0.05"],
  },
};

export function setup() {
  const probe = http.get(`${BASE_URL}/api/bookings?page=1&pageSize=5`, {
    headers: authHeaders(),
  });
  if (probe.status === 401 || probe.status === 403) {
    console.warn(
      `WARN: /api/bookings → ${probe.status}. Set TOKEN=… or run with Entra:Enabled=false and SPST_DEV_ADMIN=1.`,
    );
  } else {
    console.log(`Auth probe /api/bookings → ${probe.status} (TOKEN ${TOKEN ? "set" : "empty"})`);
  }
  return {};
}

export function readerFlow() {
  browseCatalog();

  const list = http.get(`${BASE_URL}/api/bookings?page=1&pageSize=10`, {
    headers: authHeaders(),
    tags: { name: "bookings_list" },
  });
  check(list, {
    "bookings list ok": (r) => r.status === 200,
  });

  // Soft create attempt — may 400 if catalog empty / policy freeze; still counts as auth path
  const books = getBooksPage(1, 5);
  let bookId = null;
  try {
    const body = books.json();
    const items = body.items || body.Items || [];
    if (items.length > 0) bookId = items[0].id || items[0].Id;
  } catch {
    /* ignore */
  }

  if (bookId) {
    const created = http.post(
      `${BASE_URL}/api/bookings`,
      JSON.stringify({ bookId }),
      { headers: authHeaders(), tags: { name: "bookings_create" } },
    );
    check(created, {
      "bookings create 2xx/4xx (not 401)": (r) =>
        r.status !== 401 && r.status !== 403 && r.status < 500,
    });
  }

  sleep(0.5 + Math.random());
}

export function staffExport() {
  const res = http.get(`${BASE_URL}/api/books/export?format=csv&take=50`, {
    headers: authHeaders(),
    tags: { name: "books_export" },
  });
  check(res, {
    "export not unauthorized": (r) => r.status !== 401 && r.status !== 403,
    "export ok or rate-limited": (r) =>
      r.status === 200 || r.status === 429 || r.status === 403,
  });
  sleep(2);
}
