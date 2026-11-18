import http from "k6/http";
import { check } from "k6";
import { BASE_URL, authHeaders } from "./config.js";

const headers = () => authHeaders();

export function getHealth() {
  const res = http.get(`${BASE_URL}/health`, { headers: headers(), tags: { name: "health" } });
  check(res, { "health 200": (r) => r.status === 200 });
  return res;
}

export function getBooksPage(page = 1, pageSize = 40) {
  const res = http.get(
    `${BASE_URL}/api/books?page=${page}&pageSize=${pageSize}`,
    { headers: headers(), tags: { name: "books_page" } },
  );
  check(res, {
    "books page 200": (r) => r.status === 200,
    "books has items": (r) => {
      try {
        const body = r.json();
        return Array.isArray(body.items) || Array.isArray(body.Items);
      } catch {
        return false;
      }
    },
  });
  return res;
}

export function getBooksCursor(limit = 20) {
  const res = http.get(
    `${BASE_URL}/api/books/cursor?limit=${limit}&sortBy=title`,
    { headers: headers(), tags: { name: "books_cursor" } },
  );
  check(res, { "books cursor 200": (r) => r.status === 200 });
  return res;
}

export function getAuthorsPage(page = 1, pageSize = 40) {
  const res = http.get(
    `${BASE_URL}/api/authors?page=${page}&pageSize=${pageSize}`,
    { headers: headers(), tags: { name: "authors_page" } },
  );
  check(res, { "authors 200": (r) => r.status === 200 });
  return res;
}

export function getCategoriesPage(page = 1, pageSize = 40) {
  const res = http.get(
    `${BASE_URL}/api/categories?page=${page}&pageSize=${pageSize}`,
    { headers: headers(), tags: { name: "categories_page" } },
  );
  check(res, { "categories 200": (r) => r.status === 200 });
  return res;
}

export function getRelationsSummary() {
  const res = http.get(`${BASE_URL}/api/relations/summary`, {
    headers: headers(),
    tags: { name: "relations_summary" },
  });
  check(res, { "relations 200": (r) => r.status === 200 });
  return res;
}

export function getAuthConfig() {
  const res = http.get(`${BASE_URL}/api/auth/config`, {
    headers: headers(),
    tags: { name: "auth_config" },
  });
  check(res, { "auth config 200": (r) => r.status === 200 });
  return res;
}

/** Weighted public catalog mix (~realistic browse). */
export function browseCatalog() {
  const roll = Math.random();
  if (roll < 0.35) return getBooksPage(1 + Math.floor(Math.random() * 3), 40);
  if (roll < 0.55) return getBooksCursor(20);
  if (roll < 0.7) return getAuthorsPage(1, 40);
  if (roll < 0.85) return getCategoriesPage(1, 40);
  if (roll < 0.95) return getRelationsSummary();
  return getAuthConfig();
}
