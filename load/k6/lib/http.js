/**
 * Thin tagged HTTP helpers — consistent tags + auth headers.
 */
import http from "k6/http";
import { check } from "k6";
import { BASE_URL, WEB_BFF, authHeaders } from "./config.js";

export function apiGet(path, name, opts = {}) {
  const url = path.startsWith("http") ? path : `${BASE_URL}${path}`;
  return http.get(url, {
    headers: authHeaders(opts.headers),
    tags: { name: name || path },
    ...opts,
  });
}

export function apiPost(path, body, name, opts = {}) {
  const url = path.startsWith("http") ? path : `${BASE_URL}${path}`;
  return http.post(url, typeof body === "string" ? body : JSON.stringify(body ?? {}), {
    headers: authHeaders(opts.headers),
    tags: { name: name || path },
    ...opts,
  });
}

/** Parallel GET batch — one round-trip for multiple endpoints. */
export function apiBatchGet(requests) {
  const payloads = requests.map(({ path, name }) => [
    "GET",
    path.startsWith("http") ? path : `${BASE_URL}${path}`,
    null,
    { headers: authHeaders(), tags: { name: name || path } },
  ]);
  return http.batch(payloads);
}

export function bffGet(path, name) {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return http.get(`${WEB_BFF}/api/bff${normalized}`, {
    headers: authHeaders(),
    tags: { name: name || `bff_${normalized}` },
  });
}

export function bffPost(path, body, name) {
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

export function expectOk(res, label = "ok") {
  return check(res, {
    [`${label} 2xx`]: (r) => r.status >= 200 && r.status < 300,
  });
}

export function expectNotAuthError(res, label = "auth") {
  return check(res, {
    [`${label} not 401/403`]: (r) => r.status !== 401 && r.status !== 403,
  });
}
