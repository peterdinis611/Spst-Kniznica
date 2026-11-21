import type { AuthProvider } from "react-admin";
import { fetchAuthMe } from "@/lib/auth/client";
import { setDevAuthSignedOut } from "@/lib/auth/dev-session";
import { syncBrowserSession } from "@/lib/auth/session-client";
import { queueToastFlash } from "@/lib/toast-flash";

export const adminAuthProvider: AuthProvider = {
  login: async () => {
    setDevAuthSignedOut(false);
    if (typeof window !== "undefined") {
      window.location.assign("/login?next=/admin");
    }
  },

  logout: async () => {
    setDevAuthSignedOut(true);
    queueToastFlash({
      kind: "info",
      title: "Odhlásený",
      description: "Prihlásenie bolo ukončené.",
      iconName: "cancel",
    });
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
