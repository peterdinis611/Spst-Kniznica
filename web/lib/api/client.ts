import { UNAUTHORIZED_EVENT } from "@/lib/auth/session-constants";
import { ApiHttpError } from "@/lib/api/errors";
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

/** Browser → same-origin BFF; server → gateway directly. */
export function apiUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (isBrowser) {
    return `/api/bff${normalized}`;
  }
  return `${API_BASE}${normalized}`;
}

/** Direct gateway URL (health probes, server-only). */
export function gatewayUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE}${normalized}`;
}

export type ApiQuery = Record<
  string,
  string | number | boolean | null | undefined
>;

export function withQuery(path: string, query?: ApiQuery): string {
  if (!query) return path;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") continue;
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

  try {
    const body = JSON.parse(text) as {
      title?: string;
      detail?: string;
      errors?: Record<string, string[] | string>;
    };
    const errors = body.errors;
    if (errors && typeof errors === "object") {
      for (const value of Object.values(errors)) {
        const message = Array.isArray(value) ? value[0] : value;
        if (typeof message === "string" && message.trim()) {
          return sanitizeErrorText(message);
        }
      }
    }
    if (
      typeof body.detail === "string" &&
      body.detail.trim() &&
      body.detail !== body.title
    ) {
      return sanitizeErrorText(body.detail);
    }
    if (typeof body.title === "string" && body.title.trim()) {
      return sanitizeErrorText(body.title);
    }
  } catch {
    return sanitizeErrorText(text);
  }

  return fallback;
}

async function parseJson<T>(response: Response, path: string): Promise<T> {
  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  if (!text) {
    return undefined as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new ApiHttpError(502, path, `API invalid JSON: ${path}`);
  }
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

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(hasBody ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(init?.headers as Record<string, string> | undefined),
  };

  let response: Response;
  try {
    response = await fetch(apiUrl(path), {
      ...init,
      headers,
      body: hasBody ? JSON.stringify(body) : init?.body,
      cache: "no-store",
      credentials: isBrowser ? "same-origin" : init?.credentials,
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
