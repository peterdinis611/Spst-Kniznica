import { afterEach, describe, expect, it, vi } from "vitest";
import { apiGet, apiUrl, withQuery } from "./client";

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
});
