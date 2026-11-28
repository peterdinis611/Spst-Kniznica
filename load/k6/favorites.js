/**
 * Reader favorites + waitlist/mine (TOKEN alebo DevAuth).
 *
 *   TOKEN=… ./scripts/load-test.sh favorites
 */
import http from "k6/http";
import { sleep } from "k6";
import {
  BASE_URL,
  TOKEN,
  authHeaders,
  apiThresholds,
  think,
} from "./lib/config.js";
import {
  listFavorites,
  waitlistMine,
  authMe,
  readerExtrasFlow,
} from "./lib/ops.js";
import { browseCatalog } from "./lib/catalog.js";

export const options = {
  scenarios: {
    favorites: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "15s", target: 4 },
        { duration: "40s", target: 10 },
        { duration: "20s", target: 0 },
      ],
    },
  },
  thresholds: {
    ...apiThresholds,
    "http_req_duration{name:favorites_list}": ["p(95)<800"],
  },
};

export function setup() {
  const probe = http.get(`${BASE_URL}/api/bookings/favorites`, {
    headers: authHeaders(),
  });
  console.log(
    `favorites probe → ${probe.status} (TOKEN ${TOKEN ? "set" : "empty"})`,
  );
  return {};
}

export default function () {
  authMe();
  listFavorites();
  waitlistMine();
  if (Math.random() < 0.4) {
    browseCatalog();
    readerExtrasFlow();
  }
  sleep(think(0.5, 1.2));
}
