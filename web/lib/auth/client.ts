import { apiGet } from "@/lib/api";
import type { AdminDashboard } from "@/lib/admin/ops";
import type { AuthConfig, AuthUser } from "./types";

export async function fetchAuthConfig(): Promise<AuthConfig> {
  return apiGet<AuthConfig>("/api/auth/config");
}

export async function fetchAuthMe(
  accessToken?: string | null,
): Promise<AuthUser> {
  // Prefer BFF cookie; explicit token still supported during login bootstrap.
  return apiGet<AuthUser>(
    "/api/auth/me",
    undefined,
    accessToken,
    { skipStatusRedirect: true },
  );
}

export async function fetchAdminDashboard(
  accessToken?: string | null,
): Promise<AdminDashboard> {
  return apiGet<AdminDashboard>(
    "/api/admin/dashboard",
    undefined,
    accessToken,
    { skipStatusRedirect: true },
  );
}
