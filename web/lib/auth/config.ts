import type { Configuration } from "@azure/msal-browser";
import {
  BrowserCacheLocation,
  LogLevel,
  PublicClientApplication,
} from "@azure/msal-browser";
import type { AuthConfig } from "./types";

export function buildMsalConfig(auth: AuthConfig): Configuration {
  const clientId =
    process.env.NEXT_PUBLIC_AZURE_CLIENT_ID?.trim() || auth.clientId;
  const tenantId =
    process.env.NEXT_PUBLIC_AZURE_TENANT_ID?.trim() || auth.tenantId;
  const authority =
    process.env.NEXT_PUBLIC_AZURE_AUTHORITY?.trim() ||
    auth.authority ||
    `https://login.microsoftonline.com/${tenantId}`;

  return {
    auth: {
      clientId,
      authority,
      redirectUri:
        typeof window !== "undefined"
          ? `${window.location.origin}/login`
          : auth.redirectUriHint,
      postLogoutRedirectUri:
        typeof window !== "undefined" ? window.location.origin : "/",
    },
    cache: {
      // Session only — BFF mirrors AT into HttpOnly cookie, not document.cookie.
      cacheLocation: BrowserCacheLocation.SessionStorage,
    },
    system: {
      loggerOptions: {
        logLevel: LogLevel.Warning,
        piiLoggingEnabled: false,
      },
    },
  };
}

export function resolveApiScope(auth: AuthConfig): string {
  return (
    process.env.NEXT_PUBLIC_AZURE_API_SCOPE?.trim() ||
    auth.apiScope ||
    (auth.clientId ? `api://${auth.clientId}/access_as_user` : "")
  );
}

let pca: PublicClientApplication | null = null;

export async function getMsalInstance(
  auth: AuthConfig,
): Promise<PublicClientApplication> {
  if (pca) return pca;
  pca = new PublicClientApplication(buildMsalConfig(auth));
  await pca.initialize();
  return pca;
}
