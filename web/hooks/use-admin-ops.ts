"use client";

import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRefresh } from "react-admin";
import { adminHttp } from "@/lib/admin/http";
import { invalidateAdminOps } from "@/lib/admin/invalidate-ops";
import {
  fetchAdminOverview,
  fetchAdminProbe,
  fetchAdminServices,
} from "@/lib/admin/ops";
import { notifyAdminOpsChanged } from "@/lib/admin/ops-events";
import { adminQueryKeys } from "@/lib/admin/query-keys";
import {
  mapDeskDaily,
  type DeskDaily,
  type DeskDailyDto,
} from "@/lib/bookings";

const LIVE = {
  staleTime: 10_000,
  refetchOnWindowFocus: true,
  refetchOnReconnect: true,
  refetchIntervalInBackground: false,
} as const;

export function useAdminOverview(options?: { refetchIntervalMs?: number }) {
  return useQuery({
    queryKey: adminQueryKeys.overview(),
    queryFn: fetchAdminOverview,
    ...LIVE,
    refetchInterval: options?.refetchIntervalMs ?? 30_000,
  });
}

export function useAdminProbe(options?: { refetchIntervalMs?: number }) {
  return useQuery({
    queryKey: adminQueryKeys.probe(),
    queryFn: fetchAdminProbe,
    ...LIVE,
    refetchInterval: options?.refetchIntervalMs ?? 20_000,
  });
}

export function useAdminDeskDaily(options?: { refetchIntervalMs?: number }) {
  return useQuery({
    queryKey: adminQueryKeys.deskDaily(),
    queryFn: async (): Promise<DeskDaily> => {
      const raw = await adminHttp<DeskDailyDto>("/api/bookings/desk/daily");
      return mapDeskDaily(raw);
    },
    ...LIVE,
    refetchInterval: options?.refetchIntervalMs ?? 30_000,
  });
}

export function useAdminServices() {
  return useQuery({
    queryKey: adminQueryKeys.services(),
    queryFn: fetchAdminServices,
    ...LIVE,
    refetchInterval: 60_000,
  });
}

/**
 * Refresh react-admin resource views + invalidate ops aggregates
 * (dashboard, desk, health) after side-channel mutations.
 */
export function useAdminMutationRefresh() {
  const queryClient = useQueryClient();
  const refresh = useRefresh();

  return useCallback(() => {
    refresh();
    void invalidateAdminOps(queryClient);
    notifyAdminOpsChanged();
  }, [queryClient, refresh]);
}
