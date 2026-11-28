/**
 * Authenticated / staff ops helpers (bookings, desk, waitlist, emails, orders).
 */
import { check } from "k6";
import { safeJson, firstId, itemsOf } from "./config.ts";
import { apiGet, apiPost, expectNotAuthError, type ApiResponse } from "./http.ts";
import { getBooksPage } from "./catalog.ts";

export function listBookings(page = 1, pageSize = 10): ApiResponse {
  const res = apiGet(
    `/api/bookings?page=${page}&pageSize=${pageSize}`,
    "bookings_list",
  );
  check(res, { "bookings list 200": (r) => r.status === 200 });
  return res;
}

export function createBooking(bookId: string): ApiResponse {
  const res = apiPost("/api/bookings", { bookId }, "bookings_create");
  check(res, {
    "bookings create not auth error": (r) =>
      r.status !== 401 && r.status !== 403 && r.status < 500,
  });
  return res;
}

export function deskDaily(): ApiResponse {
  const res = apiGet("/api/bookings/desk/daily", "desk_daily");
  expectNotAuthError(res, "desk");
  check(res, {
    "desk daily ok/forbidden": (r) =>
      r.status === 200 || r.status === 403 || r.status === 401,
  });
  return res;
}

export function listWaitlist(limit = 50): ApiResponse {
  const res = apiGet(`/api/bookings/waitlist?limit=${limit}`, "waitlist_list");
  expectNotAuthError(res, "waitlist");
  return res;
}

export function loanPolicy(): ApiResponse {
  const res = apiGet("/api/bookings/policy", "loan_policy");
  check(res, { "policy 200": (r) => r.status === 200 });
  return res;
}

export function emailsStatus(): ApiResponse {
  const res = apiGet("/api/emails/status", "emails_status");
  expectNotAuthError(res, "emails");
  return res;
}

export function emailsList(take = 20): ApiResponse {
  const res = apiGet(`/api/emails?take=${take}`, "emails_list");
  expectNotAuthError(res, "emails_list");
  return res;
}

export function ordersQueue(): ApiResponse {
  const res = apiGet("/api/orders/queue", "orders_queue");
  expectNotAuthError(res, "orders");
  return res;
}

export function booksExport(take = 50): ApiResponse {
  const res = apiGet(
    `/api/books/export?format=csv&take=${take}`,
    "books_export",
  );
  check(res, {
    "export not unauthorized": (r) => r.status !== 401,
    "export ok or limited": (r) =>
      r.status === 200 || r.status === 429 || r.status === 403,
  });
  return res;
}

export function listFavorites(): ApiResponse {
  const res = apiGet("/api/bookings/favorites", "favorites_list");
  check(res, {
    "favorites ok/forbidden": (r) =>
      r.status === 200 || r.status === 401 || r.status === 403,
  });
  return res;
}

export function waitlistMine(): ApiResponse {
  const res = apiGet("/api/bookings/waitlist/mine", "waitlist_mine");
  check(res, {
    "waitlist/mine ok/forbidden": (r) =>
      r.status === 200 || r.status === 401 || r.status === 403,
  });
  return res;
}

export function deskDailyCsv(): ApiResponse {
  const res = apiGet("/api/bookings/desk/daily.csv", "desk_daily_csv");
  expectNotAuthError(res, "desk_csv");
  check(res, {
    "desk csv ok/forbidden": (r) =>
      r.status === 200 || r.status === 401 || r.status === 403,
  });
  return res;
}

export function authMe(): ApiResponse {
  const res = apiGet("/api/auth/me", "auth_me");
  check(res, {
    "auth me reachable": (r) =>
      r.status === 200 || r.status === 401 || r.status === 403,
  });
  return res;
}

/** Soft reader extras: favorites + my waitlist + me. */
export function readerExtrasFlow(): void {
  authMe();
  listFavorites();
  waitlistMine();
}

/** Reader-ish flow: catalog → bookings → soft create. */
export function readerOpsFlow(): string | null {
  const books = getBooksPage(1, 5);
  const bookId = firstId(safeJson(books));
  listBookings(1, 10);
  if (bookId) createBooking(bookId);
  return bookId;
}

/** Staff ops mix: desk + waitlist + policy + summaries of open bookings. */
export function staffOpsFlow(): void {
  deskDaily();
  listWaitlist(30);
  loanPolicy();
  const bookings = listBookings(1, 20);
  const ids = itemsOf(safeJson(bookings))
    .map((b) => b.bookId || b.BookId)
    .filter((x): x is string => Boolean(x))
    .slice(0, 20);
  if (ids.length) {
    apiPost("/api/books/summaries", { ids }, "staff_summaries");
  }
}
