import { HttpError } from "react-admin";
import { apiUrl, withQuery, type ApiQuery } from "@/lib/api/client";
import { ApiHttpError } from "@/lib/api/errors";
import { parseJsonText } from "@/lib/api/parse-json";
import {
  messageFromProblemDetails,
  parseProblemDetails,
} from "@/lib/api/problem-details";

function readAdminErrorMessage(text: string, fallback: string): string {
  const body = parseProblemDetails(text);
  if (body) return messageFromProblemDetails(body, fallback).slice(0, 180);
  return text.slice(0, 180) || fallback;
}

function parseAdminJson<T>(text: string, path: string): T {
  try {
    return parseJsonText<T>(text, path, undefined as T);
  } catch (error) {
    if (error instanceof ApiHttpError) {
      throw new HttpError(error.message, 502);
    }
    throw error;
  }
}

export async function adminHttp<T>(
  path: string,
  init?: RequestInit,
  body?: unknown,
): Promise<T> {
  const hasBody = body !== undefined;
  const headers = new Headers(init?.headers);
  headers.set("Accept", "application/json");
  if (hasBody && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const response = await fetch(apiUrl(path), {
    ...init,
    headers,
    body: hasBody ? JSON.stringify(body) : init?.body,
    cache: "no-store",
    credentials: "same-origin",
  });

  if (!response.ok) {
    let message = response.statusText || `HTTP ${response.status}`;
    try {
      const text = await response.text();
      if (text) {
        message = readAdminErrorMessage(text, message);
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
  return parseAdminJson<T>(text, path);
}

export function adminQuery(path: string, query?: ApiQuery) {
  return withQuery(path, query);
}

/** Parse Content-Disposition filename for export downloads. */
export function parseContentDispositionFileName(
  disposition: string | null | undefined,
  fallbackFileName: string,
): string {
  if (!disposition) return fallbackFileName;
  const match = /filename\*?=(?:UTF-8''|")?([^\";]+)/i.exec(disposition);
  if (!match?.[1]) return fallbackFileName;
  try {
    return decodeURIComponent(match[1].replace(/"/g, ""));
  } catch {
    return match[1].replace(/"/g, "") || fallbackFileName;
  }
}

/** Download a binary/file response (CSV/XML export). */
export async function adminHttpDownload(
  path: string,
  fallbackFileName: string,
): Promise<{ fileName: string; blob: Blob }> {
  const response = await fetch(apiUrl(path), {
    method: "GET",
    headers: { Accept: "text/csv, application/xml, */*" },
    cache: "no-store",
    credentials: "same-origin",
  });

  if (!response.ok) {
    let message = response.statusText || `HTTP ${response.status}`;
    try {
      const text = await response.text();
      if (text) message = readAdminErrorMessage(text, message);
    } catch {
      // keep statusText
    }
    throw new HttpError(message, response.status);
  }

  const fileName = parseContentDispositionFileName(
    response.headers.get("content-disposition"),
    fallbackFileName,
  );

  return { fileName, blob: await response.blob() };
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
      if (text) message = readAdminErrorMessage(text, message);
    } catch {
      // keep statusText
    }
    throw new HttpError(message, response.status);
  }

  if (response.status === 204) return undefined as T;
  const text = await response.text();
  return parseAdminJson<T>(text, path);
}
