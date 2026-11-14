import type { AuthProvider } from "react-admin";
import { fetchAuthMe } from "@/lib/auth/client";
import { syncBrowserSession } from "@/lib/auth/session-client";

export const adminAuthProvider: AuthProvider = {
  login: async () => {
    if (typeof window !== "undefined") {
      window.location.assign("/login?next=/admin");
    }
  },

  logout: async () => {
    await syncBrowserSession(null);
    if (typeof window !== "undefined") {
      window.location.assign("/login");
    }
  },

  checkAuth: async () => {
    const me = await fetchAuthMe();
    if (!me.isAuthenticated || !me.isStaff) {
      throw new Error("Staff login required");
    }
  },

  checkError: async (error) => {
    const status =
      typeof error === "object" && error && "status" in error
        ? Number((error as { status: number }).status)
        : undefined;
    if (status === 401 || status === 403) {
      throw error;
    }
  },

  getIdentity: async () => {
    const me = await fetchAuthMe();
    return {
      id: me.id,
      fullName: me.name,
    };
  },

  getPermissions: async () => {
    const me = await fetchAuthMe();
    return me.roles;
  },
};
