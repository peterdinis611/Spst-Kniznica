/** Only these gateway prefixes may be proxied from the browser BFF. */
export const BFF_ALLOWED_PREFIXES = [
  "health",
  "api/auth",
  "api/books",
  "api/authors",
  "api/categories",
  "api/bookings",
  "api/admin",
  "api/orders",
  "api/cache",
  "api/messaging",
  "api/emails",
  "api/gateway",
  "api/relations",
] as const;

/** Paths that must never leave the BFF even under an allowed prefix. */
const BFF_DENIED_SUFFIXES = [
  "/internal/",
  "api/internal",
] as const;

export function isBffAllowedPath(path: string): boolean {
  const normalized = path.replace(/^\/+/, "").toLowerCase();
  if (!normalized) return false;
  if (normalized.includes("..")) return false;
  if (
    BFF_DENIED_SUFFIXES.some(
      (denied) =>
        normalized === denied ||
        normalized.startsWith(`${denied}/`) ||
        normalized.includes(denied),
    )
  ) {
    return false;
  }
  return BFF_ALLOWED_PREFIXES.some(
    (prefix) =>
      normalized === prefix || normalized.startsWith(`${prefix}/`),
  );
}
