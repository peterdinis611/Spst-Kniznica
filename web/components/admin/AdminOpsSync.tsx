"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { invalidateAdminOps } from "@/lib/admin/invalidate-ops";
import { subscribeAdminOpsChanged } from "@/lib/admin/ops-events";

/** Keep dashboard / desk / health queries fresh after dataProvider CRUD. */
export function AdminOpsSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    return subscribeAdminOpsChanged(() => {
      void invalidateAdminOps(queryClient);
    });
  }, [queryClient]);

  return null;
}
