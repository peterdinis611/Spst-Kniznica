/** Matches <c>PublicCatalogCache</c> max-age on anonymous catalog GETs. */
export const CATALOG_CACHE_SECONDS = 15;

const PUBLIC_CATALOG =
  /^\/api\/(books|authors|categories)(\/cursor|\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})?$/i;

const BOOK_DETAIL =
  /^\/api\/books\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function catalogPathname(path: string): string {
  const raw = (path.split("?")[0] ?? path).trim();
  const withSlash = raw.startsWith("/") ? raw : `/${raw}`;
  return withSlash.replace(/\/+$/, "") || "/";
}

export function isPublicCatalogGet(path: string, method = "GET"): boolean {
  const verb = method.toUpperCase();
  if (verb !== "GET" && verb !== "HEAD") return false;
  return PUBLIC_CATALOG.test(catalogPathname(path));
}

/** Book detail varies for staff (inventory numbers), so the browser must not share it. */
export function catalogResponseCacheControl(path: string): string | null {
  if (!isPublicCatalogGet(path)) return null;
  const header = BOOK_DETAIL.test(catalogPathname(path)) ? "private" : "public";
  return `${header}, max-age=${CATALOG_CACHE_SECONDS}`;
}

export function catalogRequestCache(path: string, method: string): RequestCache {
  return isPublicCatalogGet(path, method) ? "default" : "no-store";
}
