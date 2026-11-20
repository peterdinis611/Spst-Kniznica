/** Only these gateway prefixes may be proxied from the browser BFF. */
export const BFF_ALLOWED_PREFIXES = [
  "health",
  "api/auth",
  "api/books",
  "api/authors",
  "api/categories",
  "api/bookings",
  "api/library-ops",
  "api/admin",
  "api/orders",
  "api/cache",
  "api/messaging",
  "api/workers",
  "api/emails",
  "api/gateway",
  "api/relations",
] as const;

export function isBffAllowedPath(path: string): boolean {
  const normalized = path.replace(/^\/+/, "").toLowerCase();
  if (!normalized) return false;
  if (normalized.includes("..")) return false;
  return BFF_ALLOWED_PREFIXES.some(
    (prefix) =>
      normalized === prefix || normalized.startsWith(`${prefix}/`),
  );
}
