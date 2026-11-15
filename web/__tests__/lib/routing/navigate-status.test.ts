import { afterEach, describe, expect, it, vi } from "vitest";
import {
  hrefForHttpStatus,
  shouldRedirectToStatusPage,
  shouldServerRedirectToStatusPage,
} from "@/lib/routing/navigate-status";

describe("hrefForHttpStatus", () => {
  it("maps known codes to status routes", () => {
    expect(hrefForHttpStatus(401)).toBe("/401");
    expect(hrefForHttpStatus(404)).toBe("/404");
    expect(hrefForHttpStatus(503)).toBe("/503");
  });

  it("adds safe next query for 401", () => {
    expect(hrefForHttpStatus(401, "/books")).toBe("/401?next=%2Fbooks");
  });

  it("returns null for unknown codes", () => {
    expect(hrefForHttpStatus(418)).toBeNull();
  });
});

describe("shouldRedirectToStatusPage", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("redirects gateway failures in the browser", () => {
    vi.stubGlobal("window", {
      location: { pathname: "/books" },
    });

    expect(shouldRedirectToStatusPage(401, "/api/books")).toBe(true);
    expect(shouldRedirectToStatusPage(502, "/api/books")).toBe(true);
    expect(shouldRedirectToStatusPage(503, "/api/books")).toBe(true);
  });

  it("skips auth bootstrap paths and non-gateway codes", () => {
    vi.stubGlobal("window", {
      location: { pathname: "/books" },
    });

    expect(shouldRedirectToStatusPage(401, "/api/auth/me")).toBe(false);
    expect(shouldRedirectToStatusPage(404, "/api/books")).toBe(false);
    expect(shouldRedirectToStatusPage(500, "/api/books")).toBe(false);
  });
});

describe("shouldServerRedirectToStatusPage", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("redirects gateway statuses when window is absent", () => {
    vi.stubGlobal("window", undefined);

    expect(shouldServerRedirectToStatusPage(401, "/api/books")).toBe(true);
    expect(shouldServerRedirectToStatusPage(503, "/api/categories")).toBe(true);
  });

  it("skips bootstrap paths when window is absent", () => {
    vi.stubGlobal("window", undefined);

    expect(shouldServerRedirectToStatusPage(503, "/health")).toBe(false);
    expect(shouldServerRedirectToStatusPage(401, "/api/auth/session")).toBe(
      false,
    );
  });

  it("never redirects in the browser", () => {
    vi.stubGlobal("window", { location: { pathname: "/books" } });
    expect(shouldServerRedirectToStatusPage(503, "/api/books")).toBe(false);
  });
});
