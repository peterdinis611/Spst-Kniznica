/**
 * Authenticated / staff ops helpers (bookings, desk, waitlist, emails, orders).
 */
import { check } from "k6";
import { safeJson, firstId, itemsOf } from "./config.js";
import { apiGet, apiPost, expectNotAuthError } from "./http.js";
import { getBooksPage } from "./catalog.js";

export function listBookings(page = 1, pageSize = 10) {
  const res = apiGet(
    `/api/bookings?page=${page}&pageSize=${pageSize}`,
    "bookings_list",
  );
  check(res, { "bookings list 200": (r) => r.status === 200 });
  return res;
}

export function createBooking(bookId) {
  const res = apiPost(
    "/api/bookings",
    { bookId },
    "bookings_create",
  );
  check(res, {
    "bookings create not auth error": (r) =>
      r.status !== 401 && r.status !== 403 && r.status < 500,
  });
  return res;
}

export function deskDaily() {
  const res = apiGet("/api/bookings/desk/daily", "desk_daily");
  expectNotAuthError(res, "desk");
  check(res, {
    "desk daily ok/forbidden": (r) =>
      r.status === 200 || r.status === 403 || r.status === 401,
  });
  return res;
}

export function listWaitlist(limit = 50) {
  const res = apiGet(`/api/bookings/waitlist?limit=${limit}`, "waitlist_list");
  expectNotAuthError(res, "waitlist");
  return res;
}

export function loanPolicy() {
  const res = apiGet("/api/bookings/policy", "loan_policy");
  check(res, { "policy 200": (r) => r.status === 200 });
  return res;
}

export function emailsStatus() {
  const res = apiGet("/api/emails/status", "emails_status");
  expectNotAuthError(res, "emails");
  return res;
}

export function emailsList(take = 20) {
  const res = apiGet(`/api/emails?take=${take}`, "emails_list");
  expectNotAuthError(res, "emails_list");
  return res;
}

export function ordersQueue() {
  const res = apiGet("/api/orders/queue", "orders_queue");
  expectNotAuthError(res, "orders");
  return res;
}

export function booksExport(take = 50) {
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

/** Reader-ish flow: catalog → bookings → soft create. */
export function readerOpsFlow() {
  const books = getBooksPage(1, 5);
  const bookId = firstId(safeJson(books));
  listBookings(1, 10);
  if (bookId) createBooking(bookId);
  return bookId;
}

/** Staff ops mix: desk + waitlist + policy + summaries of open bookings. */
export function staffOpsFlow() {
  deskDaily();
  listWaitlist(30);
  loanPolicy();
  const bookings = listBookings(1, 20);
  const ids = itemsOf(safeJson(bookings))
    .map((b) => b.bookId || b.BookId)
    .filter(Boolean)
    .slice(0, 20);
  if (ids.length) {
    apiPost("/api/books/summaries", { ids }, "staff_summaries");
  }
}
