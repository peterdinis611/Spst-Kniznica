import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiHttpError } from "@/lib/api/errors";
import { apiGet, apiPost, apiUrl, withQuery } from "@/lib/api/client";

describe("apiUrl", () => {
  it("joins base and absolute path", () => {
    expect(apiUrl("/api/books")).toMatch(/\/api\/books$/);
  });

  it("normalizes paths without leading slash", () => {
    expect(apiUrl("api/books")).toMatch(/\/api\/books$/);
  });
});

describe("withQuery", () => {
  it("returns path when query is missing", () => {
    expect(withQuery("/api/books")).toBe("/api/books");
  });

  it("skips empty values", () => {
    expect(
      withQuery("/api/books", {
        search: "motor",
        categoryId: "",
        authorId: null,
        page: 1,
      }),
    ).toBe("/api/books?search=motor&page=1");
  });

  it("builds cursor endpoint query", () => {
    expect(
      withQuery("/api/books/cursor", {
        limit: 40,
        cursor: "abc",
        availableOnly: true,
        sortBy: "title",
      }),
    ).toBe(
      "/api/books/cursor?limit=40&cursor=abc&availableOnly=true&sortBy=title",
    );
  });
});

describe("apiGet", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("parses JSON responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    await expect(apiGet<{ ok: boolean }>("/api/health")).resolves.toEqual({
      ok: true,
    });
    expect(fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/health$/),
      expect.objectContaining({ cache: "no-store", method: "GET" }),
    );
  });

  it("lets the browser reuse a public catalog GET", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ items: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await apiGet("/api/books?page=1");

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/books\?page=1$/),
      expect.objectContaining({ cache: "default", method: "GET" }),
    );
  });

  it("keeps bookings on no-store", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ items: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await apiGet("/api/bookings", undefined, undefined, {
      skipStatusRedirect: true,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/bookings$/),
      expect.objectContaining({ cache: "no-store", method: "GET" }),
    );
  });

  it("surfaces API error detail", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            title: "Validation",
            detail: "BorrowerEmail is invalid",
          }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        ),
      ),
    );

    await expect(apiGet("/api/bookings")).rejects.toThrow(
      "BorrowerEmail is invalid",
    );
  });

  it("maps network failures to 502 Slovak error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new TypeError("Failed to fetch")),
    );

    await expect(
      apiGet("/api/books", undefined, undefined, { skipStatusRedirect: true }),
    ).rejects.toSatisfy(
      (err: unknown) =>
        err instanceof ApiHttpError &&
        err.status === 502 &&
        /nedostupné \(sieť \/ gateway\)/i.test(err.message),
    );
  });

  it("maps invalid JSON body to 502", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response("not-json", {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    await expect(
      apiGet("/api/books", undefined, undefined, { skipStatusRedirect: true }),
    ).rejects.toSatisfy(
      (err: unknown) =>
        err instanceof ApiHttpError &&
        err.status === 502 &&
        /invalid JSON/i.test(err.message),
    );
  });

  it("reads first validation error field from errors object", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            title: "Validation",
            errors: { Email: ["Email is invalid."] },
          }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        ),
      ),
    );

    await expect(
      apiPost("/api/bookings", {}, undefined, undefined, {
        skipStatusRedirect: true,
      }),
    ).rejects.toThrow("Email is invalid.");
  });
});
