import type { AuthConfig } from "./types";

/** Bearer token pre server actions — prefer BFF cookie on server; sync MSAL AT first. */
export async function resolveActionAccessToken(input: {
  entraEnabled: boolean;
  getAccessToken: () => Promise<string | null>;
}): Promise<string | undefined> {
  const token = await input.getAccessToken();
  if (input.entraEnabled && !token) {
    throw new Error("Na výpožičku musíš byť prihlásený.");
  }
  // Token is also mirrored into HttpOnly cookie by getAccessToken/syncBrowserSession.
  // Server actions may omit forwarding AT and rely on cookie via api/client.
  return token ?? undefined;
}

export function readerFromAuth(
  _config: AuthConfig | null,
  user: { name: string; email: string | null } | null,
): { name: string; email: string } | null {
  if (!user?.email) return null;
  return {
    name: user.name?.trim() || user.email,
    email: user.email,
  };
}
