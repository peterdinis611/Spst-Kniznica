import { HttpError } from "react-admin";
import { apiUrl, withQuery, type ApiQuery } from "@/lib/api/client";

export async function adminHttp<T>(
  path: string,
  init?: RequestInit,
  body?: unknown,
): Promise<T> {
  const hasBody = body !== undefined;
  const response = await fetch(apiUrl(path), {
    ...init,
    headers: {
      Accept: "application/json",
      ...(hasBody ? { "Content-Type": "application/json" } : {}),
      ...(init?.headers as Record<string, string> | undefined),
    },
    body: hasBody ? JSON.stringify(body) : init?.body,
    cache: "no-store",
    credentials: "same-origin",
  });

  if (!response.ok) {
    let message = response.statusText || `HTTP ${response.status}`;
    try {
      const text = await response.text();
      if (text) {
        try {
          const json = JSON.parse(text) as {
            detail?: string;
            title?: string;
          };
          message = json.detail || json.title || text.slice(0, 180);
        } catch {
          message = text.slice(0, 180);
        }
      }
    } catch {
      // keep statusText
    }
    throw new HttpError(message, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

export function adminQuery(path: string, query?: ApiQuery) {
  return withQuery(path, query);
}

/** Multipart upload (do not set Content-Type — browser sets boundary). */
export async function adminHttpForm<T>(
  path: string,
  formData: FormData,
  method: "POST" | "PUT" = "POST",
): Promise<T> {
  const response = await fetch(apiUrl(path), {
    method,
    body: formData,
    headers: { Accept: "application/json" },
    cache: "no-store",
    credentials: "same-origin",
  });

  if (!response.ok) {
    let message = response.statusText || `HTTP ${response.status}`;
    try {
      const text = await response.text();
      if (text) {
        try {
          const json = JSON.parse(text) as { detail?: string; title?: string };
          message = json.detail || json.title || text.slice(0, 180);
        } catch {
          message = text.slice(0, 180);
        }
      }
    } catch {
      // keep statusText
    }
    throw new HttpError(message, response.status);
  }

  if (response.status === 204) return undefined as T;
  const text = await response.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}
