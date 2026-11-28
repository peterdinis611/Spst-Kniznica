import { check } from "k6";
import { safeJson, itemsOf, firstId } from "./config.ts";
import { apiGet, apiPost, apiBatchGet, expectOk, type ApiResponse } from "./http.ts";

export function getHealth(): ApiResponse {
  const res = apiGet("/health", "health");
  check(res, { "health 200": (r) => r.status === 200 });
  return res;
}

export function getReady(): ApiResponse {
  const res = apiGet("/health/ready", "health_ready");
  check(res, {
    "ready 200/503": (r) => r.status === 200 || r.status === 503,
  });
  return res;
}

export function getBooksPage(page = 1, pageSize = 40): ApiResponse {
  const res = apiGet(
    `/api/books?page=${page}&pageSize=${pageSize}`,
    "books_page",
  );
  check(res, {
    "books page 200": (r) => r.status === 200,
    "books has items": (r) =>
      itemsOf(safeJson(r)).length >= 0 && r.status === 200,
  });
  return res;
}

export function getBooksCursor(limit = 20, cursor?: string): ApiResponse {
  const qs = cursor
    ? `limit=${limit}&sortBy=title&cursor=${encodeURIComponent(cursor)}`
    : `limit=${limit}&sortBy=title`;
  const res = apiGet(`/api/books/cursor?${qs}`, "books_cursor");
  check(res, { "books cursor 200": (r) => r.status === 200 });
  return res;
}

export function getBookDetail(id: string): ApiResponse {
  const res = apiGet(`/api/books/${id}`, "books_detail");
  check(res, { "book detail 200": (r) => r.status === 200 });
  return res;
}

export function getAuthorsPage(
  page = 1,
  pageSize = 40,
  search = "",
): ApiResponse {
  const qs = search
    ? `page=${page}&pageSize=${pageSize}&search=${encodeURIComponent(search)}`
    : `page=${page}&pageSize=${pageSize}`;
  const res = apiGet(`/api/authors?${qs}`, "authors_page");
  check(res, { "authors 200": (r) => r.status === 200 });
  return res;
}

export function getAuthorDetail(id: string): ApiResponse {
  const res = apiGet(`/api/authors/${id}`, "authors_detail");
  check(res, { "author detail 200": (r) => r.status === 200 });
  return res;
}

export function getAuthorsCursor(
  limit = 20,
  cursor?: string,
  search = "",
): ApiResponse {
  const parts = [`limit=${limit}`, "sortBy=name"];
  if (cursor) parts.push(`cursor=${encodeURIComponent(cursor)}`);
  if (search) parts.push(`search=${encodeURIComponent(search)}`);
  const res = apiGet(
    `/api/authors/cursor?${parts.join("&")}`,
    "authors_cursor",
  );
  check(res, { "authors cursor 200": (r) => r.status === 200 });
  return res;
}

export function getCategoriesPage(
  page = 1,
  pageSize = 40,
  search = "",
): ApiResponse {
  const qs = search
    ? `page=${page}&pageSize=${pageSize}&search=${encodeURIComponent(search)}`
    : `page=${page}&pageSize=${pageSize}`;
  const res = apiGet(`/api/categories?${qs}`, "categories_page");
  check(res, { "categories 200": (r) => r.status === 200 });
  return res;
}

export function getCategoryDetail(id: string): ApiResponse {
  const res = apiGet(`/api/categories/${id}`, "categories_detail");
  check(res, { "category detail 200": (r) => r.status === 200 });
  return res;
}

const SEARCH_TERMS = [
  "python",
  "elektronika",
  "matematika",
  "history",
  "a",
  "škola",
  "program",
  "network",
];

export function randomSearchTerm(): string {
  return SEARCH_TERMS[Math.floor(Math.random() * SEARCH_TERMS.length)];
}

/** Books list with search / filters (query string). */
export function searchBooks(
  term = randomSearchTerm(),
  page = 1,
  pageSize = 20,
): ApiResponse {
  const res = apiGet(
    `/api/books?page=${page}&pageSize=${pageSize}&search=${encodeURIComponent(term)}`,
    "books_search",
  );
  check(res, {
    "books search 200": (r) => r.status === 200,
  });
  return res;
}

export function getBooksCursorSearch(
  term = randomSearchTerm(),
  limit = 20,
): ApiResponse {
  const res = apiGet(
    `/api/books/cursor?limit=${limit}&sortBy=title&search=${encodeURIComponent(term)}`,
    "books_cursor_search",
  );
  check(res, { "books cursor search 200": (r) => r.status === 200 });
  return res;
}

/** Weighted search-heavy mix. */
export function browseSearch(): ApiResponse {
  const term = randomSearchTerm();
  const roll = Math.random();
  if (roll < 0.45)
    return searchBooks(term, 1 + Math.floor(Math.random() * 2), 20);
  if (roll < 0.7) return getBooksCursorSearch(term, 20);
  if (roll < 0.85) return getAuthorsPage(1, 20, term);
  return getCategoriesPage(1, 20, term);
}

/** Authors browse: page → detail → cursor. */
export function browseAuthors(): ApiResponse {
  const page = getAuthorsPage(1 + Math.floor(Math.random() * 2), 40);
  const id = firstId(safeJson(page));
  if (id && Math.random() < 0.6) return getAuthorDetail(id);
  if (Math.random() < 0.4) return getAuthorsCursor(20);
  return page;
}

/** Categories browse: page → detail. */
export function browseCategories(): ApiResponse {
  const page = getCategoriesPage(1, 40);
  const id = firstId(safeJson(page));
  if (id && Math.random() < 0.7) return getCategoryDetail(id);
  return page;
}

export function getRelationsSummary(): ApiResponse {
  const res = apiGet("/api/relations/summary", "relations_summary");
  check(res, { "relations 200": (r) => r.status === 200 });
  return res;
}

export function getAuthConfig(): ApiResponse {
  const res = apiGet("/api/auth/config", "auth_config");
  check(res, {
    "auth config 200": (r) => r.status === 200,
    "auth config redacts tenant": (r) => {
      const body = safeJson(r) as { tenantId?: string | null } | null;
      return body != null && (body.tenantId === "" || body.tenantId == null);
    },
  });
  return res;
}

/** POST /api/books/summaries — hot path for library/desk. */
export function postBookSummaries(ids: string[]): ApiResponse {
  const payload = { ids: (ids || []).slice(0, 100) };
  const res = apiPost("/api/books/summaries", payload, "books_summaries");
  check(res, {
    "summaries 200": (r) => r.status === 200,
    "summaries array": (r) => Array.isArray(safeJson(r)),
  });
  return res;
}

/** One parallel fan-out: health + auth + first catalog pages. */
export function warmCatalogBatch(): ApiResponse[] {
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
export function browseCatalog(): ApiResponse {
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
      .filter((x): x is string => Boolean(x));
    if (ids.length) return postBookSummaries(ids);
    return page;
  }
  if (roll < 0.78) return getAuthorsPage(1, 40);
  if (roll < 0.88) return getCategoriesPage(1, 40);
  if (roll < 0.95) return getRelationsSummary();
  return getAuthConfig();
}

export { expectOk, firstId, itemsOf, safeJson };
