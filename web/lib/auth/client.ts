import { apiGet, apiUrl } from "@/lib/api";
import type { AuthConfig, AuthUser } from "./types";

export async function fetchAuthConfig(): Promise<AuthConfig> {
  return apiGet<AuthConfig>("/api/auth/config");
}

export async function fetchAuthMe(accessToken?: string | null): Promise<AuthUser> {
  const response = await fetch(apiUrl("/api/auth/me"), {
    headers: {
      Accept: "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Auth me failed: ${response.status}`);
  }

  return (await response.json()) as AuthUser;
}

export async function fetchAdminDashboard(accessToken?: string | null) {
  const response = await fetch(apiUrl("/api/admin/dashboard"), {
    headers: {
      Accept: "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Admin dashboard failed: ${response.status}`);
  }

  return response.json() as Promise<{
    generatedAt: string;
    actor: string;
    roles: string[];
    services: Array<{
      name: string;
      url: string;
      healthy: boolean;
      status: string;
    }>;
    healthyCount: number;
    unhealthyCount: number;
  }>;
}
