/**
 * Thin tagged HTTP helpers — consistent tags + auth headers.
 */
import http, { type RefinedResponse, type ResponseType } from "k6/http";
import { check } from "k6";
import { BASE_URL, WEB_BFF, authHeaders } from "./config.ts";

export type ApiResponse = RefinedResponse<ResponseType | undefined>;

type RequestOpts = {
  headers?: Record<string, string>;
  [key: string]: unknown;
};

export function apiGet(
  path: string,
  name?: string,
  opts: RequestOpts = {},
): ApiResponse {
  const url = path.startsWith("http") ? path : `${BASE_URL}${path}`;
  return http.get(url, {
    headers: authHeaders(opts.headers),
    tags: { name: name || path },
    ...opts,
  });
}

export function apiPost(
  path: string,
  body: unknown,
  name?: string,
  opts: RequestOpts = {},
): ApiResponse {
  const url = path.startsWith("http") ? path : `${BASE_URL}${path}`;
  return http.post(
    url,
    typeof body === "string" ? body : JSON.stringify(body ?? {}),
    {
      headers: authHeaders(opts.headers),
      tags: { name: name || path },
      ...opts,
    },
  );
}

/** Parallel GET batch — one round-trip for multiple endpoints. */
export function apiBatchGet(
  requests: Array<{ path: string; name?: string }>,
): ApiResponse[] {
  const payloads = requests.map(({ path, name }) => [
    "GET",
    path.startsWith("http") ? path : `${BASE_URL}${path}`,
    null,
    { headers: authHeaders(), tags: { name: name || path } },
  ]);
  return http.batch(payloads as Parameters<typeof http.batch>[0]) as ApiResponse[];
}

export function bffGet(path: string, name?: string): ApiResponse {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return http.get(`${WEB_BFF}/api/bff${normalized}`, {
    headers: authHeaders(),
    tags: { name: name || `bff_${normalized}` },
  });
}

export function bffPost(
  path: string,
  body: unknown,
  name?: string,
): ApiResponse {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return http.post(
    `${WEB_BFF}/api/bff${normalized}`,
    typeof body === "string" ? body : JSON.stringify(body ?? {}),
    {
      headers: authHeaders(),
      tags: { name: name || `bff_${normalized}` },
    },
  );
}

export function expectOk(res: ApiResponse, label = "ok"): boolean {
  return check(res, {
    [`${label} 2xx`]: (r) => r.status >= 200 && r.status < 300,
  });
}

export function expectNotAuthError(
  res: ApiResponse,
  label = "auth",
): boolean {
  return check(res, {
    [`${label} not 401/403`]: (r) => r.status !== 401 && r.status !== 403,
  });
}
