import { isHttpStatusCode, type HttpStatusCode } from "./http-status";

/** Paths where HTTP status pages must not interrupt bootstrap / probes. */
const SKIP_REDIRECT_PREFIXES = [
  "/api/auth/config",
  "/api/auth/me",
  "/api/auth/session",
  "/health",
];

/** Client helper — open dedicated status page for known HTTP errors. */
export function hrefForHttpStatus(
  status: number,
  nextPath?: string,
): string | null {
  if (!isHttpStatusCode(status)) return null;
  if (status === 401 && nextPath?.startsWith("/") && !nextPath.startsWith("//")) {
    return `/401?next=${encodeURIComponent(nextPath)}`;
  }
  return `/${status}` as `/${HttpStatusCode}`;
}

export function shouldRedirectToStatusPage(
  status: number,
  apiPath: string,
): boolean {
  if (typeof window === "undefined") return false;
  if (![401, 502, 503].includes(status)) return false;

  const path = apiPath.startsWith("/") ? apiPath : `/${apiPath}`;
  if (SKIP_REDIRECT_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}?`))) {
    return false;
  }

  const current = window.location.pathname;
  if (/^\/(401|404|500|502|503)(\/|$)/.test(current)) return false;

  return true;
}

/** Hard-navigate to status page (browser only). */
export function redirectToStatusPage(status: number): void {
  if (typeof window === "undefined") return;
  const href = hrefForHttpStatus(status, window.location.pathname);
  if (!href) return;
  window.location.assign(href);
}
