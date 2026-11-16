import { redirect } from "next/navigation";
import { isHttpStatusCode, type HttpStatusCode } from "./http-status";

/** Paths where HTTP status pages must not interrupt bootstrap / probes. */
const SKIP_REDIRECT_PREFIXES = [
  "/api/auth/config",
  "/api/auth/me",
  "/api/auth/session",
  "/health",
];

/** Hard redirects for gateway / auth outages. 429 stays soft (toast) — page exists for manual use. */
const GATEWAY_STATUSES = new Set([401, 502, 503]);

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

function shouldSkipPath(apiPath: string): boolean {
  const path = apiPath.startsWith("/") ? apiPath : `/${apiPath}`;
  return SKIP_REDIRECT_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}?`),
  );
}

export function shouldRedirectToStatusPage(
  status: number,
  apiPath: string,
): boolean {
  if (typeof window === "undefined") return false;
  if (!GATEWAY_STATUSES.has(status)) return false;
  if (shouldSkipPath(apiPath)) return false;

  const current = window.location.pathname;
  if (/^\/(401|404|429|500|502|503)(\/|$)/.test(current)) return false;

  return true;
}

export function shouldServerRedirectToStatusPage(
  status: number,
  apiPath: string,
): boolean {
  if (typeof window !== "undefined") return false;
  if (!GATEWAY_STATUSES.has(status)) return false;
  if (shouldSkipPath(apiPath)) return false;
  return true;
}

/** Hard-navigate to status page (browser only). */
export function redirectToStatusPage(status: number): void {
  if (typeof window === "undefined") return;
  const href = hrefForHttpStatus(status, window.location.pathname);
  if (!href) return;
  window.location.assign(href);
}

/** Next.js App Router redirect on the server. */
export function serverRedirectToStatusPage(status: number): never {
  const href = hrefForHttpStatus(status) ?? "/502";
  redirect(href);
}
