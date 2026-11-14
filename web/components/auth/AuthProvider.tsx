"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  InteractionRequiredAuthError,
  type AccountInfo,
  type IPublicClientApplication,
} from "@azure/msal-browser";
import { MsalProvider } from "@azure/msal-react";
import { fetchAuthConfig, fetchAuthMe } from "@/lib/auth/client";
import { getMsalInstance, resolveApiScope } from "@/lib/auth/config";
import { formatAuthError } from "@/lib/auth/errors";
import { resolveUserDisplayName } from "@/lib/auth/display-name";
import { syncBrowserSession } from "@/lib/auth/session-client";
import { UNAUTHORIZED_EVENT } from "@/lib/auth/session-constants";
import type { AuthConfig, AuthUser } from "@/lib/auth/types";

type AuthContextValue = {
  ready: boolean;
  entraEnabled: boolean;
  config: AuthConfig | null;
  user: AuthUser | null;
  account: AccountInfo | null;
  error: string | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [config, setConfig] = useState<AuthConfig | null>(null);
  const [instance, setInstance] = useState<IPublicClientApplication | null>(
    null,
  );
  const [user, setUser] = useState<AuthUser | null>(null);
  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  const entraEnabled = Boolean(config?.enabled);

  const refreshUser = useCallback(async () => {
    try {
      if (!config) return;
      if (!config.enabled) {
        const me = await fetchAuthMe(null);
        setUser(me);
        // Placeholder so middleware allows /admin|/bookings in local DevAuth mode
        await syncBrowserSession("dev-local-session");
        setError(null);
        return;
      }

      if (!instance) return;
      const active =
        instance.getActiveAccount() ?? instance.getAllAccounts()[0] ?? null;
      setAccount(active);
      if (!active) {
        setUser(null);
        await syncBrowserSession(null);
        return;
      }

      const scope = resolveApiScope(config);
      const result = await instance.acquireTokenSilent({
        account: active,
        scopes: scope ? [scope] : ["User.Read"],
      });
      await syncBrowserSession(result.accessToken);
      const me = await fetchAuthMe(result.accessToken);
      setUser({
        ...me,
        name: resolveUserDisplayName(me, active),
      });
      setError(null);
    } catch (err) {
      if (err instanceof InteractionRequiredAuthError) {
        setUser(null);
        await syncBrowserSession(null);
        return;
      }
      setError(
        formatAuthError(
          err instanceof Error ? err.message : "Auth refresh failed",
        ),
      );
    }
  }, [config, instance]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const authConfig = await fetchAuthConfig();
        if (cancelled) return;
        setConfig(authConfig);

        if (authConfig.enabled) {
          const msal = await getMsalInstance(authConfig);
          if (cancelled) return;
          try {
            const redirect = await msal.handleRedirectPromise();
            if (redirect?.account) {
              msal.setActiveAccount(redirect.account);
            }
            if (redirect?.accessToken) {
              await syncBrowserSession(redirect.accessToken);
            }
          } catch (redirectErr) {
            setError(
              formatAuthError(
                redirectErr instanceof Error
                  ? redirectErr.message
                  : String(redirectErr),
              ),
            );
          }
          if (!msal.getActiveAccount()) {
            const first = msal.getAllAccounts()[0];
            if (first) msal.setActiveAccount(first);
          }
          setInstance(msal);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            formatAuthError(
              err instanceof Error ? err.message : "Auth bootstrap failed",
            ),
          );
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ready || !config) return;
    void refreshUser();
  }, [ready, config, instance, refreshUser]);

  useEffect(() => {
    const onUnauthorized = () => {
      setUser(null);
      setAccount(null);
      void syncBrowserSession(null);
      // Full-page /401 is opened by api/client — avoid competing MSAL logoutRedirect.
    };
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, []);

  const getAccessToken = useCallback(async () => {
    if (!config?.enabled || !instance) return null;
    const active =
      instance.getActiveAccount() ?? instance.getAllAccounts()[0] ?? null;
    if (!active) return null;
    const scope = resolveApiScope(config);
    try {
      const result = await instance.acquireTokenSilent({
        account: active,
        scopes: scope ? [scope] : ["User.Read"],
      });
      await syncBrowserSession(result.accessToken);
      return result.accessToken;
    } catch {
      return null;
    }
  }, [config, instance]);

  const login = useCallback(async () => {
    setError(null);
    if (!config) return;

    if (!config.enabled) {
      await refreshUser();
      return;
    }

    if (!instance) {
      setError("MSAL ešte nie je pripravené.");
      return;
    }

    const scope = resolveApiScope(config);
    await instance.loginRedirect({
      scopes: scope ? [scope] : ["openid", "profile", "User.Read"],
    });
  }, [config, instance, refreshUser]);

  const logout = useCallback(async () => {
    await syncBrowserSession(null);
    if (!config?.enabled || !instance) {
      setUser(null);
      setAccount(null);
      return;
    }
    const active = instance.getActiveAccount();
    await instance.logoutRedirect({
      account: active ?? undefined,
    });
  }, [config, instance]);

  const value = useMemo<AuthContextValue>(
    () => ({
      ready,
      entraEnabled,
      config,
      user,
      account,
      error,
      login,
      logout,
      getAccessToken,
      refreshUser,
    }),
    [
      ready,
      entraEnabled,
      config,
      user,
      account,
      error,
      login,
      logout,
      getAccessToken,
      refreshUser,
    ],
  );

  if (instance && entraEnabled) {
    return (
      <MsalProvider instance={instance}>
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
      </MsalProvider>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
