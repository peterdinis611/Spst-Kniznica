import type { AuthConfig } from "./types";

/**
 * Ensures the MSAL AT is mirrored into the HttpOnly session cookie, then
 * returns undefined so callers rely on cookie (BFF / server actions) instead of
 * shipping Bearer tokens through action inputs or browser fetch headers.
 */
export async function resolveActionAccessToken(input: {
  entraEnabled: boolean;
  getAccessToken: () => Promise<string | null>;
}): Promise<string | undefined> {
  const token = await input.getAccessToken();
  if (input.entraEnabled && !token) {
    throw new Error("Na výpožičku musíš byť prihlásený.");
  }
  // Intentionally discard AT from the return path — cookie is the source of truth.
  return undefined;
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
