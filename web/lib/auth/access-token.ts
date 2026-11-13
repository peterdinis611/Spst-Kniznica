import type { AuthConfig } from "./types";

/** Bearer token pre server actions — pri Entra musí byť prihlásený používateľ. */
export async function resolveActionAccessToken(input: {
  entraEnabled: boolean;
  getAccessToken: () => Promise<string | null>;
}): Promise<string | undefined> {
  const token = await input.getAccessToken();
  if (input.entraEnabled && !token) {
    throw new Error("Na výpožičku musíš byť prihlásený.");
  }
  return token ?? undefined;
}

export function readerFromAuth(
  config: AuthConfig | null,
  user: { name: string; email: string | null } | null,
): { name: string; email: string } | null {
  if (!user?.email) return null;
  return {
    name: user.name?.trim() || user.email,
    email: user.email,
  };
}
