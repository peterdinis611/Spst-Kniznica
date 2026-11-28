/**
 * Smoke — krátky sanity check gateway + katalóg (1 VU, ~30s).
 *
 *   k6 run load/k6/smoke.ts
 *   PROFILE=smoke k6 run load/k6/smoke.ts
 */
import { sleep } from "k6";
import type { Options } from "k6/options";
import { apiThresholds, think } from "./lib/config.ts";
import {
  getReady,
  getAuthConfig,
  warmCatalogBatch,
  getBooksCursor,
  getRelationsSummary,
} from "./lib/catalog.ts";

export const options: Options = {
  vus: 1,
  duration: "30s",
  thresholds: apiThresholds,
};

export default function (): void {
  warmCatalogBatch();
  getReady();
  getAuthConfig();
  getBooksCursor(10);
  getRelationsSummary();
  sleep(think(0.5, 1));
}
