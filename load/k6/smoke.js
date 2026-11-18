/**
 * Smoke — krátky sanity check gateway + katalóg (1 VU, ~30s).
 *
 *   k6 run load/k6/smoke.js
 */
import { sleep } from "k6";
import { apiThresholds } from "./lib/config.js";
import {
  getHealth,
  getBooksPage,
  getBooksCursor,
  getAuthorsPage,
  getCategoriesPage,
  getRelationsSummary,
  getAuthConfig,
} from "./lib/catalog.js";

export const options = {
  vus: 1,
  duration: "30s",
  thresholds: apiThresholds,
};

export default function () {
  getHealth();
  getAuthConfig();
  getBooksPage(1, 20);
  getBooksCursor(10);
  getAuthorsPage(1, 20);
  getCategoriesPage(1, 20);
  getRelationsSummary();
  sleep(1);
}
