import { isHttpStatusCode, type HttpStatusCode } from "./http-status";

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
