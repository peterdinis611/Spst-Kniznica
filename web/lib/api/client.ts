import { UNAUTHORIZED_EVENT } from "@/lib/auth/session-constants";

const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5200"
).replace(/\/$/, "");

const isBrowser = typeof window !== "undefined";

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
  // Never echo tokens / large dumps into UI
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
    throw new Error(`API invalid JSON: ${path}`);
  }
}

function resolveAccessToken(accessToken?: string | null): string | undefined {
  const explicit = accessToken?.trim();
  if (explicit) return explicit;
  // Browser: BFF cookie is attached by /api/bff (no Authorization from JS).
  // Server: callers must pass accessToken or readSessionAccessToken() in the action.
  return undefined;
}

function notifyUnauthorized() {
  if (!isBrowser) return;
  window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
}

async function apiRequest<T>(
  path: string,
  init?: RequestInit,
  body?: unknown,
  accessToken?: string | null,
): Promise<T> {
  const hasBody = body !== undefined;
  const token = resolveAccessToken(accessToken);

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(hasBody ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(init?.headers as Record<string, string> | undefined),
  };

  const response = await fetch(apiUrl(path), {
    ...init,
    headers,
    body: hasBody ? JSON.stringify(body) : init?.body,
    cache: "no-store",
    credentials: isBrowser ? "same-origin" : init?.credentials,
  });

  if (response.status === 401) {
    notifyUnauthorized();
  }

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, path));
  }

  return parseJson<T>(response, path);
}

export async function apiGet<T>(
  path: string,
  init?: RequestInit,
  accessToken?: string | null,
): Promise<T> {
  return apiRequest<T>(path, { ...init, method: "GET" }, undefined, accessToken);
}

export async function apiPost<T>(
  path: string,
  body?: unknown,
  init?: RequestInit,
  accessToken?: string | null,
): Promise<T> {
  return apiRequest<T>(path, { ...init, method: "POST" }, body, accessToken);
}

export async function apiPut<T>(
  path: string,
  body?: unknown,
  init?: RequestInit,
  accessToken?: string | null,
): Promise<T> {
  return apiRequest<T>(path, { ...init, method: "PUT" }, body, accessToken);
}

export async function apiPatch<T>(
  path: string,
  body?: unknown,
  init?: RequestInit,
): Promise<T> {
  return apiRequest<T>(path, { ...init, method: "PATCH" }, body);
}

export async function apiDelete<T = void>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  return apiRequest<T>(path, { ...init, method: "DELETE" });
}

export { API_BASE };
