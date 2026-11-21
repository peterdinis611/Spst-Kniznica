/** Shared TanStack Query keys for admin ops screens (inside react-admin). */
export const adminQueryKeys = {
  all: ["admin"] as const,
  overview: () => [...adminQueryKeys.all, "overview"] as const,
  probe: () => [...adminQueryKeys.all, "probe"] as const,
  deskDaily: () => [...adminQueryKeys.all, "desk-daily"] as const,
  services: () => [...adminQueryKeys.all, "services"] as const,
} as const;
