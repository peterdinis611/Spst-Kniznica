/**
 * Authenticated — výpožičky + staff export / desk (vyžaduje TOKEN alebo DevAuth).
 *
 *   TOKEN=… k6 run load/k6/authenticated.js
 *   SPST_DEV_ADMIN=1 + Entra:Enabled=false → TOKEN môže byť prázdny
 */
import { sleep } from "k6";
import http from "k6/http";
import { BASE_URL, TOKEN, authHeaders, apiThresholds, think } from "./lib/config.js";
import { browseCatalog } from "./lib/catalog.js";
import {
  readerOpsFlow,
  staffOpsFlow,
  booksExport,
  emailsStatus,
  ordersQueue,
} from "./lib/ops.js";

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
    staff_ops: {
      executor: "constant-vus",
      vus: 3,
      duration: "1m",
      exec: "staffFlow",
      startTime: "10s",
    },
  },
  thresholds: {
    ...apiThresholds,
    "http_req_failed{name:bookings_list}": ["rate<0.05"],
    "http_req_duration{name:desk_daily}": ["p(95)<1000"],
  },
};

export function setup() {
  const probe = http.get(`${BASE_URL}/api/bookings?page=1&pageSize=5`, {
    headers: authHeaders(),
  });
  if (probe.status === 401 || probe.status === 403) {
    console.warn(
      `WARN: /api/bookings → ${probe.status}. Set TOKEN=… or Entra:Enabled=false + SPST_DEV_ADMIN=1.`,
    );
  } else {
    console.log(
      `Auth probe /api/bookings → ${probe.status} (TOKEN ${TOKEN ? "set" : "empty"})`,
    );
  }
  return {};
}

export function readerFlow() {
  browseCatalog();
  readerOpsFlow();
  sleep(think(0.5, 1.2));
}

export function staffFlow() {
  staffOpsFlow();
  booksExport(50);
  emailsStatus();
  ordersQueue();
  sleep(think(1.5, 2.5));
}
