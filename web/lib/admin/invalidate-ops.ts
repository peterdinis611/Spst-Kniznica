import type { QueryClient } from "@tanstack/react-query";
import { adminQueryKeys } from "@/lib/admin/query-keys";

/** Invalidate overview / desk / health aggregates after staff mutations. */
export function invalidateAdminOps(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: adminQueryKeys.all });
}
