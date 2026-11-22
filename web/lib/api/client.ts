import { UNAUTHORIZED_EVENT } from "@/lib/auth/session-constants";
import {
  catalogRequestCache,
  isPublicCatalogGet,
} from "@/lib/api/catalog-cache";
import { ApiHttpError } from "@/lib/api/errors";
import { parseJsonText } from "@/lib/api/parse-json";
import {
  messageFromProblemDetails,
  parseProblemDetails,
} from "@/lib/api/problem-details";
import {
  redirectToStatusPage,
  serverRedirectToStatusPage,
  shouldRedirectToStatusPage,
  shouldServerRedirectToStatusPage,
} from "@/lib/routing/navigate-status";

const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5200"
).replace(/\/$/, "");

const isBrowser = typeof window !== "undefined";

export type ApiRequestOptions = {
  /** Skip /401 /502 /503 redirects (sitemap, background probes). */
  skipStatusRedirect?: boolean;
};

/**
 * Browser → BFF by default (cookies / session).
 * Public catalog GETs can skip BFF and hit the gateway (set NEXT_PUBLIC_CATALOG_DIRECT=0 to force BFF).
 * Server → gateway directly.
 */
export function apiUrl(path: string, method = "GET"): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (isBrowser) {
    const catalogDirect = process.env.NEXT_PUBLIC_CATALOG_DIRECT !== "0";
    if (catalogDirect && isPublicCatalogGet(normalized, method)) {
      return `${API_BASE}${normalized}`;
    }
    return `/api/bff${normalized}`;
  }
  return `${API_BASE}${normalized}`;
}

/** Direct gateway URL (health probes, server-only). */
export function gatewayUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE}${normalized}`;
}

export type ApiQueryValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | Array<string | number>;

export type ApiQuery = Record<string, ApiQueryValue>;

export function withQuery(path: string, query?: ApiQuery): string {
  if (!query) return path;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") continue;
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item === undefined || item === null || item === "") continue;
        params.append(key, String(item));
      }
      continue;
    }
    params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

function sanitizeErrorText(text: string): string {
  return text
    .replace(/Bearer\s+[A-Za-z0-9._\-]+/gi, "Bearer [redacted]")
    .slice(0, 180);
}

async function readErrorMessage(
  response: Response,
  path: string,
): Promise<string> {
  const fallback = `API ${response.status}: ${path}`;
  const text = await response.text();
  if (!text) return fallback;

  const body = parseProblemDetails(text);
  if (body) {
    return sanitizeErrorText(messageFromProblemDetails(body, fallback));
  }

  return sanitizeErrorText(text);
}

async function parseJson<T>(response: Response, path: string): Promise<T> {
  if (response.status === 204) {
    return undefined as T;
  }
  const text = await response.text();
  return parseJsonText<T>(text, path, undefined as T);
}

function resolveAccessToken(accessToken?: string | null): string | undefined {
  const explicit = accessToken?.trim();
  if (explicit) return explicit;
  return undefined;
}

function notifyUnauthorized() {
  if (!isBrowser) return;
  window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
}

/** Returns true when a client hard-navigation was started (do not throw further). */
function handleStatusNavigation(
  status: number,
  path: string,
  skipStatusRedirect: boolean,
): boolean {
  if (skipStatusRedirect) return false;

  if (shouldRedirectToStatusPage(status, path)) {
    redirectToStatusPage(status);
    return true;
  }

  if (shouldServerRedirectToStatusPage(status, path)) {
    serverRedirectToStatusPage(status);
  }

  return false;
}

async function apiRequest<T>(
  path: string,
  init?: RequestInit,
  body?: unknown,
  accessToken?: string | null,
  options?: ApiRequestOptions,
): Promise<T> {
  const hasBody = body !== undefined;
  const token = resolveAccessToken(accessToken);
  const skipStatusRedirect = Boolean(options?.skipStatusRedirect);

  const headers = new Headers(init?.headers);
  headers.set("Accept", "application/json");
  if (hasBody && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const method = (init?.method ?? (hasBody ? "POST" : "GET")).toUpperCase();
  const url = apiUrl(path, method);
  const catalogDirect =
    isBrowser &&
    process.env.NEXT_PUBLIC_CATALOG_DIRECT !== "0" &&
    isPublicCatalogGet(path, method);

  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      method,
      headers,
      body: hasBody ? JSON.stringify(body) : init?.body,
      cache: catalogRequestCache(path, method),
      // Cross-origin gateway catalog reads are anonymous; keep cookies on same-origin BFF.
      credentials: catalogDirect
        ? "omit"
        : isBrowser
          ? "same-origin"
          : init?.credentials,
    });
  } catch {
    handleStatusNavigation(502, path, skipStatusRedirect);
    throw new ApiHttpError(
      502,
      path,
      `API nedostupné (sieť / gateway): ${path}`,
    );
  }

  if (response.status === 401) {
    notifyUnauthorized();
  }

  if (handleStatusNavigation(response.status, path, skipStatusRedirect)) {
    // Client hard-nav already started; throw instead of hanging the UI forever.
    throw new ApiHttpError(
      response.status,
      path,
      await readErrorMessage(response, path),
    );
  }

  if (!response.ok) {
    throw new ApiHttpError(
      response.status,
      path,
      await readErrorMessage(response, path),
    );
  }

  return parseJson<T>(response, path);
}

export async function apiGet<T>(
  path: string,
  init?: RequestInit,
  accessToken?: string | null,
  options?: ApiRequestOptions,
): Promise<T> {
  return apiRequest<T>(
    path,
    { ...init, method: "GET" },
    undefined,
    accessToken,
    options,
  );
}

export async function apiPost<T>(
  path: string,
  body?: unknown,
  init?: RequestInit,
  accessToken?: string | null,
  options?: ApiRequestOptions,
): Promise<T> {
  return apiRequest<T>(
    path,
    { ...init, method: "POST" },
    body,
    accessToken,
    options,
  );
}

export async function apiPut<T>(
  path: string,
  body?: unknown,
  init?: RequestInit,
  accessToken?: string | null,
  options?: ApiRequestOptions,
): Promise<T> {
  return apiRequest<T>(
    path,
    { ...init, method: "PUT" },
    body,
    accessToken,
    options,
  );
}

export async function apiPatch<T>(
  path: string,
  body?: unknown,
  init?: RequestInit,
  accessToken?: string | null,
  options?: ApiRequestOptions,
): Promise<T> {
  return apiRequest<T>(
    path,
    { ...init, method: "PATCH" },
    body,
    accessToken,
    options,
  );
}

export async function apiDelete<T = void>(
  path: string,
  init?: RequestInit,
  accessToken?: string | null,
  options?: ApiRequestOptions,
): Promise<T> {
  return apiRequest<T>(
    path,
    { ...init, method: "DELETE" },
    undefined,
    accessToken,
    options,
  );
}

export { API_BASE };
