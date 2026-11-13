const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5200"
).replace(/\/$/, "");

export function apiUrl(path: string): string {
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
        if (typeof message === "string" && message.trim()) return message;
      }
    }
    if (
      typeof body.detail === "string" &&
      body.detail.trim() &&
      body.detail !== body.title
    ) {
      return body.detail;
    }
    if (typeof body.title === "string" && body.title.trim()) return body.title;
  } catch {
    return text.slice(0, 180);
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

function authHeaders(accessToken?: string | null): Record<string, string> {
  const token = accessToken?.trim();
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

async function apiRequest<T>(
  path: string,
  init?: RequestInit,
  body?: unknown,
  accessToken?: string | null,
): Promise<T> {
  const hasBody = body !== undefined;
  const response = await fetch(apiUrl(path), {
    ...init,
    headers: {
      Accept: "application/json",
      ...(hasBody ? { "Content-Type": "application/json" } : {}),
      ...authHeaders(accessToken),
      ...init?.headers,
    },
    body: hasBody ? JSON.stringify(body) : init?.body,
    cache: "no-store",
  });

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
