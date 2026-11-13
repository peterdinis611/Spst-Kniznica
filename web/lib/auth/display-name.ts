import type { AccountInfo } from "@azure/msal-browser";

function claimString(
  claims: Record<string, unknown> | undefined,
  key: string,
): string {
  const value = claims?.[key];
  return typeof value === "string" ? value.trim() : "";
}

/** Celé meno z API, MSAL účtu alebo given_name + family_name. */
export function resolveUserDisplayName(
  user: { name?: string | null } | null | undefined,
  account: AccountInfo | null | undefined,
): string {
  const fromApi = user?.name?.trim() ?? "";
  const fromAccount = account?.name?.trim() ?? "";
  const claims = account?.idTokenClaims as Record<string, unknown> | undefined;
  const given = claimString(claims, "given_name");
  const family = claimString(claims, "family_name");
  const combined = [given, family].filter(Boolean).join(" ");

  const candidates = [combined, fromAccount, fromApi].filter(
    (value, index, list) =>
      value.length > 0 && list.indexOf(value) === index,
  );

  if (candidates.length === 0) return "Účet";

  return candidates.reduce((best, current) =>
    current.length > best.length ? current : best,
  );
}
