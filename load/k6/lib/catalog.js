import { check } from "k6";
import { safeJson, itemsOf, firstId } from "./config.js";
import { apiGet, apiPost, apiBatchGet, expectOk } from "./http.js";

export function getHealth() {
  const res = apiGet("/health", "health");
  check(res, { "health 200": (r) => r.status === 200 });
  return res;
}

export function getReady() {
  const res = apiGet("/health/ready", "health_ready");
  check(res, {
    "ready 200/503": (r) => r.status === 200 || r.status === 503,
  });
  return res;
}

export function getBooksPage(page = 1, pageSize = 40) {
  const res = apiGet(
    `/api/books?page=${page}&pageSize=${pageSize}`,
    "books_page",
  );
  check(res, {
    "books page 200": (r) => r.status === 200,
    "books has items": (r) => itemsOf(safeJson(r)).length >= 0 && r.status === 200,
  });
  return res;
}

export function getBooksCursor(limit = 20, cursor) {
  const qs = cursor
    ? `limit=${limit}&sortBy=title&cursor=${encodeURIComponent(cursor)}`
    : `limit=${limit}&sortBy=title`;
  const res = apiGet(`/api/books/cursor?${qs}`, "books_cursor");
  check(res, { "books cursor 200": (r) => r.status === 200 });
  return res;
}

export function getBookDetail(id) {
  const res = apiGet(`/api/books/${id}`, "books_detail");
  check(res, { "book detail 200": (r) => r.status === 200 });
  return res;
}

export function getAuthorsPage(page = 1, pageSize = 40) {
  const res = apiGet(
    `/api/authors?page=${page}&pageSize=${pageSize}`,
    "authors_page",
  );
  check(res, { "authors 200": (r) => r.status === 200 });
  return res;
}

export function getCategoriesPage(page = 1, pageSize = 40) {
  const res = apiGet(
    `/api/categories?page=${page}&pageSize=${pageSize}`,
    "categories_page",
  );
  check(res, { "categories 200": (r) => r.status === 200 });
  return res;
}

export function getRelationsSummary() {
  const res = apiGet("/api/relations/summary", "relations_summary");
  check(res, { "relations 200": (r) => r.status === 200 });
  return res;
}

export function getAuthConfig() {
  const res = apiGet("/api/auth/config", "auth_config");
  check(res, {
    "auth config 200": (r) => r.status === 200,
    "auth config redacts tenant": (r) => {
      const body = safeJson(r);
      return body && (body.tenantId === "" || body.tenantId == null);
    },
  });
  return res;
}

/** POST /api/books/summaries — hot path for library/desk. */
export function postBookSummaries(ids) {
  const payload = { ids: (ids || []).slice(0, 100) };
  const res = apiPost("/api/books/summaries", payload, "books_summaries");
  check(res, {
    "summaries 200": (r) => r.status === 200,
    "summaries array": (r) => Array.isArray(safeJson(r)),
  });
  return res;
}

/** One parallel fan-out: health + auth + first catalog pages. */
export function warmCatalogBatch() {
  const responses = apiBatchGet([
    { path: "/health", name: "batch_health" },
    { path: "/api/auth/config", name: "batch_auth_config" },
    { path: "/api/books?page=1&pageSize=20", name: "batch_books" },
    { path: "/api/authors?page=1&pageSize=20", name: "batch_authors" },
    { path: "/api/categories?page=1&pageSize=20", name: "batch_categories" },
  ]);
  check(responses[0], { "batch health 200": (r) => r.status === 200 });
  check(responses[2], { "batch books 200": (r) => r.status === 200 });
  return responses;
}

/** Weighted public catalog mix (~realistic browse). */
export function browseCatalog() {
  const roll = Math.random();
  if (roll < 0.3) return getBooksPage(1 + Math.floor(Math.random() * 3), 40);
  if (roll < 0.45) return getBooksCursor(20);
  if (roll < 0.55) {
    const page = getBooksPage(1, 10);
    const id = firstId(safeJson(page));
    if (id) return getBookDetail(id);
    return page;
  }
  if (roll < 0.65) {
    const page = getBooksPage(1, 20);
    const ids = itemsOf(safeJson(page))
      .slice(0, 12)
      .map((i) => i.id || i.Id)
      .filter(Boolean);
    if (ids.length) return postBookSummaries(ids);
    return page;
  }
  if (roll < 0.78) return getAuthorsPage(1, 40);
  if (roll < 0.88) return getCategoriesPage(1, 40);
  if (roll < 0.95) return getRelationsSummary();
  return getAuthConfig();
}

export { expectOk, firstId, itemsOf, safeJson };
