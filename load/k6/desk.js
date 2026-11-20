/**
 * Desk / library-ops — denná tabuľa, waitlist, policy, bookings (staff).
 *
 *   TOKEN=… k6 run load/k6/desk.js
 */
import http from "k6/http";
import { sleep } from "k6";
import { BASE_URL, TOKEN, authHeaders, apiThresholds, think } from "./lib/config.js";
import { staffOpsFlow, listBookings, deskDaily, loanPolicy } from "./lib/ops.js";
import { postBookSummaries } from "./lib/catalog.js";
import { safeJson, itemsOf } from "./lib/config.js";

export const options = {
  scenarios: {
    desk: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "15s", target: 4 },
        { duration: "45s", target: 8 },
        { duration: "30s", target: 0 },
      ],
      exec: "deskFlow",
    },
  },
  thresholds: {
    ...apiThresholds,
    "http_req_duration{name:desk_daily}": ["p(95)<900"],
    "http_req_failed{name:desk_daily}": ["rate<0.05"],
  },
};

export function setup() {
  const probe = http.get(`${BASE_URL}/api/bookings/desk/daily`, {
    headers: authHeaders(),
  });
  console.log(
    `desk probe → ${probe.status} (TOKEN ${TOKEN ? "set" : "empty"})`,
  );
  return {};
}

export function deskFlow() {
  deskDaily();
  loanPolicy();
  const list = listBookings(1, 30);
  const ids = itemsOf(safeJson(list))
    .map((b) => b.bookId || b.BookId)
    .filter(Boolean)
    .slice(0, 25);
  if (ids.length) postBookSummaries(ids);
  staffOpsFlow();
  sleep(think(0.8, 1.5));
}

export default deskFlow;
