/**
 * Smoke — krátky sanity check gateway + katalóg (1 VU, ~30s).
 *
 *   k6 run load/k6/smoke.js
 *   PROFILE=smoke k6 run load/k6/smoke.js
 */
import { sleep } from "k6";
import { apiThresholds, think } from "./lib/config.js";
import {
  getReady,
  getAuthConfig,
  warmCatalogBatch,
  getBooksCursor,
  getRelationsSummary,
} from "./lib/catalog.js";

export const options = {
  vus: 1,
  duration: "30s",
  thresholds: apiThresholds,
};

export default function () {
  warmCatalogBatch();
  getReady();
  getAuthConfig();
  getBooksCursor(10);
  getRelationsSummary();
  sleep(think(0.5, 1));
}
