import { afterEach, describe, expect, it, vi } from "vitest";
import { HttpError } from "react-admin";
import {
  adminHttp,
  adminHttpDownload,
  adminQuery,
  parseContentDispositionFileName,
} from "@/lib/admin/http";

describe("parseContentDispositionFileName", () => {
  it("uses fallback when header missing", () => {
    expect(parseContentDispositionFileName(null, "fallback.csv")).toBe(
      "fallback.csv",
    );
  });

  it("parses quoted filename", () => {
    expect(
      parseContentDispositionFileName(
        'attachment; filename="books-export.csv"',
        "x.csv",
      ),
    ).toBe("books-export.csv");
  });

  it("parses RFC5987 filename*", () => {
    expect(
      parseContentDispositionFileName(
        "attachment; filename*=UTF-8''knihy%20export.csv",
        "x.csv",
      ),
    ).toBe("knihy export.csv");
  });
});

describe("adminHttpDownload", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns blob and filename from Content-Disposition", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response("a,b\n1,2\n", {
          status: 200,
          headers: {
            "Content-Type": "text/csv",
            "Content-Disposition": 'attachment; filename="books.csv"',
          },
        }),
      ),
    );

    const result = await adminHttpDownload("/api/books/export", "fallback.csv");
    expect(result.fileName).toBe("books.csv");
    expect(await result.blob.text()).toContain("a,b");
  });

  it("throws HttpError with API detail", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ detail: "Forbidden export" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    await expect(
      adminHttpDownload("/api/books/export", "x.csv"),
    ).rejects.toThrow("Forbidden export");
  });
});

describe("adminHttp", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("parses JSON body on success", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ ok: true, count: 2 }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    await expect(adminHttp<{ ok: boolean; count: number }>("/api/admin/ping")).resolves.toEqual({
      ok: true,
      count: 2,
    });
  });

  it("returns undefined on 204", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status: 204 })),
    );

    await expect(adminHttp("/api/admin/x")).resolves.toBeUndefined();
  });

  it("throws HttpError with detail from JSON error body", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ detail: "Staff only" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    await expect(adminHttp("/api/admin/overview")).rejects.toSatisfy(
      (err: unknown) => err instanceof HttpError && err.message === "Staff only",
    );
  });
});

describe("adminQuery", () => {
  it("appends export format and take", () => {
    expect(
      adminQuery("/api/books/export", { format: "xlsx", take: 500 }),
    ).toBe("/api/books/export?format=xlsx&take=500");
  });
});
